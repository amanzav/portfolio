import {
  Section,
  TLDR,
  TLDRItem,
  Callout,
  CodeBlock,
  Equation,
  Footnotes,
  Fn,
  FootnoteRef,
  InlineCode,
  LineChart,
  FlowDiagram,
  TradeLeakageGuard,
  TradeCriticGate,
  TradeSharpeCollapse,
} from "@/components/blog";

export function TradePost() {
  return (
    <>
      <TLDR>
        <TLDRItem>
          LLM trading-research agent. Ingests EDGAR Form 4 and congressional
          PTR filings, pulls news through Exa, and uses Claude to write a
          structured thesis explaining <em>why</em> a trade probably happened.
        </TLDRItem>
        <TLDRItem>
          A second Claude pass plays adversary and tries to break the thesis.
          It rejects about <strong>38%</strong>. Hit rate moved from 51% to{" "}
          <strong>58%</strong>.
        </TLDRItem>
        <TLDRItem>
          Filing-date-aware backtester. No feature can see past{" "}
          <InlineCode>t_filing</InlineCode>. Sharpe dropped from 3.2 to 1.6
          after I fixed two leakage bugs.
        </TLDRItem>
        <TLDRItem>
          90-day paper window: <strong>+12.0%</strong> vs SPY at{" "}
          <strong>+4.1%</strong>, Sharpe ~1.6, 58% hit rate on 141 closed
          positions.
        </TLDRItem>
        <TLDRItem>
          Stack: Next.js, Firebase (Firestore, Auth, Functions), WebSockets for
          live filing pushes, Claude Sonnet, Exa.
        </TLDRItem>
      </TLDR>

      <Section number="01" label="context" title="What it does">
        <p>
          Quiver, Capitol Trades, and Unusual Whales already list politician
          trades. None of them answer the question a portfolio manager
          actually cares about: <strong>why, and is it any good?</strong>
        </p>
        <p>
          The naive version is easy to get wrong in three ways. Ask Claude
          open-endedly <em>&quot;why did Senator X buy NVDA on March 3?&quot;</em>{" "}
          and you get a clean paragraph about AI tailwinds that is mostly
          invented. Add retrieval and the top results for politician plus
          ticker queries are SEO farms that get laundered into &quot;analyst
          sentiment.&quot; Worst, if the news query pulls from after the
          filing date the model writes a thesis that &quot;predicts&quot; what
          already happened. Most casual LLM-trading demos accidentally do
          that. The pipeline is mostly defenses against those three.
        </p>
      </Section>

      <Section number="02" label="architecture" title="System overview">
        <p>
          The hard rule, drawn as the dashed line in Fig 1. Anything above it
          uses only data with{" "}
          <InlineCode>available_at &lt;= t_filing</InlineCode>. Below it can
          peek at future prices, because that&apos;s the backtester&apos;s
          job.
        </p>
        <FlowDiagram
          number="01"
          caption="End-to-end pipeline. Everything above the dashed line runs on filing-time information only."
          meta="filing-time invariant"
          viewBox="0 0 760 720"
          nodes={[
            {
              id: "edgar",
              x: 20,
              y: 50,
              w: 170,
              h: 70,
              badge: "feed",
              title: "EDGAR",
              items: ["Form 4 / PTR"],
            },
            {
              id: "ingest",
              x: 230,
              y: 30,
              w: 510,
              h: 100,
              badge: "01 / ingest",
              title: "Filing Ingest",
              items: [
                "normalize ticker, side, size · dedupe vs Firestore",
              ],
            },
            {
              id: "context",
              x: 230,
              y: 160,
              w: 510,
              h: 120,
              badge: "02 / retrieval",
              title: "Context Builder",
              items: [
                "Exa neural search (published_before t_f)",
                "domain trust + 8-K · earnings · committee schedule",
              ],
            },
            {
              id: "thesis",
              x: 230,
              y: 310,
              w: 510,
              h: 90,
              badge: "03 / claude · json-mode",
              title: "Thesis Generator",
              items: ["→ { driver, evidence[], confidence, ... }"],
            },
            {
              id: "critic",
              x: 230,
              y: 430,
              w: 510,
              h: 110,
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
              y: 580,
              w: 510,
              h: 90,
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
          cutoff={{ y: 555, label: "filing time" }}
        />
      </Section>

      <Section number="03" label="data" title="Three feeds">
        <p>
          <strong>EDGAR Form 4 and PTRs.</strong> Form 4 covers corporate
          insiders and lands within two business days<FootnoteRef n={1} />.
          Congressional PTRs are messier. STOCK Act<FootnoteRef n={4} /> says
          30 days, hard ceiling 45. Most arrive at the ceiling, sometimes
          later, often as scanned PDFs. A parser normalizes both into a
          shared <InlineCode>Filing</InlineCode> doc in Firestore with two
          timestamps: <InlineCode>t_filing</InlineCode> (when it became
          public) and <InlineCode>t_trade</InlineCode> (when it executed).
          Single most important pair of values in the project.
        </p>
        <p>
          <strong>Exa for news.</strong> Bing News is cheaper and Google
          Programmable Search has more coverage. I picked Exa because the
          neural search lets me query semantically (&quot;evidence NVDA
          datacenter demand was strengthening before 2026-03-03&quot;) and
          its <InlineCode>published_before</InlineCode> filter actually works
          <FootnoteRef n={2} />. On top of that I keep a per-domain trust
          score: Reuters, Bloomberg, WSJ, FT, and company 8-Ks score high.
          Seeking Alpha contributor posts sit in the middle. Content farms
          score zero and get filtered out.
        </p>
        <p>
          <strong>SEC 8-Ks and earnings transcripts.</strong> Free,
          structured, and usually the actual cause of any interesting
          institutional trade. Ranked above news when both are available.
        </p>
      </Section>

      <Section number="04" label="prompt" title="Thesis generation">
        <p>
          The thesis prompt is the most-iterated artifact in the codebase.
          Early versions asked Claude<FootnoteRef n={3} /> open-endedly to{" "}
          <em>&quot;explain why this trade likely happened.&quot;</em> Pretty
          prose, no structure. The current prompt does four things.
        </p>
        <p>
          <strong>1.</strong> Forces JSON against a strict schema so
          downstream code can score theses. <strong>2.</strong> Provides
          evidence first and the question last, so Claude sees the Exa
          context block before the filing. Small change, big drop in
          ticker-anchored confabulation. <strong>3.</strong> Requires inline
          citation IDs for every claim in{" "}
          <InlineCode>evidence[]</InlineCode>. No citation, auto-reject
          before the critic sees it. <strong>4.</strong> Asks for a
          falsifiable counter-signal:{" "}
          <em>
            &quot;what would have to be true for this thesis to be
            wrong?&quot;
          </em>
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
          <InlineCode>latest_inclusive</InlineCode> is the contract with the
          backtester. Any evidence with a{" "}
          <InlineCode>published_at</InlineCode> later than that timestamp and
          the whole thesis gets dropped.
        </p>
      </Section>

      <Section number="05" label="critic" title="The self-check loop">
        <p>
          First version was a single critic prompt:{" "}
          <em>&quot;Here is a thesis. Score it 1 to 10.&quot;</em> It scored
          everything a 7.
        </p>
        <p>
          The current critic is structured as an <em>adversary</em>. Its job
          is to break the thesis, not evaluate it. Does every evidence item
          have a citation that actually loads? Is any evidence from a domain
          with trust under 0.5? Is the thesis circular, meaning does it cite
          the filing itself or news that only exists because of the filing?
          Is the <InlineCode>counter_signal</InlineCode> observable or a
          tautology? Is confidence calibrated against the weight-sum of
          evidence?
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
        <TradeCriticGate
          number="02"
          caption="Adversarial critic on a 100-thesis batch. Smaller accepted set, materially better hit rate."
          meta="−38% rejected · 51% → 58%"
        />
        <p>
          About <strong>38%</strong> get rejected outright, another ~15% are
          sent back for one revision, and the remaining ~47% reach the paper
          trader. Pre-critic hit rate was 51%. Post-critic, 58%.
        </p>
        <Callout label="design note">
          The critic uses a separate system prompt and a higher temperature
          than the generator. Same temperature in both passes collapsed into
          agreement and the critic just rubber-stamped. Disagreement is the
          point.
        </Callout>
      </Section>

      <Section number="06" label="backtest" title="Filing-date-aware backtesting">
        <p>
          Politicians disclose late. Form 4 insiders disclose less late but
          still not in real time. Use any information dated after{" "}
          <InlineCode>t_filing</InlineCode>, including price action between{" "}
          <InlineCode>t_trade</InlineCode> and{" "}
          <InlineCode>t_filing</InlineCode>, and the backtest is contaminated
          and the paper returns are fiction.
        </p>
        <p>
          The guard, applied to every feature{" "}
          <InlineCode>x_i</InlineCode> used to construct or score a thesis:
        </p>
        <Equation
          label="leakage guard"
          tex={`\\forall \\, x_i \\in \\mathcal{F}(\\text{filing}_j): \\quad \\tau(x_i) \\leq t_{\\text{filing}}^{(j)} \\quad \\text{and} \\quad t_{\\text{trade}}^{(j)} \\leq t_{\\text{filing}}^{(j)}`}
        />
        <TradeLeakageGuard
          number="03"
          caption="Evidence-pinning gate. Documents published after t_filing are dropped before Claude sees them."
          meta="7 candidates · 4 admitted · ≤ t_filing"
        />
        <p>
          <InlineCode>τ(x_i)</InlineCode> is when feature{" "}
          <InlineCode>x_i</InlineCode> first became public. The second clause
          is the definition of disclosure lag, true by construction. The
          first is enforced in three places. <strong>Evidence pinning</strong>:
          every Exa query carries{" "}
          <InlineCode>published_before = t_filing</InlineCode>, so later docs
          get dropped before Claude sees them.{" "}
          <strong>Price-feature lag</strong>: rolling indicators (e.g. 20-day
          momentum) compute on{" "}
          <InlineCode>[t_filing - 20d, t_filing]</InlineCode>, never on{" "}
          <InlineCode>[t_trade - 20d, t_trade]</InlineCode>, since the latter
          is 30 days of free lookahead. <strong>Entry simulation</strong>:
          simulated entry is the open on the next trading day after{" "}
          <InlineCode>t_filing</InlineCode>, not the politician&apos;s fill
          price. What a real follower could have done.
        </p>
        <Callout label="war story">
          Building this surfaced two real bugs. An Exa client was caching by
          query string and silently serving future-dated docs to earlier
          filings. A Firestore index on{" "}
          <InlineCode>published_at</InlineCode> was sorted descending but
          read ascending. Both bugs helped returns. After fixing them my
          Sharpe dropped from 3.2 to 1.6.
        </Callout>
        <TradeSharpeCollapse
          number="04"
          caption="Two leakage bugs were inflating Sharpe by ~2×. Honest backtester after the fix."
          meta="sharpe 3.2 → 1.6"
        />
      </Section>

      <Section number="07" label="results" title="Paper-trading results">
        <p>Over a 90-day paper window (Jan to Mar 2026):</p>
        <p>
          <strong>+12.0%</strong> vs SPY at <strong>+4.1%</strong>. Sharpe
          ~1.6. Hit rate <strong>58%</strong> on 141 closed positions.
          Average hold 31 days, set by the thesis&apos;{" "}
          <InlineCode>horizon_days</InlineCode>, with early exit when the{" "}
          <InlineCode>counter_signal</InlineCode> triggers. Largest drawdown
          was 6.4%, mostly a cluster of accepted theses around a regional
          bank that was wrong about the rate-cut path.
        </p>
        <LineChart
          number="05"
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
          The strategy was meaningfully positive on committee-aligned trades
          (Armed Services members trading defense names) and roughly flat on
          broad-market index trades. Alpha sits in informational asymmetry,
          not in copying directional bets<FootnoteRef n={5} />.
        </p>
        <p>
          Senate trades did not outperform House trades, which is the
          opposite of the conventional &quot;Pelosi Tracker&quot; framing.
          In my window, House PTRs that survived the critic had slightly
          higher hit rates. I don&apos;t have a clean explanation. Best
          guess is selection, since more House filers means more independent
          signals after filtering.
        </p>
      </Section>

      <Section number="08" label="reflection" title="What I'd do differently">
        <p>
          Both passes are Claude, so they share priors. I want to run the
          critic on a non-Anthropic model and watch rejection rates shift.
          Position sizing is equal-weight capped at 2% NAV; a Kelly-style
          sizer keyed off the critic&apos;s{" "}
          <InlineCode>recomputed_confidence</InlineCode> is the obvious next
          step, but I don&apos;t trust my confidence calibration yet. About
          4% of PTRs come through as scanned PDFs from older filers&apos;
          offices and my parser drops them, which probably hides some of the
          most interesting trades. And 90 days isn&apos;t a backtest,
          it&apos;s a demo. I want at least two years of out-of-sample data
          before any real money goes near this, which means a historical
          Exa-snapshot corpus. That&apos;s its own project.
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
          Quantitative Analysis. Foundational paper on politician-trade
          alpha and the basis for the &quot;informational asymmetry&quot;
          framing.{" "}
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
