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
  LineChart,
  RigCrashIndexer,
  TraceWindowDetector,
} from "@/components/blog";

export function Ford2024Post() {
  return (
    <>
      <TLDR>
        <TLDRItem>
          Worked on the firmware team that owns the modem stack for Ford&apos;s
          in-vehicle infotainment. Their test rigs spit out{" "}
          <strong>~8M</strong> Kafka events a day.
        </TLDRItem>
        <TLDRItem>
          Built a Slack copilot (Python + FastAPI) that answers &quot;why did
          rig 14 crash Thursday?&quot; with a hypothesis and the log lines that
          back it up. Investigation time went from{" "}
          <strong>45 min to 4 min</strong>.
        </TLDRItem>
        <TLDRItem>
          Trained an LSTM on 68K labelled connectivity traces to catch modem
          dropouts before they paged anyone. Precision went from{" "}
          <strong>71% to 88%</strong>, false alerts down{" "}
          <strong>41%</strong>.
        </TLDRItem>
        <TLDRItem>
          On-call got back about <strong>22 hours/week</strong>. Two of three
          rotation members stopped getting paged on weekends.
        </TLDRItem>
        <TLDRItem>
          The interesting part wasn&apos;t the model. It was the labelling and
          the retrieval index over the Kafka archive.
        </TLDRItem>
      </TLDR>

      <Section number="01" label="context" title="What I owned">
        <p>
          The firmware team owns the connectivity layer of Ford&apos;s
          infotainment platform. Modem firmware, the cellular stack, Wi-Fi/BT
          handoff, and the glue that exposes it to the rest of the head unit.
          To validate every build, the team runs a fleet of bench rigs (a head
          unit wired to a modem, a SIM, and an RF chamber) replaying real drive
          cycles overnight.
        </p>
        <p>
          Every rig pushes structured telemetry into Kafka
          <FootnoteRef n={1} />: modem state transitions, AT command traces,
          packet loss windows, signal quality, thermal counters, exception
          traces. Busy weeks hit ~8M events/day. Two things hurt. When a rig
          crashed overnight, the firmware engineer who owned the build burned
          30 to 60 minutes scrolling Kibana before they could even guess at a
          cause. And the existing alerting paged on any modem drop over 5
          seconds, which meant it paged constantly on known-flaky RF chambers.
          People stopped trusting the pager.
        </p>
      </Section>

      <Section number="02" label="copilot" title="Slack bot for 'why did rig N crash?'">
        <p>
          The brief was simple. <em>Let me ask Slack what happened and get a
          real answer.</em> The hard part was making the answer trustworthy
          enough that a senior firmware engineer would act on it without
          re-deriving the whole thing themselves.
        </p>
        <p>
          The bot is a FastAPI service behind a Slack slash command. The
          interesting half is the offline pipeline that keeps a per-rig,
          per-session view of the Kafka stream queryable.
        </p>
        <RigCrashIndexer
          number="01"
          caption="Indexing + retrieval pipeline for the rig-crash copilot. The firehose stays left; only the digest plus top-k excerpts (a constrained packet) reach the LLM."
          query="/whycrash rig=14 since=Thu"
          hypotheses={[
            { summary: "RF chamber attn step misread as drop", excerptId: "#3814" },
            { summary: "thermal creep past modem PA limit", excerptId: "#3902" },
          ]}
        />
        <p>
          When the bot fires it does the boring, important thing first. Resolve
          the time window (default: last crash for that rig), pull the digest,
          pull the top-k log excerpts in that window, <em>then</em> call the
          LLM. The model never sees the raw 8M-event firehose. It sees a
          constrained packet.
        </p>
        <p>
          The prompt is structured. Every hypothesis has to cite specific
          excerpt IDs from the retrieved set.<FootnoteRef n={2} /> If the
          response doesn&apos;t parse against the schema, the bot retries once,
          then falls back to showing the raw excerpts instead of guessing.
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
          Slack renders the cited excerpts as expandable log lines, so the
          engineer sees the evidence and not just the conclusion. That one
          constraint is what moved the bot from &quot;novelty&quot; to
          &quot;people actually use it.&quot; Mean investigation time on rig
          crashes dropped from about 45 minutes to about 4 over the last six
          weeks of the internship.
        </p>
        <Callout label="design note">
          The win wasn&apos;t the LLM. It was forcing it to cite excerpt IDs
          from a pre-retrieved bundle. When we let it free-form, engineers
          caught it inventing register names within a week and stopped trusting
          it. The schema is the product.
        </Callout>
      </Section>

      <Section number="03" label="detector" title="LSTM modem-dropout detector">
        <p>
          Pager fatigue was a different problem. The signal <em>was</em> in the
          data. Connectivity drops have real precursors (RSRP slope, retransmit
          clusters, thermal creep) but a static threshold can&apos;t tell a
          real dropout from a planned RF-chamber attenuation step.
        </p>
        <p>
          I pulled <strong>68,032</strong> connectivity traces from the
          previous quarter of regression runs. A trace is a 90-second window of
          per-100ms modem telemetry leading up to a candidate event. Labels
          came from the rig owner&apos;s post-hoc triage notes: 11,204
          positives (real dropouts), 56,828 negatives (benign, planned
          attenuation, known-flaky chamber). Split 70/15/15, stratified by rig{" "}
          <em>and</em> by build so the model never trained on traces from the
          same rig-build pair it was evaluated on. That mattered. An earlier
          random split inflated val precision by ~6 pp through rig-identity
          leakage.
        </p>
        <p>
          Started with a 1D CNN since that&apos;s the obvious move on
          fixed-length multivariate windows. It hit ~74% precision and
          plateaued. The failure mode was telling. It kept missing dropouts
          where the precursor was a slow drift across the full 90s, exactly
          where a CNN&apos;s local receptive field hurts you. A two-layer LSTM
          <FootnoteRef n={3} /> with a small attention head over the sequence
          handled those long-horizon precursors and pushed precision past the
          CNN ceiling. Recall stayed roughly flat across architectures (~0.82).
          The gain was almost entirely in precision, which is the metric that
          maps to pager pain.
        </p>
        <TraceWindowDetector
          number="02"
          caption="One 90-second trace, two architectures. A CNN's local receptive field slides across the window and ceilings near 74% on the late retransmit cluster; an LSTM with attention consumes the full sequence and locks onto the slow RSRP drift, clearing the 85% deploy threshold."
          cnnCeiling={0.74}
          lstmFinal={0.88}
          threshold={0.85}
        />
        <LineChart
          number="03"
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
          Precision moved from 0.71 on the old threshold system to 0.88 on
          held-out test. False-alert volume on the on-call channel fell 41%
          week-over-week after rollout. The team tracked weekly pager-hours and
          averaged about 22 fewer hours/week of paged time. Two of the three
          rotation members stopped getting paged on weekends entirely.
        </p>
      </Section>

      <Section number="04" label="reflection" title="What I learned">
        <p>
          Three honest notes. <strong>One:</strong> most of the value in both
          projects came from data plumbing, not modelling. The indexing
          pipeline and the leakage-aware label split moved more numbers than
          any architecture choice. <strong>Two:</strong> forcing structured
          output with cited evidence is the single biggest thing that makes
          engineers trust an LLM tool. I&apos;d build every future copilot this
          way. <strong>Three:</strong> the LSTM is good but it can&apos;t yet
          tell you <em>which</em> feature drove a prediction, and on-call has
          started asking. A small SHAP or attention-rollout pass over the
          deployed model is the obvious next step. I left a written handoff
          for it.
        </p>
      </Section>

      <Footnotes>
        <Fn n={1}>
          Apache Kafka, consumer API.{" "}
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
          Anthropic, Messages API. Structured output and tool-use patterns
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
          PyTorch <InlineCode>nn.LSTM</InlineCode> documentation.{" "}
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
