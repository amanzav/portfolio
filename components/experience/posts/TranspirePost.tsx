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
  LeadRankerPipeline,
  OnboardingShrink,
} from "@/components/blog";

export function TranspirePost() {
  return (
    <>
      <TLDR>
        <TLDRItem>
          Built an XGBoost lead-ranker on top of a Playwright scraper pulling
          20+ Toronto events a day, trained on 18 months of conversion data.
          Drove <strong>22 new client signups in Q1</strong>.
        </TLDRItem>
        <TLDRItem>
          Replaced a 14-day manual onboarding with a self-serve Next.js +
          Typeform + Python + Notion flow. New average:{" "}
          <strong>4 days</strong>. Pipeline tripled.
        </TLDRItem>
        <TLDRItem>
          Two scripts, one charter: &quot;grow the pipeline.&quot; First time
          being the only SWE on a team. Most of what I learned wasn&apos;t
          about ML.
        </TLDRItem>
      </TLDR>

      <Section number="01" label="context" title="Tiny startup, ship-or-die">
        <p>
          Transpire was a ~7-person startup doing event-marketing analytics
          for B2B. The product told you which industry events were worth
          sponsoring based on your ICP, and tracked attribution back to
          closed revenue. Two co-founders, a designer, a couple of GTM folks,
          one full-time engineer. I was the second engineer and the first
          intern.
        </p>
        <p>
          My charter, written on a sticky note above the founder&apos;s
          monitor, was <em>&quot;grow the pipeline.&quot;</em> That split
          into two problems they kept losing sleep over. Top of funnel (sales
          was scraping Eventbrite by hand and cold-emailing organizers on
          vibes) and middle of funnel (once a lead said yes, onboarding took
          two weeks and most of the dropoff happened <em>after</em> the
          contract was signed). I owned both. No PM, no design review, no
          Jira. Slack and a shared Notion. Ship-or-die.
        </p>
      </Section>

      <Section number="02" label="lead ranker" title="XGBoost over scraped events">
        <p>
          First thing I built was a Playwright scraper that ran at 6 am and
          pulled the day&apos;s Toronto events from Eventbrite, Meetup,
          Lu.ma, and a few industry listings (DevTO, TechTO, FoundersBeta).
          Usually 20 to 30 events. Each one got normalized into a row: title,
          description, organizer, expected attendance, ticket price, venue,
          and a description embedding from{" "}
          <InlineCode>sentence-transformers/all-MiniLM-L6-v2</InlineCode>
          <FootnoteRef n={2} />.
        </p>
        <p>
          Then the ranker. We had ~18 months of historical conversion data,
          every event a sales rep had pursued, tagged with whether it ever
          produced a closed deal. That label set is the only reason any of
          this worked. I trained an XGBoost classifier
          <FootnoteRef n={1} /> on a few features:
        </p>
        <p>
          <strong>Event size</strong> (expected attendees, log-scaled).{" "}
          <strong>Organizer history</strong>, how many events they&apos;d run
          and how many had landed in our pipeline.{" "}
          <strong>Topic similarity</strong>, cosine distance from the
          description embedding to the centroid of <em>converted</em>{" "}
          historical events. <strong>Day-of-week, lead time, ticket price
          bucket</strong>. The boring features mattered more than I expected.
        </p>
        <p>
          Output was a 0 to 1 score that sales sorted on every morning. Above
          0.7 got same-day outreach. Below 0.3 got ignored. The middle band
          was the interesting one. Sales triaged those by hand and their
          picks fed the next retrain.
        </p>
        <LeadRankerPipeline
          number="01"
          caption="Scrape, normalize, embed, score, bucket. Sales sorts on the score every morning."
        />
        <BarChart
          number="02"
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
          I won&apos;t claim full credit for the Q1 jump. Sales also hired a
          new BDR in February. But that BDR walked in every morning to a
          sorted list instead of a blank Eventbrite tab, and that compounded.
        </p>
      </Section>

      <Section number="03" label="onboarding" title="Killing the 14-day onboarding">
        <p>
          Onboarding was broken in the way things stay broken at small
          startups: nobody had time to fix it.
        </p>
        <p>
          When a client signed, the CEO ran a 90-minute &quot;infra
          interview&quot; to figure out their CRM, where their event data
          lived, which Slack channels mattered, what their attribution model
          looked like. Then he hand-built a Notion workspace for them,
          copying from a master template, renaming fields, wiring
          integrations. End to end, about <strong>14 days</strong> from
          contract to a usable workspace, because the CEO was also doing
          everything else a CEO does.
        </p>
        <p>I broke it into three pieces:</p>
        <p>
          <strong>1.</strong> A Next.js self-serve site at{" "}
          <InlineCode>onboard.transpire.io</InlineCode> that the new client
          landed on right after signing. <strong>2.</strong> A Typeform
          intake on that site with the 23 questions from the infra
          interview, branching so most clients only saw 8 to 12.{" "}
          <strong>3.</strong> A Python script triggered by the Typeform
          webhook that did the infra assessment and used the Notion API
          <FootnoteRef n={3} /> to clone the master template and auto-fill
          ~60 fields.
        </p>
        <OnboardingShrink
          number="03"
          caption="14-day manual build, 4-day self-serve flow."
        />
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
          The CEO still reviewed every auto-provisioned workspace before it
          went out. But review-and-tweak is 20 minutes. Build-from-scratch
          was multiple days.
        </Callout>
        <p>
          Contract-to-workspace dropped from 14 days to 4. Pipeline
          conversion roughly tripled, because most of the dropoff was people
          losing momentum during the wait.
        </p>
      </Section>

      <Section number="04" label="reflection" title="What I learned">
        <p>
          Two things stuck. <strong>One</strong>, at a tiny startup you
          don&apos;t pick which problem to work on, you pick the one that&apos;s
          bleeding worst. Both my projects existed because someone was
          visibly suffering, not because they were the most interesting.{" "}
          <strong>Two</strong>, the ML model got the headline number but the
          boring Typeform-plus-template-cloner moved more revenue. Plumbing
          beats cleverness more often than I expected.
        </p>
      </Section>

      <Footnotes>
        <Fn n={1}>
          Chen, T. &amp; Guestrin, C. <em>XGBoost: A Scalable Tree Boosting
          System</em>.{" "}
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
          Embeddings using Siamese BERT-Networks</em>.{" "}
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
          Notion API reference.{" "}
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
