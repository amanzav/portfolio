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
  LineChart,
} from "@/components/blog";

export function Ford2025Post() {
  return (
    <>
      <TLDR>
        <TLDRItem>
          Embedded with the firmware/connectivity team owning the modem stack
          for in-vehicle infotainment. The rigs that run regression emit ~8M
          Kafka events/day.
        </TLDRItem>
        <TLDRItem>
          Shipped a Slack LLM copilot (Python + FastAPI) that answers
          &quot;why did rig 14 crash Thursday?&quot; with a root-cause
          hypothesis and the log lines that support it. Investigation time:{" "}
          <strong>45 min → 4 min</strong>.
        </TLDRItem>
        <TLDRItem>
          Trained an LSTM (PyTorch) on 68K labelled connectivity traces to
          catch modem dropouts before the on-call pager fired. Precision:{" "}
          <strong>71% → 88%</strong>. False alerts down <strong>41%</strong>.
        </TLDRItem>
        <TLDRItem>
          Net effect on the on-call rotation: ~22 hours/week of human time
          back. Two of three on-call engineers stopped getting paged on
          weekends.
        </TLDRItem>
        <TLDRItem>
          The interesting work wasn&apos;t the model — it was the labelling
          scheme and the retrieval index over the Kafka archive.
        </TLDRItem>
      </TLDR>

      <Section number="01" label="context" title="What I owned">
        <p>
          The firmware team owns the connectivity layer of Ford&apos;s
          in-vehicle infotainment platform: modem firmware, the cellular
          stack, Wi-Fi/BT handoff, and the glue that exposes all of it to the
          rest of the head unit. To validate every build, the team runs a
          fleet of bench rigs — each one is a head unit wired to a modem, a
          SIM, and an RF chamber — replaying real-world drive cycles
          overnight.
        </p>
        <p>
          Every rig emits structured telemetry into Kafka<FootnoteRef n={1} />:
          modem state transitions, AT command traces, packet loss windows,
          signal quality, thermal counters, exception traces. On a busy week
          the topic carries ~8M events/day. Two things hurt: when a rig
          crashed overnight, the firmware engineer who owned the build spent
          30–60 minutes scrolling Kibana before they could even start forming
          a hypothesis. The existing alerting was a threshold-on-counters
          system that paged for any modem drop &gt; 5 s, which meant it paged
          constantly on known-flaky RF chambers. Pager fatigue was real and
          people had stopped trusting it.
        </p>
      </Section>

      <Section number="02" label="copilot" title="Slack bot for 'why did rig N crash?'">
        <p>
          The brief was small: <em>make it so I can ask Slack what happened
          and get a real answer</em>. The hard part was making the answer
          trustworthy enough that an L4 firmware engineer would act on it
          without re-deriving it themselves.
        </p>
        <p>
          The bot is a FastAPI service behind a Slack slash command. The
          interesting half is the offline indexing pipeline that keeps a
          per-rig, per-session view of the Kafka stream queryable.
        </p>
        <ASCIIDiagram
          number="01"
          caption="Indexing + retrieval pipeline for the rig-crash copilot."
        >
{`     Kafka topic (rig.events, ~8M/day)
              │
              ▼
     ┌──────────────────────┐
     │  streaming consumer  │  group_id = copilot-indexer
     └──────────┬───────────┘
                │ windowed by session_id
                ▼
     ┌──────────────────────┐    ┌──────────────────────┐
     │   raw event blobs    │──▶ │     S3 (parquet)     │
     └──────────┬───────────┘    └──────────┬───────────┘
                │ summarise + chunk         │
                ▼                           ▼
     ┌──────────────────────┐    ┌──────────────────────┐
     │ per-session digest   │    │  log_excerpts index  │
     └──────────────────────┘    └──────────────────────┘
                          ╲              ╱
                           ▼            ▼
                      ┌──────────────────────────┐
                      │  embedding store / rig   │
                      └──────────────┬───────────┘
                                     ▼
                          Slack bot retrieval + LLM
                                     │
                                     ▼
                          /whycrash rig=14 since=Thu`}
        </ASCIIDiagram>
        <p>
          When the bot is invoked it does the boring, important thing: resolve
          the time window (defaulting to the last crash for that rig), pull
          the digest, pull the top-k log excerpts under that window,{" "}
          <em>then</em> call the LLM. The model never sees the raw 8M-event
          stream; it sees a constrained packet.
        </p>
        <p>
          The prompt is structured. Every hypothesis must point at specific
          excerpt IDs from the retrieved set.<FootnoteRef n={2} /> If the
          response fails to parse against the schema, the bot retries once
          and then surfaces the raw excerpts instead of guessing.
        </p>
        <CodeBlock lang="python" caption="Root-cause JSON schema. Every claim must cite excerpt IDs.">
{`ROOT_CAUSE_SCHEMA = {
    "type": "object",
    "required": ["rig_id", "time_window", "log_excerpts",
                 "root_cause_hypotheses"],
    "properties": {
        "rig_id": {"type": "integer"},
        "time_window": {
            "type": "object",
            "required": ["start", "end"],
            "properties": {
                "start": {"type": "string", "format": "date-time"},
                "end":   {"type": "string", "format": "date-time"},
            },
        },
        "log_excerpts": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["ts", "source", "line"],
            },
        },
        "root_cause_hypotheses": {
            "type": "array", "minItems": 1, "maxItems": 3,
            "items": {
                "type": "object",
                "required": ["summary", "confidence",
                             "supporting_excerpt_ids"],
            },
        },
    },
}`}
        </CodeBlock>
        <p>
          The Slack UI renders cited excerpts as expandable quoted log lines,
          so the engineer sees the model&apos;s evidence and not just its
          conclusion. That single constraint is what moved the bot from
          &quot;novelty&quot; to &quot;people actually use it&quot; — mean
          investigation time on rig crashes went from ~45 min to ~4 min over
          the last six weeks of the internship.
        </p>
        <Callout label="design note">
          The win wasn&apos;t the LLM. It was forcing the model to cite
          excerpt IDs from a pre-retrieved bundle. When we let it free-form,
          engineers caught it inventing register names within a week and
          stopped trusting it. The schema is the product.
        </Callout>
      </Section>

      <Section number="03" label="detector" title="LSTM modem-dropout detector">
        <p>
          The pager-fatigue problem was different. The signal <em>was</em> in
          the data — connectivity drops have characteristic precursors (RSRP
          slope, retransmit clusters, thermal creep) — but a static threshold
          can&apos;t tell a real dropout from a planned RF-chamber attenuation
          step.
        </p>
        <p>
          I pulled <strong>68,032</strong> connectivity traces from the
          previous quarter of regression runs. A &quot;trace&quot; is a
          90-second window of per-100ms modem telemetry leading up to a
          candidate event. Labels came from joining against the rig
          owner&apos;s post-hoc triage notes: 11,204 positives (real
          dropouts), 56,828 negatives (benign / planned attenuation /
          known-flaky chamber). Split was 70/15/15, stratified by rig{" "}
          <em>and</em> by build, so the model never trained on traces from the
          same rig-build pair it was evaluated on. That detail mattered — an
          earlier random split inflated val precision by ~6 pp through
          rig-identity leakage.
        </p>
        <p>
          I started with a 1D CNN because it&apos;s the obvious move on
          fixed-length multivariate windows. It got to ~74% precision and
          plateaued. The failure mode was telling: it kept missing dropouts
          where the precursor was a slow, drifting pattern across the full
          90 s window — exactly the regime where a CNN&apos;s local receptive
          field hurts you. A two-layer LSTM<FootnoteRef n={3} /> with a small
          attention head over the sequence handled those long-horizon
          precursors and pushed precision past the CNN ceiling. Recall stayed
          roughly flat across architectures (~0.82); the gain was almost
          entirely in precision, which is the metric that maps to pager pain.
        </p>
        <LineChart
          number="02"
          caption="Validation precision over training epochs. CNN plateaus around 74%; LSTM clears the deployment threshold at epoch 14."
          meta="precision / val"
          series={[
            {
              label: "lstm (deployed)",
              values: [
                0.62, 0.68, 0.72, 0.76, 0.8, 0.83, 0.86, 0.88, 0.88, 0.88,
              ],
            },
            {
              label: "1d cnn baseline",
              values: [
                0.61, 0.66, 0.7, 0.72, 0.73, 0.74, 0.74, 0.74, 0.74, 0.74,
              ],
              tone: "muted",
            },
            {
              label: "deploy threshold",
              values: [0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85],
              tone: "muted",
              dashed: true,
            },
          ]}
          xLabels={["1", "3", "5", "7", "9", "11", "13", "15", "17", "19"]}
          yTicks={[0.6, 0.7, 0.8, 0.9]}
          yMin={0.55}
          yMax={0.95}
          yFormat={(v) => `${Math.round(v * 100)}%`}
        />
        <p>
          Precision moved from the old threshold system&apos;s 0.71 to the
          LSTM&apos;s 0.88 on held-out test. False-alert volume on the
          on-call channel fell 41% week-over-week after rollout. The on-call
          rotation tracked weekly pager-hours; the team averaged ~22 fewer
          hours/week of paged time. Two of the three rotation members stopped
          getting paged on weekends entirely.
        </p>
      </Section>

      <Section number="04" label="reflection" title="What I learned">
        <p>
          Three honest notes. <strong>One:</strong> most of the value in both
          projects came from data plumbing, not modelling — the indexing
          pipeline and the leakage-aware label split moved more numbers than
          any architecture choice. <strong>Two:</strong> forcing structured
          output with cited evidence is the single biggest determinant of
          whether engineers trust an LLM tool; I&apos;d build every future
          copilot this way. <strong>Three:</strong> the LSTM is good but it
          can&apos;t yet explain <em>which</em> feature drove a prediction,
          and the on-call team has started asking. A small SHAP or
          attention-rollout pass over the deployed model is the obvious next
          step, and I left a written handoff for it.
        </p>
      </Section>

      <Footnotes>
        <Fn n={1}>
          Apache Kafka, consumer API —{" "}
          <a
            href="https://kafka.apache.org/documentation/#consumerapi"
            target="_blank"
            rel="noopener noreferrer"
          >
            kafka.apache.org/documentation
          </a>
          .
        </Fn>
        <Fn n={2}>
          Anthropic, Messages API — structured output and tool-use patterns
          used for schema-constrained responses.{" "}
          <a
            href="https://docs.anthropic.com/en/api/messages"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.anthropic.com/messages
          </a>
          .
        </Fn>
        <Fn n={3}>
          PyTorch <InlineCode>nn.LSTM</InlineCode> documentation —{" "}
          <a
            href="https://pytorch.org/docs/stable/generated/torch.nn.LSTM.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            pytorch.org/docs/nn.LSTM
          </a>
          .
        </Fn>
      </Footnotes>
    </>
  );
}
