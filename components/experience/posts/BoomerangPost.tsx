import {
  Section,
  TLDR,
  TLDRItem,
  Callout,
  Footnotes,
  Fn,
  FootnoteRef,
  InlineCode,
  LineChart,
  SemanticSearchAnimation,
  RetrieverFunnel,
  BugWidgetWorkflow,
  SyncDirtySet,
  CostStack,
} from "@/components/blog";

export function BoomerangPost() {
  return (
    <>
      <TLDR>
        <TLDRItem>
          Replaced a 300-filter search form with NLP search over{" "}
          <strong>2M</strong> alumni, embedded into pgvector on Postgres.
          Recruiter outreach went <strong>4x</strong>.
        </TLDRItem>
        <TLDRItem>
          Swapped a gradient-boosted ranker for a two-stage neural retriever
          (bi-encoder + cross-encoder) on <strong>12M</strong> candidate-job
          pairs. Acceptance jumped from <strong>8% to 31%</strong>.
        </TLDRItem>
        <TLDRItem>
          Built our internal Claude-driven software factory. Tickets closed per
          cycle went up <strong>2.2x</strong>.
        </TLDRItem>
        <TLDRItem>
          Shipped an in-app bug widget (Kotlin + React) that triages, runs RAG,
          and drafts the fix PR. <strong>70%</strong> of bugs now close without a
          human and on-call pages dropped <strong>80%</strong>.
        </TLDRItem>
        <TLDRItem>
          Made HR sync <strong>17x</strong> faster (52 min to 3 min) with Redis,
          and cut the OpenAI bill <strong>60%</strong> with batched
          normalization and delta-only calls.
        </TLDRItem>
      </TLDR>

      <Section number="01" label="context" title="What Boomerang is">
        <p>
          Boomerang is alumni search for recruiters. Think LinkedIn Recruiter,
          except the graph is your company&apos;s alumni and their second-degree
          connections. My job over the internship was pretty open-ended: make
          recruiters faster at the whole loop. Finding people, reaching out,
          scoring matches, and helping our own team ship fast enough to keep up.
          I ended up working on all four.
        </p>
      </Section>

      <Section number="02" label="search" title="NLP search over 2M alumni">
        <p>
          The old search was a form with 300+ filters. To find people who just
          left FAANG you had to know to set &quot;previous company = Meta&quot;
          and &quot;tenure 2+ years&quot; and &quot;departure year = 2023.&quot;
          Most recruiters never figured that out.
        </p>
        <p>
          So I embedded all 2M alumni profiles into one dense vector each (title
          and company history, location, education, bio) and stored them in
          Postgres with <InlineCode>pgvector</InlineCode>
          <FootnoteRef n={1} /> on HNSW indexes. A small rewriting step turns a
          query like &quot;founders who left FAANG in 2023&quot; into hard
          filters (role: founder, prior company in FAANG, year: 2023) plus a
          leftover semantic vector. The filters run in SQL, the vector does the
          similarity search, and a reranker stitches the list together.
        </p>
        <SemanticSearchAnimation
          number="01"
          caption="Plain-English query → filters + vector → a real audience"
        />
        <p>
          The quality came from training on misses. When a recruiter ran a
          search, skipped the top hits, and clicked someone on page 3, that
          click is a positive and everything above it is a negative. Two months
          of that loop closed most of the gap with the old hand-tuned filters,
          and outreach kept climbing.
        </p>
        <LineChart
          number="02"
          caption="Recruiter outreach per seat after the NLP search rollout"
          meta="outreach/seat/month"
          series={[
            {
              label: "outreach per seat",
              values: [280, 295, 310, 460, 720, 980, 1180],
            },
            {
              label: "pre-launch trend",
              values: [280, 295, 310, 325, 340, 355, 370],
              tone: "muted",
              dashed: true,
            },
          ]}
          xLabels={[
            "nov '25",
            "dec '25",
            "jan '26",
            "feb '26",
            "mar '26",
            "apr '26",
            "may '26",
          ]}
          yTicks={[0, 200, 400, 600, 800, 1000, 1200]}
          yMin={0}
          yMax={1300}
          yFormat={(v) => `${v}`}
        />
      </Section>

      <Section number="03" label="ranker" title="Two-stage neural retriever">
        <p>
          The &quot;candidates for this role&quot; feed ran on a gradient-boosted
          ranker over hand-built features like title match, tenure, and school
          tier. It worked fine, but acceptance, meaning the recruiter actually
          reached out, was stuck around 8%.
        </p>
        <p>
          I replaced it with a two-stage neural retriever trained on{" "}
          <strong>12M</strong> past candidate-job pairs (accepted = positive,
          dismissed in under 5 seconds = hard negative). Stage one is a{" "}
          <strong>bi-encoder</strong> that maps candidates and jobs into the same
          space, fast enough to score the whole pool. Stage two is a{" "}
          <strong>cross-encoder</strong> that re-ranks the top 200 by reading the
          job and the profile together. Trained in PyTorch, served behind FastAPI
          with batched inference.<FootnoteRef n={2} />
        </p>
        <RetrieverFunnel
          number="03"
          showCode
          caption="Bi-encoder scores the pool, cross-encoder re-ranks the top 200"
        />
        <p>
          Acceptance, meaning the recruiter actually reached out, went from about
          8% on the old ranker to 31% with bi-encoder plus cross-encoder.
          That worked out to roughly 4x more good hires per search. The
          cross-encoder is the expensive part, so the 200-cap earns its keep.
          Bumping it to 500 added less than a point of acceptance for 2.5x the
          latency, so I left it.
        </p>
      </Section>

      <Section
        number="04"
        label="dev velocity · ops"
        title="The software factory"
      >
        <p>
          Before I shipped any product, I rebuilt how we shipped product. Every
          dev step (triage, branch setup, scaffolding, review, PR descriptions,
          tests) got a Claude<FootnoteRef n={3} /> entrypoint in our internal
          CLI. Tickets carry real context: linked Notion docs, Granola call
          transcripts, past PRs on the same files. The factory hands that context
          to Claude with the right prompt for each step. Closed tickets per cycle
          went from about 14 to 31, and review acceptance didn&apos;t drop. Most
          of the win wasn&apos;t faster code generation. It was context plumbing.
          Claude is only as good as the smallest useful slice of repo and docs
          you can hand it.
        </p>
        <p>
          The clearest place to watch the factory run is the in-app bug widget. A
          recruiter hits a bug, clicks the little widget in the corner, and types
          one sentence. Context attaches itself (URL, last 5 API calls, user
          role, feature flags) and the pipeline takes over: a triage classifier
          sorts it, an agent drafts and writes the fix, tests and QA run, and it
          lands in the on-call channel for an engineer to confirm before it
          merges.
        </p>
        <BugWidgetWorkflow
          number="04"
          caption="One bug report, triaged and fixed mostly without an engineer"
        />
        <p>
          70% of bugs now close without an engineer touching anything, and
          on-call pages are down about 80%. The failure I worry about is a
          confident wrong patch on a bug that looks familiar but isn&apos;t. It
          happened twice in review, so I added a novelty score against the
          embedding index of past bugs to force human triage on anything new.
        </p>
        <Callout label="design note">
          The triage classifier matters more than the patch generator. Mislabel a
          feature request as a bug and Claude will happily invent a fix for
          something that isn&apos;t broken. Cheap classifier, expensive
          generator. Get the cheap one right first.
        </Callout>
      </Section>

      <Section number="05" label="infra" title="Cost and perf wins">
        <p>
          <strong>HR sync, 52 min to 3 min.</strong> Our biggest customers push
          200K-employee snapshots every night, and the old job re-fetched and
          re-enriched every single record. I added a Redis dirty-set keyed on{" "}
          <InlineCode>(employee_id, source_etag)</InlineCode> so we only touch
          rows that changed. The full sync dropped from 52 minutes to about 3, a
          17x speedup, and we stopped tripping the source API&apos;s rate limits
          on Mondays.
        </p>
        <SyncDirtySet
          number="05"
          caption="Dirty-set sync processes only the rows that changed"
        />
        <p>
          <strong>OpenAI bill down 60%.</strong> Two things. Field normalization
          (&quot;Sr. SWE II&quot; to &quot;Senior Software Engineer,&quot;
          &quot;MSFT&quot; to &quot;Microsoft&quot;) went from one LLM call per
          row to a few-shot prompt doing 50 rows at a time. And the nightly
          enrichment now sends only deltas against the last run, with cache hits
          served from Redis. Same accuracy on our eval set, way smaller invoice.
        </p>
        <CostStack
          number="06"
          caption="Where the 60% OpenAI savings come from"
        />
      </Section>

      <Section number="06" label="open problems" title="What I'd do differently">
        <p>
          The bug widget shipped before I had a good way to measure bad auto-PRs
          in prod. I was tracking merged vs rejected, not
          merged-then-reverted-within-30-days, which is the number that actually
          matters. We added it, just later than I wanted. The search reranker is
          also still one model per locale, and I think per-customer adapters would
          beat it, but I ran out of time to prove it. And I leaned on Claude for
          code review more than I should have. It approves subtly wrong refactors
          in test files more often than you&apos;d expect, so humans still need to
          read test diffs closely.
        </p>
      </Section>

      <Footnotes>
        <Fn n={1}>
          pgvector, open-source vector similarity for Postgres —{" "}
          <a
            href="https://github.com/pgvector/pgvector"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/pgvector/pgvector
          </a>
          .
        </Fn>
        <Fn n={2}>
          Karpukhin et al., <em>Dense Passage Retrieval for Open-Domain
          Question Answering</em> — origin of the bi-encoder + cross-encoder
          pattern.{" "}
          <a
            href="https://arxiv.org/abs/2004.04906"
            target="_blank"
            rel="noopener noreferrer"
          >
            arxiv.org/abs/2004.04906
          </a>
          .
        </Fn>
        <Fn n={3}>
          Anthropic, <em>Claude API documentation</em> —{" "}
          <a
            href="https://docs.anthropic.com/en/api/overview"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.anthropic.com
          </a>
          .
        </Fn>
      </Footnotes>
    </>
  );
}
