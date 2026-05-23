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
  TennisHomographyProjection,
  TennisShotEvent,
  TennisCoverageGap,
} from "@/components/blog";

export function TennisPost() {
  return (
    <>
      <TLDR>
        <TLDRItem>
          Phone on a tripod in, rally stats and a Claude-written coaching
          report out.
        </TLDRItem>
        <TLDRItem>
          YOLOv8n fine-tuned on ~1,200 frames handles player + ball detection.
          Kalman filter coasts the ball through occlusion.
        </TLDRItem>
        <TLDRItem>
          A 4-point court homography turns pixels into meters on a top-down
          mini-court.
        </TLDRItem>
        <TLDRItem>
          Claude never sees pixels. Just a ~6 KB JSON trace. Cheaper, more
          grounded, easier to debug.
        </TLDRItem>
        <TLDRItem>
          Caught a pattern I missed for two seasons: my UE rate jumps from{" "}
          <strong>18% to 41%</strong> once rallies cross 7 shots.
        </TLDRItem>
      </TLDR>

      <Section number="01" label="motivation" title="I forget what happened">
        <p>
          I lose to the same patterns over and over and never catch it live.
          By the time I sit down, the next server is bouncing the ball. Three
          points later I couldn&apos;t tell you if I lost the last one on a
          forehand into the net or a backhand long.
        </p>
        <p>
          Film review doesn&apos;t fix it either. <strong>Recall bias toward
          winners</strong>: I remember the one clean down-the-line winner, not
          the seven forehands I shanked into the fence at 4-4. <strong>No
          counting</strong>: even watching carefully, I can&apos;t tell you my
          average rally length or what fraction of my UEs came on the 5th-plus
          shot. The numbers are in the footage. My brain just doesn&apos;t do
          math.
        </p>
        <p>
          So I built a thing that does the counting, then hands the numbers to
          Claude to turn into a coaching writeup. That&apos;s the whole
          project.
        </p>
      </Section>

      <Section number="02" label="architecture" title="How it works">
        <p>
          The pipeline is intentionally boring. Each stage writes a JSON
          artifact the next one reads, so I can swap any piece without
          retraining anything else.
        </p>
        <FlowDiagram
          number="01"
          caption="Pixels stay on the left; only structured data crosses to Claude."
          meta="~6 KB JSON per match"
          viewBox="0 0 720 660"
          nodes={[
            {
              id: "video",
              x: 250,
              y: 20,
              w: 220,
              h: 50,
              badge: "input",
              title: "match.mp4",
            },
            {
              id: "yolo",
              x: 250,
              y: 88,
              w: 220,
              h: 60,
              badge: "01 / detect",
              title: "YOLOv8n",
              items: ["player + ball · 60 fps"],
            },
            {
              id: "byte",
              x: 250,
              y: 166,
              w: 220,
              h: 60,
              badge: "02 / track",
              title: "ByteTrack + Kalman",
              items: ["coast through occlusion"],
            },
            {
              id: "homo",
              x: 250,
              y: 244,
              w: 220,
              h: 60,
              badge: "03 / geometry",
              title: "Court Homography",
              items: ["RANSAC 4-point H"],
            },
            {
              id: "shot",
              x: 250,
              y: 322,
              w: 220,
              h: 60,
              badge: "04 / events",
              title: "Shot Detector",
              items: ["dir change + bounce"],
            },
            {
              id: "rally",
              x: 250,
              y: 400,
              w: 220,
              h: 60,
              badge: "05 / segment",
              title: "Rally Segmenter",
              items: ["serve → out"],
            },
            {
              id: "json",
              x: 200,
              y: 478,
              w: 320,
              h: 56,
              badge: "artifact",
              title: "rally_trace.json",
              tone: "accent",
            },
            {
              id: "stats",
              x: 40,
              y: 580,
              w: 260,
              h: 60,
              badge: "ui",
              title: "Stats Dashboard",
              items: ["Next.js · charts"],
            },
            {
              id: "claude",
              x: 420,
              y: 580,
              w: 260,
              h: 60,
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
                [360, 558],
                [170, 558],
              ],
            },
            {
              from: "json:bottom",
              to: "claude:top",
              waypoints: [
                [360, 558],
                [550, 558],
              ],
            },
          ]}
        />
        <p>
          When the coaching report said something weird I could open the rally
          trace and find the bad frame in seconds.
        </p>
      </Section>

      <Section number="03" label="tracking" title="Player and ball detection">
        <p>
          Started with off-the-shelf <strong>YOLOv8n</strong>
          <FootnoteRef n={1} /> so I could run CPU inference on my MacBook.
          Out of the box it found players fine (people are a COCO class) but
          hallucinated a tennis ball ~40% of the time and missed it the rest.
          A tennis ball at 1080p from baseline is a 6x6 pixel smear, and at 80
          mph it ghosts across 12-15 pixels per frame.
        </p>
        <p>
          Labeled ~1,200 frames from my own matches (CVAT, two evenings, one
          beer) and fine-tuned YOLOv8n with ball as a new class. Two things
          mattered more than model choice.
        </p>
        <p>
          <strong>Frame rate.</strong> Shooting at 60 fps roughly halved track
          fragmentation vs 30 fps. At 30 the ball jumps far enough between
          frames that the tracker drops association on hard groundstrokes.
        </p>
        <p>
          <strong>Kalman on the ball track.</strong> YOLO still drops the ball
          on contact frames and against dark backgrounds. A constant-velocity
          Kalman filter on the centroid coasts through up to 8 missing frames
          (~130 ms). Anything longer and I declare the track dead and
          re-acquire.
        </p>
        <p>
          For players I run <strong>ByteTrack</strong>
          <FootnoteRef n={5} /> on top of YOLO. Two players, fixed camera,
          baseline view, it basically never swaps IDs. One edge case: a player
          chasing a wide ball partway out of frame. I hold the last known
          position for 0.5 s before re-initializing.
        </p>
        <Callout label="tradeoff">
          I detect the ball per frame and let Kalman smooth instead of using a
          dedicated small-object tracker like TrackNet. TrackNet would
          probably buy me 5-8% recall, but it&apos;s heavier and I wanted the
          pipeline to run faster than real time on my laptop.
        </Callout>
        <p>
          End-to-end detection runs at <strong>~84 fps</strong> on an M2 Pro,
          batch size 1. A 90-minute match processes in ~32 minutes.
        </p>
      </Section>

      <Section number="04" label="geometry" title="Court homography">
        <p>
          To turn pixel coords into court coords I need a planar homography
          from the tripod view to a top-down mini-court. A tennis court is a
          known rigid rectangle (23.77 m by 10.97 m for doubles), so I get
          ground-truth correspondences as soon as I find four court points in
          the image.
        </p>
        <p>
          I detect the four service-box corners with a thin Hough-line pass on
          the green channel, then solve for <strong>H</strong> with
          OpenCV&apos;s <InlineCode>findHomography</InlineCode>
          <FootnoteRef n={2} /> under RANSAC. RANSAC matters because
          players&apos; feet sit on top of the lines I&apos;m trying to
          detect, and naive least-squares gets dragged around by those
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
        <TennisHomographyProjection
          number="02"
          caption="Tripod-view court corners projected into top-down meters via a 4-point homography."
          meta="H ∈ ℝ³ˣ³ · ransac"
        />
        <p>
          With <strong>H</strong> in hand, every foot-position and every
          ball-bounce projects to court meters via{" "}
          <InlineCode>(x, y) = (u&apos;/w&apos;, v&apos;/w&apos;)</InlineCode>.
          Calibration error vs manually annotated frames is{" "}
          <strong>±18 cm at the near baseline</strong> and{" "}
          <strong>±35 cm at the far baseline</strong> from foreshortening.
          Good enough for heatmaps, not good enough for line calls.
        </p>
        <p>
          I re-fit <strong>H</strong> once per game (between odd games, when
          players change ends) to absorb tripod drift. First version skipped
          this and the coverage heatmap slowly slid off-court over an hour.
        </p>
      </Section>

      <Section number="05" label="events" title="Shot detection and speed">
        <p>
          A shot event is the moment a racket strikes the ball. I don&apos;t
          try to detect rackets (too small, too motion-blurred). I infer the
          shot from the ball trajectory.
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
        <TennisShotEvent
          number="03"
          caption="A shot event is the frame where the ball's direction reverses sharply near a player."
          meta="θ > 110° · d < 1.2 m"
        />
        <p>
          Bounces use the same trick with the constraint that vertical pixel
          velocity flips sign while horizontal velocity continues. A small
          state machine ({" "}
          <InlineCode>(serve) → bounce → shot → bounce → shot → ...</InlineCode>{" "}
          ) and any deviation ends the rally.
        </p>
        <p>
          Speed is{" "}
          <InlineCode>pixel_velocity × meters_per_pixel</InlineCode> at the
          contact location, where{" "}
          <InlineCode>meters_per_pixel</InlineCode> comes from the local
          Jacobian of <strong>H</strong>. Honest error bars: my buddy stood
          behind the fence with a radar gun for three rallies. Flat
          groundstrokes came in within <strong>±6 mph</strong>, but I
          underestimate heavy topspin by <strong>8-12 mph</strong> because the
          real 3D arc is taller than my 2D projection assumes. I show ±10%
          confidence bands in the dashboard instead of pretending to be
          Hawk-Eye.
        </p>
      </Section>

      <Section number="06" label="rallies" title="Segmenting rallies">
        <p>
          A rally starts at the serve toss (vertical ball trajectory near a
          player behind the baseline) and ends on one of: two bounces on one
          side with no shot in between (out / not returned), the trajectory
          dying in the net region, or no ball detection for &gt; 1.0 s after
          the last shot.
        </p>
        <p>
          Edge cases. <strong>Lets</strong>: second-serve toss within 5 s of
          the previous serve, merged. <strong>Challenges and pauses</strong>:
          long detection gaps with both players stationary, close the rally
          and drop the dead time. <strong>Practice serves between
          games</strong>: filtered by requiring a rally start to follow a
          score-pause longer than 8 s. Still get a few false length-1 rallies
          I drop in post.
        </p>
        <p>
          Each rally emits one record: shot count, duration, max shot speed,
          player positions at 10 Hz, and outcome (winner / unforced / forced).
          The outcome classifier is rule-based and I&apos;m not happy with it.
          Want to swap for a small learned head eventually.
        </p>
      </Section>

      <Section number="07" label="claude" title="The coaching report">
        <p>
          This is the part I expected to be a &quot;throw the video at
          Claude&quot; call, and the part where I aggressively did the
          opposite.
        </p>
        <p>
          Claude<FootnoteRef n={3} /> never sees pixels. It gets a compact
          JSON summary of the match (typically <strong>5-7 KB</strong>
          regardless of match length) plus a system prompt defining what a
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
          Two reasons this beats &quot;describe this video.&quot;{" "}
          <strong>Tokens</strong>: a 90-minute match at 1 fps is ~5,400 frames
          for a vision model. A 6 KB JSON blob is ~1,800 tokens. Two orders of
          magnitude cheaper. <strong>Grounding</strong>: when Claude says{" "}
          <em>&quot;your UE rate jumps to 41% on long rallies,&quot;</em>{" "}
          that number is literally in the input. It&apos;s narrating a
          statistic, not inferring one from blurry pixels. Hallucination on
          quantitative claims drops to near zero.
        </p>
        <p>
          The prompt is basically:{" "}
          <em>&quot;You&apos;re a tennis coach. Here&apos;s a structured match
          summary. Find the 3 most actionable patterns, ground each in a
          specific number from the input, suggest one drill per
          pattern.&quot;</em>{" "}
          Claude is great at narration and would be much worse at counting.
          Let each model do what it&apos;s good at.
        </p>
      </Section>

      <Section number="08" label="results" title="What the pipeline found">
        <p>
          Ran it on 14 of my own matches over two months, ~220 rallies. The
          dashboard shows rally-length distribution (peaks at 3 shots, long
          tail to 18), a 9x6 coverage heatmap, UE rate by rally length, and
          shot-speed by stroke.
        </p>
        <BarChart
          number="04"
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
          The big surprise: my UE rate is{" "}
          <strong>2.2x higher on rallies of 7+ shots</strong> than on 3-6.
          Watching live I&apos;d have told you my long-rally game was a
          strength. Counted properly, the opposite is true. I get impatient
          and pull the trigger on a forehand that isn&apos;t there. Claude
          flagged this on the first batch and prescribed cross-court forehand
          consistency, 20-ball sets, no winners allowed. Three weeks in, the
          7+ UE rate is down to <strong>0.31</strong>. Small sample, right
          direction.
        </p>
        <p>
          Second pattern I&apos;d missed: my coverage is heavily biased to the
          deuce side, with a{" "}
          <strong>1.4 m gap on the ad-side baseline</strong> opponents have
          been exploiting. I had a vague sense of this. Seeing the grid made
          it impossible to ignore.
        </p>
        <TennisCoverageGap
          number="05"
          caption="My court coverage across 220 rallies. A 1.4 m hole on the ad-side baseline I never noticed live."
          meta="9 × 6 grid · 14 matches"
        />
      </Section>

      <Section number="09" label="limits" title="What this thing isn't">
        <p>
          <strong>Occlusion is the biggest source of error.</strong> When the
          ball crosses a dark-shirted player, YOLO drops it and Kalman coasts.
          On ~4% of shots I lose the contact frame entirely and have to
          interpolate, which corrupts the speed estimate.
        </p>
        <p>
          <strong>No height.</strong> The top-down homography assumes the ball
          is on the court plane, which is only true at the bounce. Topspin is
          systematically underestimated. A second camera would fix it. So
          would a learned 3D ball-trajectory model<FootnoteRef n={4} />.
          Haven&apos;t wanted either badly enough yet.
        </p>
        <p>
          <strong>Ball blur at 1080p.</strong> At higher speeds the ball is a
          3-pixel streak and YOLO confidence drops below threshold. 4K would
          help. My phone storage would not.
        </p>
        <p>
          <strong>Rule-based outcome classifier.</strong> Want to train a
          small head on rally features to call winner vs forced vs unforced.
          Needs a few hundred labeled rallies, which is a Saturday I
          haven&apos;t spent.
        </p>
        <p>
          <strong>Doubles is unsupported.</strong> Four-player tracking is
          fine, but the rally state machine assumes one player per side and
          the shot heuristics break with poaching.
        </p>
        <Callout label="reflection">
          The value isn&apos;t any single component being state of the art.
          It&apos;s the pipeline producing a structured artifact good enough
          for an LLM to coach off of. YOLO is mid. The homography is
          high-school geometry. The Kalman filter is older than I am. Claude
          is the only piece doing anything fancy, and it&apos;s doing it on 6
          KB of JSON. Feels right for a personal tool.
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
