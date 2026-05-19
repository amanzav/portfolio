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
  BarChart,
  FlowDiagram,
} from "@/components/blog";

export function TennisPost() {
  return (
    <>
      <TLDR>
        <TLDRItem>
          I record matches on a phone tripod, feed the video into a pipeline,
          and get back rally-by-rally stats plus a Claude-written coaching
          report.
        </TLDRItem>
        <TLDRItem>
          YOLOv8n fine-tuned on ~1,200 hand-labeled frames handles player + ball
          detection. A Kalman filter patches the ball through occlusion.
        </TLDRItem>
        <TLDRItem>
          A 4-point court homography projects everything onto a top-down
          mini-court so pixel motion becomes meters and meters-per-second.
        </TLDRItem>
        <TLDRItem>
          Claude never sees pixels. It sees a ~6 KB JSON rally trace per match
          and writes the report from there — cheaper, more grounded, and easier
          to debug.
        </TLDRItem>
        <TLDRItem>
          The pipeline caught a pattern I&apos;d missed for two seasons: my
          unforced error rate jumps from 18% to 41% once a rally crosses 7
          shots.
        </TLDRItem>
      </TLDR>

      <Section number="01" label="motivation" title="I forget what happened">
        <p>
          I lose to the same patterns over and over, and I never notice live.
          By the time I&apos;m sitting on the bench after a tough point, the
          next server is already bouncing the ball. Three points later I
          couldn&apos;t tell you whether I lost the last one on a forehand into
          the net or a backhand long. By point 12 of a set, point 4 is gone.
        </p>
        <p>
          Self-review on film is supposed to fix this, but in practice it has
          two failure modes.
        </p>
        <p>
          <strong>Recall bias toward winners.</strong> When I scrub through an
          hour of footage I remember the clean down-the-line passing shot. I
          do not remember the seven cross-court forehands I shanked into the
          side fence at 4–4 in the second set. The highlights overwrite the
          pattern.
        </p>
        <p>
          <strong>No counting.</strong> Even when I watch carefully, I
          can&apos;t reliably tell you my average rally length, what percentage
          of my unforced errors came on the 5th+ shot, or how much of the deuce
          side I was actually covering. Those numbers exist in the footage. My
          brain just doesn&apos;t compute them.
        </p>
        <p>
          I wanted a tool that does the counting for me, then hands the raw
          counts to a model that&apos;s actually good at turning numbers into a
          coaching narrative. That&apos;s the whole project.
        </p>
      </Section>

      <Section number="02" label="architecture" title="System overview">
        <p>
          The pipeline is intentionally boring. Each stage produces a
          structured artifact that the next stage consumes, which means I can
          swap any component without retraining the rest.
        </p>
        <FlowDiagram
          number="01"
          caption="Pixels stay on the left; only structured data crosses to Claude."
          meta="~6 KB JSON per match"
          viewBox="0 0 720 880"
          nodes={[
            {
              id: "video",
              x: 250,
              y: 20,
              w: 220,
              h: 55,
              badge: "input",
              title: "match.mp4",
            },
            {
              id: "yolo",
              x: 250,
              y: 100,
              w: 220,
              h: 80,
              badge: "01 / detect",
              title: "YOLOv8n",
              items: ["player + ball · 60 fps"],
            },
            {
              id: "byte",
              x: 250,
              y: 205,
              w: 220,
              h: 80,
              badge: "02 / track",
              title: "ByteTrack + Kalman",
              items: ["coast through occlusion"],
            },
            {
              id: "homo",
              x: 250,
              y: 310,
              w: 220,
              h: 80,
              badge: "03 / geometry",
              title: "Court Homography",
              items: ["RANSAC 4-point H"],
            },
            {
              id: "shot",
              x: 250,
              y: 415,
              w: 220,
              h: 80,
              badge: "04 / events",
              title: "Shot Detector",
              items: ["dir change + bounce"],
            },
            {
              id: "rally",
              x: 250,
              y: 520,
              w: 220,
              h: 80,
              badge: "05 / segment",
              title: "Rally Segmenter",
              items: ["serve → out"],
            },
            {
              id: "json",
              x: 200,
              y: 625,
              w: 320,
              h: 75,
              badge: "artifact",
              title: "rally_trace.json",
              items: ["compact, structured"],
              tone: "accent",
            },
            {
              id: "stats",
              x: 40,
              y: 770,
              w: 260,
              h: 75,
              badge: "ui",
              title: "Stats Dashboard",
              items: ["Next.js · charts"],
            },
            {
              id: "claude",
              x: 420,
              y: 770,
              w: 260,
              h: 75,
              badge: "llm",
              title: "Claude Coaching Report",
              items: ["narrates the numbers"],
            },
          ]}
          edges={[
            { from: "video:bottom", to: "yolo:top" },
            { from: "yolo:bottom", to: "byte:top" },
            { from: "byte:bottom", to: "homo:top" },
            { from: "homo:bottom", to: "shot:top" },
            { from: "shot:bottom", to: "rally:top" },
            { from: "rally:bottom", to: "json:top" },
            {
              from: "json:bottom",
              to: "stats:top",
              waypoints: [
                [360, 740],
                [170, 740],
              ],
            },
            {
              from: "json:bottom",
              to: "claude:top",
              waypoints: [
                [360, 740],
                [550, 740],
              ],
            },
          ]}
        />
        <p>
          The contract between stages is just JSON on disk. That made debugging
          tractable — when the coaching report said something weird, I could
          open the rally trace and find the bad frame in seconds.
        </p>
      </Section>

      <Section number="03" label="tracking" title="Player and ball detection">
        <p>
          I started with off-the-shelf <strong>YOLOv8n</strong>
          <FootnoteRef n={1} /> because I wanted CPU-friendly inference on my
          MacBook. Out of the box it found players fine (people are a COCO
          class) but it hallucinated a tennis ball roughly 40% of the time and
          missed it the rest. A tennis ball at 1080p from a baseline-tripod
          camera is, generously, a 6-by-6 pixel smear, and at 80 mph it ghosts
          across 12–15 pixels between frames.
        </p>
        <p>
          I labeled ~1,200 frames pulled from my own matches (CVAT, two
          evenings, one beer) and fine-tuned YOLOv8n with the ball as a single
          new class. Two things mattered more than the model choice.
        </p>
        <p>
          <strong>Frame rate.</strong> I shoot at 60 fps. At 30 fps the ball
          jumps far enough between frames that the tracker loses association on
          hard groundstrokes. Going to 60 fps roughly halved my track
          fragmentation.
        </p>
        <p>
          <strong>Kalman filter on the ball track.</strong> YOLO still drops
          the ball during the racket-contact frames and when it crosses a dark
          background hoarding. I run a constant-velocity Kalman filter on the
          ball centroid and let it coast through up to 8 missing frames
          (~130 ms). Anything longer and I declare the track dead and
          re-acquire.
        </p>
        <p>
          For players I use <strong>ByteTrack</strong>
          <FootnoteRef n={5} /> on top of YOLO detections. Two players, fixed
          camera, baseline view — it almost never swaps IDs. The only edge case
          is when a player chases a wide ball and partially exits frame; I
          handle that by holding the last known position for 0.5 s before
          re-initializing.
        </p>
        <Callout label="tradeoff">
          I detect the ball independently per frame and rely on Kalman to
          smooth, rather than training a dedicated small-object tracker like
          TrackNet. TrackNet would probably get me another 5–8% recall on the
          ball, but it&apos;s a heavier model and I wanted the whole pipeline
          to run faster than real time on my laptop.
        </Callout>
        <p>
          End-to-end detection runs at ~84 fps on an M2 Pro with batch size 1.
          A 90-minute match processes in roughly 32 minutes.
        </p>
      </Section>

      <Section number="04" label="geometry" title="Court homography">
        <p>
          To turn pixel coordinates into court coordinates I need a planar
          homography from the broadcast (well, tripod) view to a top-down
          mini-court. A tennis court is a known, rigid rectangle — 23.77 m by
          10.97 m for doubles — so I have ground-truth correspondences as soon
          as I can find four court points in the image.
        </p>
        <p>
          I detect the four service-box corners (the T on each side, plus the
          two singles-sideline-to-service-line intersections) using a thin
          Hough-line pass on the green channel, then solve for{" "}
          <strong>H</strong> using OpenCV&apos;s{" "}
          <InlineCode>findHomography</InlineCode>
          <FootnoteRef n={2} /> with RANSAC. RANSAC matters here because
          players&apos; feet routinely sit on top of the lines I&apos;m trying
          to detect, and a naive least-squares fit gets dragged around by those
          outliers.
        </p>
        <Equation
          label="homography"
          tex={`\\mathbf{x'} = \\mathbf{H}\\,\\mathbf{x}, \\quad
\\mathbf{H} \\in \\mathbb{R}^{3\\times 3}, \\quad
\\begin{bmatrix} u' \\\\ v' \\\\ w' \\end{bmatrix} =
\\begin{bmatrix} h_{11} & h_{12} & h_{13} \\\\ h_{21} & h_{22} & h_{23} \\\\ h_{31} & h_{32} & h_{33} \\end{bmatrix}
\\begin{bmatrix} u \\\\ v \\\\ 1 \\end{bmatrix}`}
        />
        <p>
          Once I have <strong>H</strong>, every player foot-position and every
          ball-bounce point gets projected to court meters with{" "}
          <InlineCode>(x, y) = (u&apos;/w&apos;, v&apos;/w&apos;)</InlineCode>.
          My calibration error, measured against a few manually annotated
          frames, sits around <strong>±18 cm at the baseline</strong> and
          degrades to <strong>±35 cm at the far baseline</strong> because of
          foreshortening. Good enough for coverage heatmaps; not good enough to
          litigate line calls.
        </p>
        <p>
          I re-fit <strong>H</strong> once per game (between odd games when
          players change ends) to handle slow tripod drift. Forgot to do this
          in the first version and my &quot;court coverage&quot; heatmap slowly
          slid off-court over an hour.
        </p>
      </Section>

      <Section number="05" label="events" title="Shot detection and speed">
        <p>
          A &quot;shot&quot; event is the moment a racket strikes the ball. I
          don&apos;t try to detect rackets directly — too small, too
          motion-blurred. Instead I infer shot events from the ball trajectory
          itself.
        </p>
        <CodeBlock lang="python" caption="Shot detection via ball direction reversal.">
{`def is_shot_event(ball_track, i, fps=60):
    # Look at ball velocity vectors before and after frame i
    v_before = ball_track[i].pos - ball_track[i-3].pos
    v_after  = ball_track[i+3].pos - ball_track[i].pos

    # Direction change in court-plane radians
    cos_theta = (v_before @ v_after) / (norm(v_before) * norm(v_after) + 1e-6)
    angle = math.acos(clip(cos_theta, -1, 1))

    # A shot reverses ball direction sharply AND happens near a player
    near_player = min_dist_to_player(ball_track[i].pos) < 1.2  # meters

    return angle > math.radians(110) and near_player`}
        </CodeBlock>
        <p>
          Bounces are detected the same way but with the constraint that the
          ball&apos;s vertical pixel velocity flips sign while horizontal
          velocity continues. I keep a small state machine:{" "}
          <InlineCode>(serve) → bounce → shot → bounce → shot → ...</InlineCode>{" "}
          and any deviation ends the rally.
        </p>
        <p>
          Speed is{" "}
          <InlineCode>pixel_velocity × meters_per_pixel</InlineCode> at the
          contact location, where{" "}
          <InlineCode>meters_per_pixel</InlineCode> comes from the local
          Jacobian of <strong>H</strong>. Honest error bars: against the three
          rallies where I had a buddy with a radar gun behind the fence, my
          speed estimates were within <strong>±6 mph on flat groundstrokes</strong>{" "}
          but underestimated heavy topspin shots by{" "}
          <strong>8–12 mph</strong> because the ball&apos;s true 3D arc is
          taller than my 2D projection assumes. I report speeds with a ±10%
          confidence band in the dashboard rather than pretending to be a
          Hawk-Eye.
        </p>
      </Section>

      <Section number="06" label="rallies" title="Segmenting rallies">
        <p>
          A rally starts at the serve toss (detected as a vertical ball
          trajectory near a player who is standing behind the baseline) and
          ends when one of:
        </p>
        <p>
          <strong>1.</strong> The ball bounces twice on one side without a shot
          event in between (out / not returned).{" "}
          <strong>2.</strong> The ball trajectory dies in the net region
          (z-position estimated from where it lands relative to court center).{" "}
          <strong>3.</strong> No ball detection for &gt; 1.0 s after the last
          shot.
        </p>
        <p>
          Edge cases I had to handle: <strong>Lets</strong> — second-serve toss
          within 5 seconds of the previous serve end; I merge them.{" "}
          <strong>Challenges and pauses</strong> — long ball-detection gaps
          with both players stationary; I close the rally and don&apos;t
          include the dead time. <strong>Practice serves between games</strong>{" "}
          — filtered out by requiring a &quot;rally start&quot; to follow a
          detected score-pause longer than 8 seconds. Not perfect; I still get
          a few false rallies of length 1 that I drop in post.
        </p>
        <p>
          After segmentation I emit one record per rally with shot count, total
          duration, max shot speed, player positions sampled at 10 Hz, and the
          outcome (winner / unforced error / forced error). The outcome
          classification is rule-based; I&apos;m not thrilled with this
          heuristic and I&apos;d like to swap it for a small classifier
          eventually.
        </p>
      </Section>

      <Section number="07" label="claude" title="The coaching report">
        <p>
          This is the part I most expected to be a &quot;throw the video at
          Claude&quot; call, and it&apos;s the part where I most aggressively
          did the opposite.
        </p>
        <p>
          I never send pixels. Claude<FootnoteRef n={3} /> receives a compact
          JSON summary of the match — typically <strong>5–7 KB</strong>,
          regardless of match length — plus a system prompt that defines what a
          coaching report should look like.
        </p>
        <CodeBlock lang="json" caption="The rally trace Claude actually sees.">
{`{
  "match_id": "2026-03-08_vs_kevin",
  "duration_min": 78,
  "rallies": [
    {
      "id": 42,
      "server": "me",
      "shots": 9,
      "duration_s": 14.2,
      "max_speed_mph": 71,
      "outcome": "unforced_error",
      "ending_shot": {"player": "me", "type": "forehand", "court_zone": "deuce_deep"},
      "my_court_coverage_m": 31.4,
      "opp_court_coverage_m": 22.1
    }
  ],
  "aggregates": {
    "avg_rally_len": 4.6,
    "ue_rate_by_rally_len": {"1-3": 0.12, "4-6": 0.19, "7+": 0.41},
    "fh_vs_bh_ue_ratio": 1.8,
    "coverage_heatmap_grid": "[base64 9x6 floats]"
  }
}`}
        </CodeBlock>
        <p>
          There are two reasons this beats &quot;describe this video.&quot;
        </p>
        <p>
          <strong>Tokens.</strong> A 90-minute match at even 1 fps with a
          vision model would be ~5,400 frames. A 6 KB JSON blob is roughly
          1,800 tokens. The cost difference is two orders of magnitude.
        </p>
        <p>
          <strong>Grounding.</strong> When Claude says{" "}
          <em>&quot;your unforced error rate jumps to 41% on long
          rallies&quot;</em>, that number is in the input. The model
          isn&apos;t inferring it from blurry pixels; it&apos;s narrating a
          statistic. Hallucination drops to near zero on quantitative claims
          because the quantities are right there.
        </p>
        <p>
          The prompt is essentially:{" "}
          <em>&quot;You are a tennis coach. Here is a structured match summary.
          Identify the 3 most actionable patterns, ground each claim in a
          specific number from the input, and suggest one drill per
          pattern.&quot;</em>{" "}
          Claude is very good at the narration; it would be much worse at the
          counting. So I let each model do what it&apos;s good at.
        </p>
      </Section>

      <Section number="08" label="results" title="What the pipeline found">
        <p>
          I ran the pipeline on 14 of my own matches from the last two months —
          roughly 220 rallies. The dashboard surfaces rally length distribution
          (histogram, peaks at 3 shots, long tail to 18), court coverage
          heatmap (top-down mini-court, 9×6 grid), UE rate by rally length, and
          shot-speed distribution by stroke.
        </p>
        <BarChart
          number="02"
          caption="Unforced error rate by rally length. 14 of my matches, Jan–Mar 2026, ~220 rallies total."
          meta="n=220 rallies"
          bars={[
            { label: "1–2", value: 0.09 },
            { label: "3–4", value: 0.12 },
            { label: "5–6", value: 0.19 },
            { label: "7–8", value: 0.34, highlight: true },
            { label: "9–10", value: 0.41, highlight: true },
            { label: "11+", value: 0.46, highlight: true },
          ]}
          yTicks={[0, 0.1, 0.2, 0.3, 0.4, 0.5]}
          yMax={0.55}
          yFormat={(v) => v.toFixed(2)}
          xAxisLabel="rally length (shots)"
          yAxisLabel="ue rate"
        />
        <p>
          The big surprise: my unforced error rate is{" "}
          <strong>2.2× higher on rallies of 7+ shots</strong> than on rallies
          of 3–6. Watching live I would have told you my long-rally game was a
          strength. The film, counted properly, says the opposite — I get
          impatient and pull the trigger on a forehand that isn&apos;t there.
          The Claude report flagged this on the very first batch and
          recommended a specific drill (cross-court forehand consistency,
          20-ball sets, no winners allowed). I&apos;ve been running it for
          three weeks. The 7+ UE rate is down to 0.31. Small sample, but
          moving in the right direction.
        </p>
        <p>
          A second pattern I&apos;d missed: my coverage heatmap is
          significantly biased to the deuce side, with a roughly{" "}
          <strong>1.4-meter gap on the ad-side baseline</strong> that opponents
          have been exploiting. I had a vague sense of this. Seeing the grid
          made it impossible to ignore.
        </p>
      </Section>

      <Section number="09" label="limits" title="What this thing isn't">
        <p>
          <strong>Occlusion is still the biggest source of error.</strong> When
          the ball crosses in front of a dark-shirted player, YOLO drops it and
          Kalman has to coast. On about 4% of shots I lose the contact frame
          entirely and have to interpolate the shot event, which corrupts the
          speed estimate.
        </p>
        <p>
          <strong>No height information.</strong> The top-down homography
          assumes the ball is on the court plane, which is only true at the
          bounce. Estimated shot speeds and rally arcs are projections;
          topspin is systematically underestimated. A second camera would fix
          this. So would a learned 3D ball-trajectory model
          <FootnoteRef n={4} />. I want neither badly enough to build it yet.
        </p>
        <p>
          <strong>Ball blur at 1080p.</strong> At higher shot speeds the ball
          is a 3-pixel-wide streak and YOLO&apos;s confidence drops below my
          threshold. Shooting at 4K would help; my phone storage would not.
        </p>
        <p>
          <strong>Outcome classification is rule-based and brittle.</strong>{" "}
          I&apos;d like to train a small head on top of the rally features to
          call winner vs. forced vs. unforced. That requires labeled outcomes
          for a few hundred rallies, which is a Saturday I haven&apos;t spent.
        </p>
        <p>
          <strong>Doubles is unsupported.</strong> Four-player tracking is
          fine; the rally state machine assumes one player per side and the
          shot-detection heuristics break with poaching.
        </p>
        <Callout label="reflection">
          The value isn&apos;t in any single component being state of the art.
          It&apos;s in the pipeline producing a structured artifact good enough
          for a language model to coach off of. YOLO is mid. The homography is
          high-school geometry. The Kalman filter is older than I am. Claude is
          the only piece doing anything fancy, and it&apos;s doing it on 6 KB
          of JSON. That feels like the right shape for this kind of personal
          tool.
        </Callout>
      </Section>

      <Footnotes>
        <Fn n={1}>
          Ultralytics YOLOv8 —{" "}
          <a
            href="https://docs.ultralytics.com/models/yolov8/"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.ultralytics.com/models/yolov8
          </a>
          .
        </Fn>
        <Fn n={2}>
          OpenCV <InlineCode>findHomography</InlineCode> with the RANSAC
          variant —{" "}
          <a
            href="https://docs.opencv.org/4.x/d9/dab/tutorial_homography.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.opencv.org/tutorial_homography
          </a>
          .
        </Fn>
        <Fn n={3}>
          Anthropic Claude API, used for the coaching report generation —{" "}
          <a
            href="https://www.anthropic.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            anthropic.com
          </a>
          .
        </Fn>
        <Fn n={4}>
          Huang et al., <em>TrackNet: A Deep Learning Network for Tracking
          High-speed and Tiny Objects in Sports Applications</em> —{" "}
          <a
            href="https://arxiv.org/abs/1907.03698"
            target="_blank"
            rel="noopener noreferrer"
          >
            arxiv.org/abs/1907.03698
          </a>
          .
        </Fn>
        <Fn n={5}>
          ByteTrack (Zhang et al., 2022), used for player ID tracking —{" "}
          <a
            href="https://github.com/ifzhang/ByteTrack"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/ifzhang/ByteTrack
          </a>
          .
        </Fn>
      </Footnotes>
    </>
  );
}
