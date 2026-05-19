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
} from "@/components/blog";

export function TranspirePost() {
  return (
    <>
      <TLDR>
        <TLDRItem>
          Built an XGBoost lead-ranker fed by a Playwright scraper hitting
          20+ Toronto events/day and trained on 18 months of conversion data
          — drove <strong>22 new client signups in Q1</strong>.
        </TLDRItem>
        <TLDRItem>
          Replaced a 14-day manual onboarding (one human in the loop) with a
          self-serve Next.js + Typeform + Python + Notion flow. New average:{" "}
          <strong>4 days</strong>. Pipeline tripled.
        </TLDRItem>
        <TLDRItem>
          Two scripts, one charter — &quot;grow the pipeline.&quot; First
          time being the only SWE on a team. Most of what I learned
          wasn&apos;t about ML.
        </TLDRItem>
      </TLDR>

      <Section number="01" label="context" title="Tiny startup, ship-or-die">
        <p>
          Transpire was a ~7-person startup doing event-marketing analytics
          for B2B. The product surfaced which industry events were worth
          sponsoring or attending based on a target ICP, and helped clients
          track attribution back from those events to closed revenue. The
          team was two co-founders, a designer, a couple of GTM folks, and
          one full-time engineer. I was the second engineer and the first
          intern.
        </p>
        <p>
          My charter, written verbatim on a sticky note above the
          founder&apos;s monitor, was <em>&quot;grow the pipeline.&quot;</em>{" "}
          That decomposed into two problems they kept losing sleep over:
          top of funnel (sales was manually scraping Eventbrite and cold-
          emailing organizers based on vibes) and middle of funnel (once a
          lead said yes, getting them onboarded took two weeks; most of the
          dropoff happened <em>after</em> the contract was signed). I owned
          both. No PM, no design review, no Jira. Slack messages and a
          shared Notion. Ship-or-die.
        </p>
      </Section>

      <Section number="02" label="lead ranker" title="XGBoost over scraped events">
        <p>
          The first thing I built was a Playwright scraper that ran at 6 am
          every morning and pulled the day&apos;s Toronto-area events from
          Eventbrite, Meetup, Lu.ma, and a handful of industry-specific
          listings (DevTO, TechTO, FoundersBeta). On a typical morning it
          returned 20–30 events. Each event got normalized into a row: title,
          description, organizer, expected attendance, ticket price, venue,
          and a vector of the description embedded via{" "}
          <InlineCode>sentence-transformers/all-MiniLM-L6-v2</InlineCode>
          <FootnoteRef n={2} />.
        </p>
        <p>
          Then the ranker. We had ~18 months of historical conversion data —
          every event a sales rep had ever pursued, tagged with whether it had
          eventually produced a closed deal. That gave us a labeled dataset,
          which is the only reason any of this worked. I trained an XGBoost
          classifier<FootnoteRef n={1} /> with these features:
        </p>
        <p>
          <strong>Event size</strong> (expected attendees, log-scaled).{" "}
          <strong>Organizer history</strong> — how many events this organizer
          had run before, and how many of those had previously appeared in
          our pipeline. <strong>Topic similarity</strong> — cosine distance
          between the event&apos;s description embedding and the centroid of
          all <em>converted</em> historical events.{" "}
          <strong>Day-of-week, lead time, ticket price bucket</strong> —
          small features that the gradient boosting picked up on more than I
          expected.
        </p>
        <p>
          The output was a 0–1 score that sales sorted on each morning.
          Anything above 0.7 got a same-day outreach. Below 0.3 got ignored.
          The middle was the interesting band — sales would manually triage
          those and their choices fed back into the next retrain.
        </p>
        <BarChart
          number="01"
          caption="New client signups by quarter. Ranker launched mid-Jan 2024; Q1'24 has ~10 weeks of post-launch activity."
          meta="signups / quarter"
          bars={[
            { label: "q2 '23", value: 6 },
            { label: "q3 '23", value: 8 },
            { label: "q4 '23", value: 9 },
            { label: "q1 '24", value: 22, highlight: true },
          ]}
          yTicks={[0, 5, 10, 15, 20, 25]}
          yMax={25}
          yFormat={(v) => `${v}`}
          xAxisLabel="quarter"
          yAxisLabel="new signups"
        />
        <p>
          I want to be careful not to claim full credit for the Q1 jump —
          sales also hired a new BDR in February. But the ranker meant that
          BDR walked in every morning to a sorted list instead of a blank
          Eventbrite tab, and that compounded.
        </p>
      </Section>

      <Section number="03" label="onboarding" title="Killing the 14-day onboarding">
        <p>
          Onboarding was broken in a way that nobody had time to fix, which
          is how most things at small startups stay broken.
        </p>
        <p>
          When a client signed, our CEO would do a 90-minute
          &quot;infra interview&quot; to figure out which CRM they used,
          where their event data lived, which Slack channels mattered, what
          their attribution model looked like. He&apos;d then hand-build a
          Notion workspace for them — copying from a master template,
          customizing field names, wiring up the right integrations. Averaged
          out, this took <strong>14 calendar days</strong> from contract
          signature to a usable workspace, because the CEO was also doing
          everything else a CEO does.
        </p>
        <p>I broke it into three pieces:</p>
        <p>
          <strong>1.</strong> A Next.js self-serve site at{" "}
          <InlineCode>onboard.transpire.io</InlineCode> that the new client
          landed on right after signing.{" "}
          <strong>2.</strong> A Typeform intake embedded in that site that
          asked the 23 questions from the infra interview, with branching
          logic so most clients only saw 8–12 of them.{" "}
          <strong>3.</strong> A Python script triggered by the Typeform
          webhook that ran an infra-assessment and then used the Notion API
          <FootnoteRef n={3} /> to clone our master template and auto-fill
          ~60 fields.
        </p>
        <CodeBlock lang="python" caption="The Notion auto-fill was the satisfying part.">
{`def provision_workspace(intake: dict) -> str:
    page = notion.pages.create(
        parent={"database_id": CLIENTS_DB},
        properties={
            "Name": {"title": [{"text": {"content": intake["company"]}}]},
            "CRM":  {"select": {"name": intake["crm"]}},
            "ICP":  {"rich_text": [{"text": {"content": intake["icp"]}}]},
        },
    )
    clone_template_blocks(source=TEMPLATE_ID, target=page["id"], vars=intake)
    return page["url"]`}
        </CodeBlock>
        <Callout label="human in the loop">
          The CEO was still in the loop — he reviewed every auto-provisioned
          workspace before it went to the client. But review-and-tweak is a
          20-minute job. Build-from-scratch was a multi-day job.
        </Callout>
        <p>
          Average time from contract to usable workspace dropped from 14
          days to 4. The pipeline conversion rate roughly tripled, because
          most of the dropoff had been people losing momentum during the
          wait.
        </p>
      </Section>

      <Section number="04" label="reflection" title="What I learned">
        <p>
          Two things stuck. <strong>One</strong> — at a tiny startup you
          don&apos;t get to pick which problem you work on; you pick which
          one is bleeding worst. Both my projects existed because someone
          was visibly suffering, not because they were the most technically
          interesting. <strong>Two</strong> — the ML model got the headline
          number but the boring Typeform-plus-template-cloner moved more
          revenue. Plumbing beats cleverness more often than I expected.
        </p>
      </Section>

      <Footnotes>
        <Fn n={1}>
          Chen, T. &amp; Guestrin, C. <em>XGBoost: A Scalable Tree Boosting
          System</em> —{" "}
          <a
            href="https://xgboost.readthedocs.io/"
            target="_blank"
            rel="noopener noreferrer"
          >
            xgboost.readthedocs.io
          </a>
          .
        </Fn>
        <Fn n={2}>
          Reimers, N. &amp; Gurevych, I. <em>Sentence-BERT: Sentence
          Embeddings using Siamese BERT-Networks</em> —{" "}
          <a
            href="https://www.sbert.net/"
            target="_blank"
            rel="noopener noreferrer"
          >
            sbert.net
          </a>
          .
        </Fn>
        <Fn n={3}>
          Notion API reference —{" "}
          <a
            href="https://developers.notion.com/reference/intro"
            target="_blank"
            rel="noopener noreferrer"
          >
            developers.notion.com
          </a>
          .
        </Fn>
      </Footnotes>
    </>
  );
}
