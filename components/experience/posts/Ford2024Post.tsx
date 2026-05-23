import {
  Section,
  TLDR,
  TLDRItem,
  Callout,
  CodeBlock,
  Footnotes,
  Fn,
  FootnoteRef,
  InlineCode,
  BarChart,
  TirePressureAnimation,
  GasRoutingAnimation,
  TriageRoutingAnimation,
} from "@/components/blog";

export function Ford2024Post() {
  return (
    <>
      <TLDR>
        <TLDRItem>
          Owned the C++ TPMS interrupt path on{" "}
          <strong>1.2M production cars</strong>. Cut puncture-alert latency
          from <strong>1.4s to 612ms</strong> and cleared the FMVSS 138 gate
          before model-year freeze.
        </TLDRItem>
        <TLDRItem>
          Built a graph-based fuel-efficient route ranker in C++ for the{" "}
          <strong>2027 F-150 and Mach-E</strong> (~380K vehicles/yr). Average
          detour dropped <strong>41%</strong>. Ships next model year.
        </TLDRItem>
        <TLDRItem>
          Wired up auto-triage on 230 firmware rigs (14K Kafka events/hr)
          that tags crashes, leaks, and threading bugs and pings the right
          owner. PR review time went from{" "}
          <strong>6h 20m to 3h 25m</strong>.
        </TLDRItem>
        <TLDRItem>
          Stack: C++17, embedded ISRs, CAN bus, Kafka, contraction
          hierarchies, A*.
        </TLDRItem>
      </TLDR>

      <Section number="01" label="context" title="Shipping in something with wheels">
        <p>
          First time writing software that ships in a thing with wheels. Two
          things made it harder than any prior internship.
        </p>
        <p>
          <strong>Real-time C++ has no escape hatch.</strong> A web service
          that takes 200ms longer is a Datadog alert. A tire-pressure ISR
          that takes 200ms longer can fail a federal compliance test, and
          missing that gate after freeze costs millions and a quarter of
          revenue. So you instrument first, hypothesize second, change code
          third.
        </p>
        <p>
          <strong>Review is heavy on purpose.</strong> Anything touching a
          safety path needs two reviewers from the embedded platform team, a
          static-analysis pass (Coverity + MISRA-C++), and a
          hardware-in-the-loop run on the bench. The auto-triage project
          came out of pure frustration with that loop.
        </p>
      </Section>

      <Section number="02" label="safety" title="TPMS interrupt path">
        <p>
          Tire-Pressure Monitoring is federally mandated under{" "}
          <strong>FMVSS 138</strong>.<FootnoteRef n={1} /> Each wheel has a
          battery-powered sensor that radios pressure to the body control
          module. Pressure drops, dashboard lights up. The reg specifies a
          detection <em>window</em>, not per-event latency, but slow
          per-event latency eats into that window once you stack averaging
          filters on top.
        </p>
        <TirePressureAnimation
          number="01"
          caption="Baseline vs optimised TPMS interrupt path · 1400 ms to 612 ms"
        />
        <p>
          Three things were eating budget. <strong>One:</strong> the ISR ran
          at low priority and could get preempted by the OBD-II diagnostics
          handler. <strong>Two:</strong> inside the ISR the 64-byte sensor
          frame was <InlineCode>memcpy</InlineCode>&apos;d into a
          heap-allocated buffer before being queued. Fine on x86, painful on
          the MCU because the allocator briefly takes an IRQ-disabling
          lock. <strong>Three:</strong> a 5 Hz polling loop pulled queued
          frames into the CAN transmit task, adding up to 200ms of jitter
          for no reason.
        </p>
        <p>
          I bumped the TPMS IRQ to the same priority tier as airbag-deploy
          notifications (cleared with safety, documented in the FMEA
          update). Killed the ISR-side memcpy with a{" "}
          <strong>lock-free ring buffer</strong> of pre-allocated 64-byte
          slots. ISR writes the frame index, CAN task reads it. Replaced
          the polling loop with an event-driven wake on the producer index.
        </p>
        <Callout label="constraint">
          The 800ms debounce is regulator-driven. I didn&apos;t touch it.
          False low-pressure alerts are a recall-class defect. The win came
          from squeezing the transport.
        </Callout>
        <p>
          End-to-end landed at <strong>612ms</strong> on the bench,
          validated across temperature corners (−40 °C to +85 °C) and
          confirmed on the HIL rig. Passed FMVSS 138 with margin before
          freeze.
        </p>
      </Section>

      <Section number="03" label="routing" title="Fuel-efficient routing">
        <p>
          The 2027 F-150 ICE lineup and the Mach-E share a routing
          subsystem. Spec was a re-ranker that takes the top-K candidate
          routes from the existing nav engine and re-scores them on{" "}
          <em>energy cost</em> instead of time or distance.
        </p>
        <p>
          Edge weights aren&apos;t constants. They depend on vehicle state.
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
        <GasRoutingAnimation
          number="02"
          caption="Same candidates, re-ranked on energy cost · regen flips the pick"
        />
        <p>
          The Mach-E gets a regen term (downhill recovers ~30% of kinetic
          energy through the motor). The F-150 doesn&apos;t, so γ collapses
          to zero and δ gets reweighted. Elevation came from the existing
          tile cache, traffic priors from a 90-day rolling per-segment ETA
          table.
        </p>
        <p>
          Prototyped with <strong>A*</strong> because the heuristic
          (great-circle distance × min-cost-per-km) is admissible and easy
          to reason about. For prod I switched to{" "}
          <strong>contraction hierarchies</strong>
          <FootnoteRef n={2} /> since the graph is mostly static between OTA
          map updates, so preprocessing amortizes. Query latency on the
          head unit&apos;s ARM Cortex-A53 stayed under 80ms for 300km
          routes.
        </p>
        <BarChart
          number="03"
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
          The 41% overall came mostly from the Mach-E. Regen credit makes
          &quot;longer but downhill&quot; genuinely cheaper, which the old
          time-optimal ranker would never pick.
        </p>
      </Section>

      <Section number="04" label="triage" title="Auto-triage on 230 test rigs">
        <p>
          We had 230 hardware-in-the-loop rigs running nightly. Each rig
          emitted ~60 events/hr, ~14K aggregate. The status quo was a Slack
          firehose and 40 firmware engineers manually skimming for their
          failures every morning.
        </p>
        <p>
          I wrote a classifier that consumes the Kafka stream
          <FootnoteRef n={3} />, tags each failure by signature, and routes
          it to the owner. Core is a priority-ordered regex and heuristic
          table. Fancy ML wasn&apos;t needed because the failure modes are
          narrow.
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
        <TriageRoutingAnimation
          number="04"
          caption="Kafka firehose to classifier to owner inbox · 6h 20m to 3h 25m"
        />
        <p>
          Routing used <InlineCode>git blame</InlineCode> on the failing
          test file plus a CODEOWNERS lookup. Median PR review dropped from{" "}
          <strong>6h 20m to 3h 25m</strong>. Most of the win was just the
          right person seeing the failure in 5 minutes instead of next
          morning.
        </p>
      </Section>

      <Section number="05" label="reflection" title="What I'd do differently">
        <p>
          I underspecified the failure modes for triage routing. When{" "}
          <InlineCode>git blame</InlineCode> landed on a refactor commit,
          the wrong person got paged. I added a 2nd-best fallback late in
          the term, but the right answer is probably blame-by-line-range
          weighted by recency. TPMS passed HIL but I never got to see field
          telemetry post-freeze, and I&apos;d push harder next time to ride
          along on the validation fleet. On the routing ranker, I never
          benchmarked honest A* at production scale. I assumed CH would
          win and it did, but I should have the data to back it for the
          next reviewer who asks.
        </p>
      </Section>

      <Footnotes>
        <Fn n={1}>
          NHTSA, FMVSS No. 138, Tire Pressure Monitoring Systems.{" "}
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
          Faster and Simpler Hierarchical Routing in Road Networks</em>.{" "}
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
          Apache Kafka consumer documentation.{" "}
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
