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
  BarChart,
  FlowDiagram,
} from "@/components/blog";

export function BoomerangPost() {
  return (
    <>
      <TLDR>
        <TLDRItem>
          Solo-built our internal Claude-driven software factory; per-cycle
          ticket throughput went up <strong>2.2x</strong>.
        </TLDRItem>
        <TLDRItem>
          In-app bug widget (Kotlin + React) does RAG over Notion + Granola,
          triages, drafts the fix PR — <strong>70%</strong> of bugs close
          without a human, on-call alerts down <strong>80%</strong>.
        </TLDRItem>
        <TLDRItem>
          Replaced 300+ filters with NLP search over <strong>2M</strong> alumni
          embeddings on Postgres + pgvector; recruiter outreach{" "}
          <strong>4x</strong>&apos;d.
        </TLDRItem>
        <TLDRItem>
          Swapped a gradient-boosted ranker for a two-stage neural retriever on{" "}
          <strong>12M</strong> candidate-job pairs; acceptance rate moved{" "}
          <strong>8% → 31%</strong>.
        </TLDRItem>
        <TLDRItem>
          HR sync <strong>17x</strong> faster (52 min → 3 min) via Redis;
          OpenAI bill down <strong>60%</strong> via few-shot normalization +
          delta-only calls.
        </TLDRItem>
      </TLDR>

      <Section number="01" label="context" title="What Boomerang is, and my charter">
        <p>
          Boomerang is an alumni search platform for recruiters — think
          &quot;LinkedIn Recruiter, but the graph is your company&apos;s alumni
          network and their second-degree connections.&quot; My charter for the
          internship was deliberately broad: <em>make recruiter time productive
          end-to-end</em>. That covers everything from how recruiters find
          people, how they reach out, how we score matches, and how we
          ourselves ship software fast enough to keep up with paying customers.
          I ended up touching each of those four loops.
        </p>
      </Section>

      <Section number="02" label="dev velocity" title="The software factory">
        <p>
          Before I touched product, I rebuilt the loop <em>we</em> used to ship
          product. Every dev step — ticket triage, branch setup, scaffolding,
          code review, PR description, test generation — got a Claude
          entrypoint wired into our internal CLI. Tickets carry structured
          context (linked Notion docs, Granola call transcripts, prior PRs
          touching the same files), and the factory hands that context to
          Claude with the right system prompt for the step. Per-cycle ticket
          throughput went from ~14 to ~31 closed tickets, with no regression
          in review acceptance rate. The honest read is that the lift comes
          less from raw code generation speed and more from{" "}
          <em>context plumbing</em> — Claude
          <FootnoteRef n={1} /> is only as good as the smallest relevant slice
          of repo and docs you can hand it.
        </p>
      </Section>

      <Section number="03" label="ops" title="The in-app bug widget">
        <p>
          The unsexy version: support and on-call were eating ~30% of eng
          time. The fix was a small floating widget on every page of our app.
          When a recruiter hits a bug, they click it, record a sentence, and
          screenshot context auto-attaches (URL, last 5 API calls, user role,
          feature flags).
        </p>
        <p>
          The interesting part is what happens server-side. A Kotlin/Spring
          Boot service runs a <strong>triage classifier</strong> (small
          fine-tuned model — bug vs feature request vs misuse vs auth issue)
          and then routes &quot;bug&quot; cases into a RAG pipeline over our
          Notion engineering docs and Granola call transcripts. The retrieved
          chunks plus the bug payload go to Claude with a constrained prompt
          that emits a structured <em>fix plan</em>: suspected file(s), root
          cause hypothesis, proposed diff. A second Claude pass turns the plan
          into a real branch and PR against our monorepo, runs the test suite,
          and posts the PR to the on-call channel for a human thumbs-up.
        </p>
        <FlowDiagram
          number="01"
          caption="Bug widget pipeline. Triage routes only 'bug' cases into RAG + patch generation."
          meta="70% close auto · human gate on PR"
          viewBox="0 0 720 800"
          nodes={[
            {
              id: "recruiter",
              x: 250,
              y: 20,
              w: 220,
              h: 55,
              badge: "user",
              title: "Recruiter",
              items: ["click widget · 1-line bug report"],
            },
            {
              id: "widget",
              x: 250,
              y: 105,
              w: 220,
              h: 80,
              badge: "01 / capture",
              title: "Bug Widget",
              items: ["url · last 5 api calls · flags"],
            },
            {
              id: "triage",
              x: 250,
              y: 215,
              w: 220,
              h: 85,
              badge: "02 / triage",
              title: "Triage Classifier",
              items: ["bug · feature · misuse"],
            },
            {
              id: "rag",
              x: 250,
              y: 335,
              w: 220,
              h: 85,
              badge: "03 / rag",
              title: "RAG · Notion + Granola",
              items: ["k-nearest doc chunks"],
            },
            {
              id: "plan",
              x: 250,
              y: 455,
              w: 220,
              h: 80,
              badge: "04 / claude",
              title: "Fix Plan",
              items: ["suspect files · diff sketch"],
            },
            {
              id: "patch",
              x: 250,
              y: 570,
              w: 220,
              h: 80,
              badge: "05 / claude",
              title: "Patch + Tests",
              items: ["real branch · ci runs"],
            },
            {
              id: "pr",
              x: 250,
              y: 685,
              w: 220,
              h: 85,
              badge: "06 / human gate",
              title: "GitHub PR",
              items: ["on-call thumbs-up"],
              tone: "accent",
            },
          ]}
          edges={[
            { from: "recruiter:bottom", to: "widget:top" },
            { from: "widget:bottom", to: "triage:top" },
            { from: "triage:bottom", to: "rag:top", label: "bug" },
            { from: "rag:bottom", to: "plan:top" },
            { from: "plan:bottom", to: "patch:top" },
            { from: "patch:bottom", to: "pr:top" },
          ]}
          sideText={[
            {
              x: 700,
              y: 270,
              text: "feature → backlog",
              anchor: "end",
            },
            {
              x: 700,
              y: 290,
              text: "misuse → docs reply",
              anchor: "end",
            },
          ]}
        />
        <p>
          70% of incoming bugs now close without an engineer typing anything;
          on-call pages dropped ~80%. The failure mode I care about most is{" "}
          <em>confident wrong patches</em> on bugs that look familiar but
          aren&apos;t — caught it twice in review, added a &quot;novelty
          score&quot; against the embedding index of past bugs to flag those
          for mandatory human triage.
        </p>
        <Callout label="design note">
          The triage classifier matters more than the patch generator. If you
          mis-route a feature request as a bug, Claude will dutifully invent a
          fix for a thing that isn&apos;t broken. Cheap classifier, expensive
          generator — get the cheap thing right first.
        </Callout>
      </Section>

      <Section number="04" label="search" title="NLP search over 2M alumni">
        <p>
          The old search was a 300-filter form. Recruiters had to know to
          click &quot;previous company = Meta&quot; AND &quot;tenure
          2+ years&quot; AND &quot;departure year 2023&quot; to find people
          who&apos;d just left FAANG. Most never did.
        </p>
        <p>
          I embedded all 2M alumni profiles (title history, company history,
          location, education, public bio) into a single dense vector per
          profile, stored in Postgres with <InlineCode>pgvector</InlineCode>
          <FootnoteRef n={2} /> using HNSW indexes. A small query-rewriting
          step turns &quot;founders who left FAANG in 2023&quot; into a
          structured intent (role: founder, prior_company ∈ FAANG,
          departure_year: 2023) plus a residual semantic vector. Hard filters
          run in SQL, the residual vector does ANN search, and a reranker
          stitches the result list.
        </p>
        <p>
          Quality came from fine-tuning on <em>misses</em> — when a recruiter
          ran a query, scrolled past the top results, and clicked someone on
          page 3, that&apos;s a negative on positions 1–N and a positive on
          the click. Two months of that loop closed most of the gap with
          hand-tuned filter searches, and outreach volume per recruiter
          compounded.
        </p>
        <LineChart
          number="02"
          caption="Monthly recruiter outreach per seat. Rollout began Feb 2026; dashed = pre-launch trend."
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

      <Section number="05" label="ranker" title="Two-stage neural retriever">
        <p>
          The match score that powers our &quot;candidates for this role&quot;
          feed was a gradient-boosted ranker over hand-crafted features (title
          similarity, tenure, school tier). It worked, but acceptance rate —
          recruiter actually reaching out to a suggested candidate — was
          stuck at ~8%.
        </p>
        <p>
          I replaced it with a two-stage neural retriever trained on{" "}
          <strong>12M</strong> historical candidate-to-job pairs (recruiter
          accepted = positive, dismissed within 5 seconds = hard negative).
          Stage one is a <strong>bi-encoder</strong> that embeds candidates
          and jobs into a shared space — fast enough to score the whole
          eligible pool. Stage two is a <strong>cross-encoder</strong> that
          re-ranks the top 200, attending jointly over the job description and
          the candidate&apos;s profile. Training in PyTorch, serving behind
          FastAPI with batched inference.<FootnoteRef n={3} />
        </p>
        <CodeBlock lang="python" caption="Two-stage scoring, simplified.">
{`def score_candidates(job, pool):
    job_vec = bi_encoder.encode_job(job)            # (d,)
    cand_vecs = bi_encoder.encode_candidates(pool)  # (N, d)
    coarse = cand_vecs @ job_vec                    # (N,)
    top200 = pool[np.argpartition(-coarse, 200)[:200]]
    fine = cross_encoder.score_pairs(job, top200)   # (200,)
    return top200[np.argsort(-fine)]`}
        </CodeBlock>
        <BarChart
          number="03"
          caption="Acceptance rate per suggested candidate. Bi+cross was rolled out 10% → 50% → 100% over 6 weeks."
          meta="acceptance/suggestion"
          bars={[
            { label: "gbm (old)", value: 0.08 },
            { label: "bi-encoder", value: 0.19 },
            { label: "bi + cross", value: 0.31, highlight: true },
          ]}
          yTicks={[0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35]}
          yMax={0.35}
          yFormat={(v) => `${Math.round(v * 100)}%`}
          xAxisLabel="ranker version"
          yAxisLabel="acceptance"
        />
        <p>
          Net effect: ~4x more good hires per search. The cross-encoder is
          the expensive part, so the 200-candidate cap is doing real work —
          bumping it to 500 added &lt;1 point of acceptance for 2.5x the
          latency, not worth it.
        </p>
      </Section>

      <Section number="06" label="infra" title="Cost and perf wins">
        <p>
          <strong>HR sync, 52 min → 3 min.</strong> Our largest customers push
          200K-employee org snapshots nightly. The old job re-fetched every
          employee record and re-ran enrichment. I added a Redis-backed
          dirty-set keyed on{" "}
          <InlineCode>(employee_id, source_etag)</InlineCode> so we only pull
          and enrich changed rows. The full sync went from 52 minutes to about
          3 — a 17x speedup — and we stopped tripping the source API&apos;s
          rate limits on Mondays.
        </p>
        <p>
          <strong>OpenAI bill down 60%.</strong> Two wins. First, field
          normalization (turning &quot;Sr. SWE II&quot; into &quot;Senior
          Software Engineer&quot;, &quot;MSFT&quot; into &quot;Microsoft&quot;)
          moved from per-row LLM calls to a few-shot prompt that handles 50
          rows per call. Second, the nightly enrichment job now sends only
          deltas against the previous run&apos;s normalized output, with cache
          hits served from Redis. Same accuracy on our eval set, dramatically
          smaller invoice.
        </p>
      </Section>

      <Section number="07" label="open problems" title="What I'd do differently">
        <p>
          The bug widget shipped before I had a clean way to measure{" "}
          <em>bad</em> auto-PRs in production — I was tracking
          &quot;merged&quot; vs &quot;rejected,&quot; not &quot;merged then
          reverted within 30 days,&quot; which is the number that actually
          matters. We added that, but later than I&apos;d like. Second, the
          search reranker is still a single model per locale; I think
          per-customer adapters would beat it, but I didn&apos;t get time to
          prove it. Third, I leaned on Claude inside the factory for code
          review and underweighted how often it would approve subtly wrong
          refactors in test files — humans still need to read test diffs
          carefully, no matter how good the model gets.
        </p>
      </Section>

      <Footnotes>
        <Fn n={1}>
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
        <Fn n={2}>
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
        <Fn n={3}>
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
      </Footnotes>
    </>
  );
}
