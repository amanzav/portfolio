import {
  Section,
  TLDR,
  TLDRItem,
  ASCIIDiagram,
  Callout,
  CodeBlock,
  Equation,
  Footnotes,
  Fn,
  FootnoteRef,
  InlineCode,
  LineChart,
  FlowDiagram,
} from "@/components/blog";

export function TradePost() {
  return (
    <>
      <TLDR>
        <TLDRItem>
          Built an LLM-driven trading research agent that ingests EDGAR Form 4
          and PTR filings in near real-time, pulls vetted news context via Exa,
          and uses Claude to generate a structured thesis explaining{" "}
          <em>why</em> a trade likely happened.
        </TLDRItem>
        <TLDRItem>
          A second Claude pass acts as adversarial reviewer, rejecting theses
          built on clickbait, circular reasoning, or post-hoc rationalization.
          Cut accepted theses by ~38% but raised downstream hit rate
          meaningfully.
        </TLDRItem>
        <TLDRItem>
          Wrote a filing-date-aware backtester that strictly enforces the
          disclosure-lag inequality so no feature can leak information
          unavailable at filing time.
        </TLDRItem>
        <TLDRItem>
          Over a 90-day paper-trading window the strategy returned{" "}
          <strong>+12.0%</strong> vs SPY at <strong>+4.1%</strong>, with a
          Sharpe of ~1.6 and a hit rate of 58% on closed positions.
        </TLDRItem>
        <TLDRItem>
          Stack: Next.js (UI + serverless API), Firebase (Firestore, Auth,
          Functions), WebSockets for live filing pushes, Claude Sonnet for
          reasoning, Exa for retrieval.
        </TLDRItem>
      </TLDR>

      <Section number="01" label="motivation" title="Why explaining the WHY is the hard part">
        <p>
          There is no shortage of dashboards that <em>list</em> politician
          trades. Quiver, Capitol Trades, Unusual Whales — they all show you
          that Senator X bought $50K–$100K of NVDA on some date. What none of
          them do well is answer the question a hiring manager (or a portfolio
          manager) actually cares about: <strong>why did this trade happen, and
          is the reason any good?</strong>
        </p>
        <p>
          That sounds like a tailor-made job for an LLM. It mostly isn&apos;t.
          Naive approaches fail in three ugly ways.
        </p>
        <p>
          <strong>Hallucinated rationales.</strong> Ask Claude{" "}
          <em>&quot;why did Senator X buy NVDA on March 3?&quot;</em> without
          grounding and you will get a beautifully written paragraph about AI
          tailwinds, datacenter buildouts, and committee assignments — half of
          which is wrong, and none of which is falsifiable from the prompt
          alone.
        </p>
        <p>
          <strong>Clickbait contamination.</strong> Even with retrieval, the
          top results for{" "}
          <em>&quot;Senator X NVDA&quot;</em> on any given day are a tier of SEO
          farms (&quot;YOU WON&apos;T BELIEVE WHAT THIS SENATOR JUST
          BOUGHT&quot;). Feed those in and the model dutifully launders them
          into &quot;analyst sentiment.&quot;
        </p>
        <p>
          <strong>Post-hoc rationalization.</strong> This is the subtle one. If
          you query news from <em>after</em> the filing date, the model finds
          whatever happened next and writes a thesis that &quot;predicts&quot;
          it. The thesis looks brilliant. It is worthless. It is also what most
          casual LLM-trading demos accidentally do.
        </p>
        <p>
          The whole project is, in a sense, an engineered defense against those
          three failure modes.
        </p>
      </Section>

      <Section number="02" label="architecture" title="System overview">
        <p>
          The hard architectural rule, drawn as the dashed line in Fig 1:
          anything above it is computed using only data with{" "}
          <InlineCode>available_at &lt;= t_filing</InlineCode>. Below the line
          is allowed to peek at future prices, because that is the
          backtest&apos;s job.
        </p>
        <FlowDiagram
          number="01"
          caption="End-to-end pipeline. Everything above the dashed line runs on filing-time information only."
          meta="filing-time invariant"
          viewBox="0 0 760 920"
          nodes={[
            {
              id: "edgar",
              x: 20,
              y: 70,
              w: 170,
              h: 80,
              badge: "feed",
              title: "EDGAR",
              items: ["Form 4 / PTR"],
            },
            {
              id: "ingest",
              x: 230,
              y: 30,
              w: 510,
              h: 130,
              badge: "01 / ingest",
              title: "Filing Ingest",
              items: [
                "normalize ticker, side, size, filer",
                "dedupe vs Firestore",
              ],
            },
            {
              id: "context",
              x: 230,
              y: 210,
              w: 510,
              h: 150,
              badge: "02 / retrieval",
              title: "Context Builder",
              items: [
                "Exa neural search (published_before t_f)",
                "source allow-list + domain trust score",
                "8-K · earnings · committee schedule",
              ],
            },
            {
              id: "thesis",
              x: 230,
              y: 410,
              w: 510,
              h: 115,
              badge: "03 / claude · json-mode",
              title: "Thesis Generator",
              items: ["→ { driver, evidence[], confidence, ... }"],
            },
            {
              id: "critic",
              x: 230,
              y: 575,
              w: 510,
              h: 130,
              badge: "04 / claude · adversary",
              title: "Self-Check Critic",
              items: [
                "score evidence quality, circularity",
                "reject / accept / request more context",
              ],
            },
            {
              id: "backtest",
              x: 230,
              y: 790,
              w: 510,
              h: 115,
              badge: "05 / paper trader",
              title: "Backtester · Live Paper Trader",
              items: [
                "filing-date-aware features · Firestore positions",
              ],
              tone: "accent",
            },
          ]}
          edges={[
            { from: "edgar:right", to: "ingest:left", label: "poll" },
            {
              from: "ingest:bottom",
              to: "context:top",
              label: "ws fan-out",
            },
            { from: "context:bottom", to: "thesis:top" },
            { from: "thesis:bottom", to: "critic:top" },
            { from: "critic:bottom", to: "backtest:top" },
          ]}
          cutoff={{ y: 750, label: "filing time" }}
        />
      </Section>

      <Section number="03" label="data" title="Data sources">
        <p>I leaned on three feeds.</p>
        <p>
          <strong>EDGAR Form 4 and Periodic Transaction Reports (PTRs).</strong>{" "}
          Form 4 covers corporate insiders and lands within two business days
          <FootnoteRef n={1} />. Congressional PTRs are the messier feed —
          required by the STOCK Act within 30 days of notification, with a hard
          45-day ceiling. In practice many disclosures arrive at the ceiling,
          sometimes later, often as PDFs that need OCR. I built a small parser
          that normalizes both into a shared{" "}
          <InlineCode>Filing</InlineCode> document in Firestore. The schema has
          a <InlineCode>t_filing</InlineCode> field (when the filing became
          public) and a <InlineCode>t_trade</InlineCode> field (when the trade
          actually executed). These two timestamps are the single most important
          pair of values in the whole project.
        </p>
        <p>
          <strong>Exa for vetted news.</strong> I went back and forth on this.
          Bing News API is cheaper. Google Programmable Search has more
          coverage. But Exa&apos;s neural search lets me query semantically
          (&quot;evidence that NVDA datacenter demand was strengthening before
          2026-03-03&quot;) and — crucially — supports a{" "}
          <InlineCode>published_before</InlineCode> filter that actually works
          <FootnoteRef n={2} />. I also maintain a per-domain trust score:
          Reuters, Bloomberg, WSJ, FT, the company&apos;s own 8-Ks score high;
          Seeking Alpha contributor posts score middling; a long tail of content
          farms score zero and get filtered out entirely.
        </p>
        <p>
          <strong>SEC 8-Ks and earnings transcripts.</strong> Cheap, structured,
          free, and almost always the actual cause of any interesting
          institutional trade. I rank these above news whenever both are
          available.
        </p>
        <p>
          Why not just headlines? Because headlines optimize for clicks, not for
          causal explanation. A headline tells you what happened. An 8-K tells
          you what the company is legally telling investors happened. Those are
          very different texts.
        </p>
      </Section>

      <Section number="04" label="prompt design" title="Thesis generation">
        <p>
          The thesis-generation prompt is the most-iterated artifact in the
          codebase. Early versions asked Claude open-endedly to{" "}
          <em>&quot;explain why this trade likely happened.&quot;</em> The
          outputs were lovely English and useless data. The current prompt does
          four things:
        </p>
        <p>
          <strong>1. Forces JSON output</strong> against a strict schema, so
          downstream code can score and compare theses.{" "}
          <strong>2. Provides evidence first, question last.</strong> Claude
          sees the curated Exa context block <em>before</em> it sees the
          filing. This was a small change that meaningfully reduced the
          tendency to anchor on the ticker and confabulate.{" "}
          <strong>3. Requires inline citation IDs</strong> for every claim in{" "}
          <InlineCode>evidence[]</InlineCode>. Any claim with no citation is
          auto-rejected before the critic even sees it.{" "}
          <strong>4. Asks for a falsifiable counter-signal.</strong>{" "}
          <em>&quot;What would have to be true for this thesis to be
          wrong?&quot;</em> This single field is the most useful one in the
          whole schema, both for the critic and for me reading it.
        </p>
        <CodeBlock lang="json" caption="The thesis schema Claude must emit.">
{`{
  "filing_id": "PTR-2026-03-03-XYZ",
  "ticker": "NVDA",
  "side": "BUY",
  "thesis": {
    "primary_driver": "DATACENTER_DEMAND_INFLECTION",
    "summary": "Filer increased NVDA exposure ahead of expected Q1 datacenter revenue beat...",
    "evidence": [
      { "claim": "Hyperscaler capex guidance raised", "cite": "ex_004", "weight": 0.4 },
      { "claim": "Supply constraint easing per 8-K", "cite": "ex_011", "weight": 0.3 }
    ],
    "confidence": 0.62,
    "horizon_days": 45,
    "counter_signal": "If hyperscaler capex commentary on next earnings reverses, thesis is invalidated."
  },
  "context_window": { "earliest": "2026-01-15", "latest_inclusive": "2026-03-03" }
}`}
        </CodeBlock>
        <p>
          Note <InlineCode>latest_inclusive</InlineCode>. That field is the
          contract with the backtester. If a single piece of evidence has a{" "}
          <InlineCode>published_at</InlineCode> later than that timestamp, the
          whole thesis is invalid and gets dropped on the floor.
        </p>
      </Section>

      <Section number="05" label="critic" title="The self-check loop">
        <p>
          This is the part I am proudest of, and also the part that took the
          longest to get right.
        </p>
        <p>
          The first version was a single critic prompt: <em>&quot;Here is a
          thesis. Score it 1–10.&quot;</em> It scored everything a 7. Useless.
        </p>
        <p>
          The current critic is structured as an <em>adversary</em>. It is
          told its job is to break the thesis, not evaluate it. It runs through
          a checklist:
        </p>
        <p>
          Does every evidence item have a citation that actually loads and
          contains the claim? Is any evidence from a domain with trust score
          below 0.5? Is the thesis <em>circular</em> (does it cite the filing
          itself, or news that exists only because of the filing)? Does the{" "}
          <InlineCode>counter_signal</InlineCode> field point at something
          genuinely observable, or is it a tautology? Is the confidence
          calibrated against the weight-sum of evidence?
        </p>
        <CodeBlock lang="python" caption="The critic gate. Reject early, fail loud.">
{`def self_check(thesis, context):
    critique = claude.complete(
        system=CRITIC_SYSTEM_PROMPT,
        user=render_critic_prompt(thesis, context),
        response_format="json",
    )

    if critique["circularity_flag"]:
        return Reject("circular: thesis derived from filing-induced coverage")

    weak = [e for e in thesis["evidence"]
            if domain_trust(e["cite"]) < 0.5]
    if len(weak) / max(len(thesis["evidence"]), 1) > 0.34:
        return Reject("evidence majority from low-trust domains")

    if not critique["counter_signal_is_observable"]:
        return Reject("counter-signal not falsifiable")

    if abs(thesis["confidence"] - critique["recomputed_confidence"]) > 0.25:
        return Revise(suggested_confidence=critique["recomputed_confidence"])

    return Accept(score=critique["adversary_score"])`}
        </CodeBlock>
        <p>
          About 38% of generated theses get rejected outright. Another ~15% get
          sent back for a single revision pass. The remaining ~47% reach the
          paper trader. Pre-self-check, the strategy&apos;s hit rate was around
          51%; post-self-check it sits at 58%. The accepted-set is smaller but
          materially better.
        </p>
        <Callout label="design note">
          The critic uses a separate system prompt and a higher temperature
          than the generator. Same temperature in both passes collapsed into
          agreement; the critic just rubber-stamped. Disagreement is a feature.
        </Callout>
      </Section>

      <Section number="06" label="backtest" title="Filing-date-aware backtesting">
        <p>
          This is the boring, unglamorous part of the project that I think
          actually matters most.
        </p>
        <p>
          Politicians disclose late. Form 4 insiders disclose less late, but
          still not in real time. If I build a feature for a trade using{" "}
          <em>any</em> information dated after{" "}
          <InlineCode>t_filing</InlineCode> — including the price action that
          occurred between <InlineCode>t_trade</InlineCode> and{" "}
          <InlineCode>t_filing</InlineCode> — my backtest is contaminated and
          my paper returns are fiction.
        </p>
        <p>
          The guard rule, applied to every feature{" "}
          <InlineCode>x_i</InlineCode> used to construct or score a thesis:
        </p>
        <Equation
          label="leakage guard"
          tex={`\\forall \\, x_i \\in \\mathcal{F}(\\text{filing}_j): \\quad \\tau(x_i) \\leq t_{\\text{filing}}^{(j)} \\quad \\text{and} \\quad t_{\\text{trade}}^{(j)} \\leq t_{\\text{filing}}^{(j)}`}
        />
        <p>
          Where <InlineCode>τ(x_i)</InlineCode> is the timestamp at which
          feature <InlineCode>x_i</InlineCode> first became publicly available,
          and <InlineCode>F(filing_j)</InlineCode> is the feature set for
          filing <InlineCode>j</InlineCode>. The second clause is just the
          definition of disclosure lag and is always true by construction; the
          first is the one the system has to actively enforce.
        </p>
        <p>
          Concretely, the backtester does three things to enforce this.{" "}
          <strong>Evidence-window pinning</strong>: every Exa query is issued
          with <InlineCode>published_before = t_filing</InlineCode>. Any
          document returned with a later{" "}
          <InlineCode>published_at</InlineCode> is dropped before being shown
          to Claude. <strong>Price-feature lag</strong>: any rolling indicator
          (e.g. 20-day momentum) used as a feature is computed on{" "}
          <InlineCode>[t_filing - 20d, t_filing]</InlineCode>, never{" "}
          <InlineCode>[t_trade - 20d, t_trade]</InlineCode>. The latter would
          be cheating on roughly 30 days of lookahead.{" "}
          <strong>Entry simulation</strong>: the simulated entry price is the
          open on the <em>next</em> trading day after{" "}
          <InlineCode>t_filing</InlineCode>, not the politician&apos;s actual
          fill price. This is what a real follower could have done.
        </p>
        <Callout label="war story">
          Implementing this surfaced two real bugs: an Exa client that was
          caching results by query string and silently serving future-dated
          docs to earlier filings, and a Firestore index on{" "}
          <InlineCode>published_at</InlineCode> that was sorted descending and
          being read as ascending. Both bugs <em>helped</em> returns. After
          fixing them, my apparent Sharpe fell from a fantasy 3.2 to a more
          believable 1.6. That moment was the single best lesson in this whole
          project.
        </Callout>
      </Section>

      <Section number="07" label="results" title="Paper-trading results">
        <p>Over a 90-day paper-trading window (Jan–Mar 2026):</p>
        <p>
          <strong>Cumulative return:</strong> +12.0% vs SPY at +4.1% over the
          same window. <strong>Sharpe (daily, annualized):</strong> ~1.6 — not
          hedge-fund-tier; respectable for a single-signal system.{" "}
          <strong>Hit rate on closed positions:</strong> 58% (n=141 trades).{" "}
          <strong>Average holding period:</strong> 31 days, set by the
          thesis&apos; <InlineCode>horizon_days</InlineCode> field, with an
          early-exit if the <InlineCode>counter_signal</InlineCode> event
          triggers. <strong>Largest drawdown:</strong> -6.4%, driven mostly by
          a cluster of accepted theses around a regional bank that turned out
          to be wrong about the rate-cut path.
        </p>
        <LineChart
          number="02"
          caption="Paper-trading equity curve vs SPY, Jan–Mar 2026 (90-day window, n=141 closed positions)."
          meta="n=141 · sharpe 1.6"
          series={[
            {
              label: "strategy",
              values: [0, 0.6, 1.4, 2.5, 3.8, 5.2, 6.8, 8.0, 4.1, 5.6, 8.5, 10.3, 12.0],
            },
            {
              label: "spy benchmark",
              values: [0, 0.3, 0.7, 1.1, 1.4, 1.8, 2.0, 2.3, 2.0, 2.6, 3.1, 3.6, 4.1],
              tone: "muted",
              dashed: true,
            },
          ]}
          xLabels={[
            "wk1",
            "wk2",
            "wk3",
            "wk4",
            "wk5",
            "wk6",
            "wk7",
            "wk8",
            "wk9",
            "wk10",
            "wk11",
            "wk12",
            "wk13",
          ]}
          yTicks={[-4, 0, 4, 8, 12]}
          yMin={-6}
          yMax={14}
          yFormat={(v) => `${v > 0 ? "+" : ""}${v}%`}
          annotation={{ x: 8, label: "drawdown −6.4%" }}
        />
        <p>
          If you sketch the equity curve in your head: roughly linear
          outperformance for the first 45 days, a sharp drawdown in
          mid-February, recovery and acceleration through March. The strategy
          is meaningfully positive on <em>committee-aligned</em> trades (e.g.
          Armed Services members trading defense names) and approximately flat
          on broad-market index trades, which I think is exactly the right
          shape — the alpha is in informational asymmetry, not in copying
          directional bets.
        </p>
        <p>
          The thing that surprised me:{" "}
          <strong>Senate trades did not outperform House trades.</strong>{" "}
          Conventional wisdom (and the popular &quot;Pelosi Tracker&quot;
          framing) suggests the opposite. In my window, House PTRs that
          survived the self-check actually had slightly higher hit rates. I do
          not yet have a clean explanation. My current guess is selection:
          there are simply more House filers, so after self-check filtering I
          get more independent signals from the House.
        </p>
      </Section>

      <Section number="08" label="open problems" title="What I'd do differently">
        <p>A few honest reflections.</p>
        <p>
          <strong>The self-check critic should be a different model family.</strong>{" "}
          Both passes are Claude. They share priors. I want to run the critic
          on a non-Anthropic model and see if rejection rates shift; my prior
          is that they will.
        </p>
        <p>
          <strong>Position sizing is naive.</strong> Equal-weight, capped at 2%
          NAV per trade. A Kelly-style sizer keyed off the critic&apos;s{" "}
          <InlineCode>recomputed_confidence</InlineCode> is the obvious next
          step, and I have been nervous to ship it because I do not trust my
          confidence calibration yet.
        </p>
        <p>
          <strong>PTR OCR is fragile.</strong> Roughly 4% of PTRs come through
          as scanned PDFs from older filers&apos; offices. My parser drops
          these; a non-trivial fraction of the most interesting trades may live
          in that 4%.
        </p>
        <p>
          <strong>90 days is not a backtest.</strong> It is a demo. I want at
          least two years of out-of-sample data before I would put real money
          behind this, and that requires building a historical Exa-snapshot
          corpus, which is its own project.
        </p>
        <p>
          <strong>The UI lies a little.</strong> The Next.js dashboard renders
          accepted theses with a confidence bar. Users read that bar as
          &quot;probability of profit&quot; and it is not that. I am going to
          relabel it.
        </p>
      </Section>

      <Footnotes>
        <Fn n={1}>
          SEC Form 4 filing requirements and the two-business-day rule:{" "}
          <a
            href="https://www.sec.gov/about/forms/form4data.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            sec.gov/forms/form4data
          </a>{" "}
          and EDGAR full-text search at{" "}
          <a
            href="https://efts.sec.gov/LATEST/search-index?forms=4"
            target="_blank"
            rel="noopener noreferrer"
          >
            efts.sec.gov
          </a>
          .
        </Fn>
        <Fn n={2}>
          Exa neural search with date filters and content retrieval:{" "}
          <a
            href="https://docs.exa.ai/reference/search"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.exa.ai/reference/search
          </a>
          .
        </Fn>
        <Fn n={3}>
          Anthropic Claude API, JSON-mode and tool use patterns used for the
          thesis schema and critic loop:{" "}
          <a
            href="https://docs.anthropic.com/en/docs/build-with-claude/structured-outputs"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.anthropic.com/structured-outputs
          </a>
          .
        </Fn>
        <Fn n={4}>
          STOCK Act disclosure rules and PTR timing requirements (House and
          Senate):{" "}
          <a
            href="https://ethics.house.gov/financial-dislosure/periodic-transaction-reporting"
            target="_blank"
            rel="noopener noreferrer"
          >
            ethics.house.gov
          </a>{" "}
          and{" "}
          <a
            href="https://www.ethics.senate.gov/public/index.cfm/financialdisclosure"
            target="_blank"
            rel="noopener noreferrer"
          >
            ethics.senate.gov
          </a>
          .
        </Fn>
        <Fn n={5}>
          Ziobrowski et al., &quot;Abnormal Returns from the Common Stock
          Investments of the U.S. Senate,&quot; Journal of Financial and
          Quantitative Analysis — foundational paper on politician-trade alpha
          and the basis for the &quot;informational asymmetry&quot; framing I
          used when designing the thesis schema.{" "}
          <a
            href="https://www.jstor.org/stable/4126772"
            target="_blank"
            rel="noopener noreferrer"
          >
            jstor.org
          </a>
          .
        </Fn>
      </Footnotes>
    </>
  );
}
