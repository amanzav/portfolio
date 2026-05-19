import {
  Section,
  TLDR,
  TLDRItem,
  ASCIIDiagram,
  Callout,
  CodeBlock,
  Footnotes,
  Fn,
  FootnoteRef,
  InlineCode,
  BarChart,
} from "@/components/blog";

export function Ford2024Post() {
  return (
    <>
      <TLDR>
        <TLDRItem>
          Owned the C++ TPMS interrupt path on{" "}
          <strong>1.2M production cars</strong>, cutting puncture-alert
          latency from <strong>1.4 s to 612 ms</strong> and clearing the
          FMVSS 138 federal safety gate before model-year freeze.
        </TLDRItem>
        <TLDRItem>
          Solo-built a graph-based fuel-efficient route ranker in C++ for the{" "}
          <strong>2027 F-150 and Mach-E lineup</strong> (~380K vehicles/yr);
          cut average detour distance by <strong>41%</strong>. Ships next
          model year.
        </TLDRItem>
        <TLDRItem>
          Built an auto-triage pipeline on 230 firmware test rigs ingesting
          ~14K Kafka events/hr, tagging crashes / leaks / threading bugs and
          routing to owners. PR-review time across 40 engineers dropped{" "}
          <strong>6h 20m → 3h 25m</strong>.
        </TLDRItem>
        <TLDRItem>
          Stack: C++17, embedded ISRs, CAN bus, Kafka, contraction
          hierarchies, A*.
        </TLDRItem>
      </TLDR>

      <Section number="01" label="context" title="Shipping in something with wheels">
        <p>
          This was my first time writing software that ships in something
          with wheels. Two things made it noticeably harder than my prior
          internships.
        </p>
        <p>
          First, <strong>real-time C++ has no escape hatch</strong>. A web
          service that takes 200 ms longer is a Datadog alert. A tire-pressure
          ISR that takes 200 ms longer can fail a federal compliance test,
          and if it fails after model-year freeze, the cost is measured in
          millions of dollars and a quarter of slipped revenue. The blast
          radius forces a different work style — instrument first, hypothesize
          second, change code third.
        </p>
        <p>
          Second, <strong>the review process is heavy by design</strong>.
          Every diff that touches a safety path needs two reviewers from the
          embedded platform team, a static-analysis pass (Coverity +
          MISRA-C++), and a hardware-in-the-loop run on the bench rig. The
          auto-triage project came out of pure frustration with how long that
          loop took.
        </p>
      </Section>

      <Section number="02" label="safety" title="TPMS interrupt path">
        <p>
          Tire-Pressure Monitoring Systems are federally mandated in the US
          under <strong>FMVSS 138</strong>.<FootnoteRef n={1} /> Each wheel
          has a small battery-powered sensor that radios pressure readings to
          a receiver in the body control module. When pressure drops below
          the threshold, the driver gets an amber dashboard warning. The
          regulation specifies a maximum <em>detection window</em>, not a
          per-event latency — but slow per-event latency eats into that
          window when you stack averaging filters on top.
        </p>
        <ASCIIDiagram
          number="01"
          caption="Baseline TPMS interrupt path. Three things were eating budget — see annotations."
        >
{`  wheel sensor
       │  RF (315 MHz, ~1 Hz heartbeat)
       ▼
  ┌──────────────┐      ┌─────────────────┐
  │ RF receiver  │ ───▶ │ ISR (low prio)  │ ◀── memcpy of 64 B frame
  └──────────────┘      └────────┬────────┘
                                 │ queued
                                 ▼
                        ┌──────────────────────┐
                        │ polling loop @ 5 Hz  │ ◀── up to 200 ms wait
                        └──────────┬───────────┘
                                   │ CAN frame (0x3C2)
                                   ▼
                        ┌──────────────────────┐
                        │ cluster firmware     │ ◀── debounce 800 ms
                        └──────────┬───────────┘
                                   │
                                   ▼
                            dashboard lamp
                            ~1400 ms total`}
        </ASCIIDiagram>
        <p>
          Three things were eating budget. <strong>One:</strong> the ISR ran
          at a low priority and could be preempted by the diagnostics handler
          servicing OBD-II requests. <strong>Two:</strong> inside the ISR the
          64-byte sensor frame was <InlineCode>memcpy</InlineCode>&apos;d into
          a heap-allocated buffer before being queued — fine on x86, painful
          on the MCU because the heap allocator briefly took an IRQ-disabling
          lock. <strong>Three:</strong> a 5 Hz polling loop pulled queued
          frames into the CAN transmit task, adding up to 200 ms of jitter
          for no reason.
        </p>
        <p>
          I bumped the TPMS IRQ to the same priority tier as airbag-deploy
          notifications (cleared with the safety team; documented in the FMEA
          update). Eliminated the ISR-side memcpy by switching to a{" "}
          <strong>lock-free ring buffer</strong> of pre-allocated 64-byte
          slots; the ISR writes the frame index, the CAN task reads it.
          Replaced the 5 Hz polling loop with an event-driven wake on the
          ring-buffer producer index.
        </p>
        <Callout label="constraint">
          The debounce window (800 ms) is regulator-driven and I did{" "}
          <em>not</em> touch it — false low-pressure alerts are a
          recall-class defect. The win came entirely from squeezing the
          transport.
        </Callout>
        <p>
          End-to-end latency landed at <strong>612 ms</strong> on the bench,
          validated across temperature corners (−40 °C to +85 °C) and
          confirmed on the HIL rig. Passed FMVSS 138 with margin before the
          freeze date.
        </p>
      </Section>

      <Section number="03" label="routing" title="Fuel-efficient routing">
        <p>
          The 2027 F-150 ICE lineup and Mach-E share a routing subsystem; the
          spec was a re-ranker that takes the top-K candidate routes from the
          existing nav engine and re-scores them on <em>energy cost</em>{" "}
          rather than time-or-distance.
        </p>
        <p>
          Edge weights aren&apos;t constants — they&apos;re a function of
          vehicle state:
        </p>
        <CodeBlock lang="cpp" caption="Per-edge cost. γ is zero for ICE; δ is reweighted on F-150.">
{`// edge cost = energy proxy in joules, lower is better
double cost(const Edge& e, const VehicleState& v, Time t) {
  return alpha  * distance(e)
       + beta   * grade(e)        * v.mass
       - gamma  * regen_credit(e, v)        // EV only
       + delta  * traffic_prior(e, t)
       + eps    * hvac_load(e, t);
}`}
        </CodeBlock>
        <p>
          The Mach-E gets the regen term (downhill recovers ~30% of kinetic
          energy through the motor); the F-150 doesn&apos;t, so γ collapses
          to zero and δ gets reweighted. Elevation came from the existing
          tile cache, traffic priors from a 90-day rolling per-segment ETA
          table.
        </p>
        <p>
          I prototyped with <strong>A*</strong> because the heuristic
          (great-circle distance × min-cost-per-km) is admissible and easy to
          reason about. For production I switched to{" "}
          <strong>contraction hierarchies</strong><FootnoteRef n={2} /> — the
          graph is mostly static between OTA map updates, so the preprocessing
          cost amortizes. Query latency on the head unit&apos;s ARM Cortex-A53
          stayed under 80 ms for 300 km routes.
        </p>
        <BarChart
          number="02"
          caption="Average detour distance, baseline vs new ranker, across a 4K-trip sim set."
          meta="lower is better"
          bars={[
            { label: "f-150 base", value: 8.4 },
            { label: "f-150 new", value: 5.1, highlight: true },
            { label: "mach-e base", value: 6.9 },
            { label: "mach-e new", value: 3.8, highlight: true },
            { label: "overall base", value: 7.6 },
            { label: "overall new", value: 4.5, highlight: true },
          ]}
          yTicks={[0, 2, 4, 6, 8, 10]}
          yMax={10}
          yFormat={(v) => v.toFixed(1)}
          xAxisLabel="vehicle line"
          yAxisLabel="detour km"
        />
        <p>
          The 41% overall reduction came mostly from the Mach-E side — regen
          credit makes &quot;longer but downhill&quot; routes genuinely
          cheaper, which the old time-optimal ranker would never pick.
        </p>
      </Section>

      <Section number="04" label="triage" title="Auto-triage on 230 test rigs">
        <p>
          Across the firmware org we had 230 hardware-in-the-loop rigs
          running nightly. Each rig emitted ~60 events/hr; aggregate was
          ~14K events/hr. The status quo: a Slack channel firehose, and 40
          firmware engineers manually skimming for their failures every
          morning.
        </p>
        <p>
          I built a classifier that consumes the Kafka stream<FootnoteRef n={3} />,
          tags each failure event by signature, and routes it to the owning
          engineer. The core is a priority-ordered regex+heuristic table —
          fancy ML wasn&apos;t needed because the failure modes are narrow.
        </p>
        <CodeBlock lang="cpp" caption="Failure classifier. Ordering matters.">
{`enum class FailureKind { Crash, Leak, Threading, Other };

FailureKind classify(const TestEvent& e) {
  const auto& log = e.tail_log;  // last 4KB
  if (log.contains("SIGSEGV") || log.contains("assertion failed"))
    return FailureKind::Crash;
  if (e.heap_delta_kb > 256 && e.duration_s > 60)
    return FailureKind::Leak;
  if (log.contains("deadlock") || log.contains("TSAN: data race") ||
      e.thread_count_peak > e.thread_count_baseline * 3)
    return FailureKind::Threading;
  return FailureKind::Other;
}`}
        </CodeBlock>
        <p>
          Routing used <InlineCode>git blame</InlineCode> on the failing test
          file plus a CODEOWNERS lookup. Median PR-review time across the team
          dropped from <strong>6h 20m to 3h 25m</strong> — most of the win was
          just &quot;the right person sees the failure within 5 minutes
          instead of next morning.&quot;
        </p>
      </Section>

      <Section number="05" label="reflection" title="What I'd do differently">
        <p>
          I underspecified the failure modes for the auto-triage routing —
          when <InlineCode>git blame</InlineCode> pointed at a refactor
          commit, the wrong person got paged. I added a 2nd-best fallback
          late in the term but the right answer is probably blame-by-line-
          range weighted by recency. The TPMS work passed HIL but I never got
          to see field telemetry post-freeze; I&apos;d push harder next time
          to ride along on the validation fleet. For the routing ranker, I
          never benchmarked <em>honest A*</em> at production scale — I
          assumed CH would win and it did, but I should have the data to back
          the choice for the next reviewer who asks.
        </p>
      </Section>

      <Footnotes>
        <Fn n={1}>
          NHTSA, FMVSS No. 138 — Tire Pressure Monitoring Systems —{" "}
          <a
            href="https://www.nhtsa.gov/laws-regulations/fmvss"
            target="_blank"
            rel="noopener noreferrer"
          >
            nhtsa.gov/laws-regulations/fmvss
          </a>
          .
        </Fn>
        <Fn n={2}>
          Geisberger, Sanders, Schultes, Delling. <em>Contraction Hierarchies:
          Faster and Simpler Hierarchical Routing in Road Networks</em> —{" "}
          <a
            href="https://algo2.iti.kit.edu/schultes/hwy/contract.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            algo2.iti.kit.edu
          </a>
          .
        </Fn>
        <Fn n={3}>
          Apache Kafka consumer documentation —{" "}
          <a
            href="https://kafka.apache.org/documentation/#consumerapi"
            target="_blank"
            rel="noopener noreferrer"
          >
            kafka.apache.org
          </a>
          .
        </Fn>
      </Footnotes>
    </>
  );
}
