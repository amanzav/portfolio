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

export function MultibotPost() {
  return (
    <>
      <TLDR>
        <TLDRItem>
          Three TurtleBot3 Burger units share a simulated mini-city with stop
          signs, traffic lights, and unpredictable jaywalkers.
        </TLDRItem>
        <TLDRItem>
          Each bot broadcasts a lightweight <em>intent</em> message (pose, next
          waypoint, ETA at the upcoming intersection, priority) so neighbours
          can resolve right-of-way <em>before</em> the conflict happens.
        </TLDRItem>
        <TLDRItem>
          Perception is a small YOLOv8n trained on signs and pedestrians;
          decisions live in a behavior tree; motion is Hybrid A* (global) plus
          DWA (local).
        </TLDRItem>
        <TLDRItem>
          Vs a baseline that uses only local LIDAR-based yielding, intersection
          deadlocks drop <strong>~8x</strong> and safe-arrival rate hits{" "}
          <strong>94% across 200 randomized runs</strong>.
        </TLDRItem>
        <TLDRItem>
          The single most useful field in the intent message was{" "}
          <InlineCode>eta_intersection</InlineCode>. Without it, the bots
          over-yielded and the city ground to a polite halt.
        </TLDRItem>
      </TLDR>

      <Section number="01" label="motivation" title="Why intersections deadlock">
        <p>
          The interesting failure mode in multi-agent navigation isn&apos;t
          crashing. It&apos;s <em>waiting</em>. Two robots approach a four-way
          stop, both detect the other, both back off, both re-plan, both
          approach again, both back off. Nothing crashes. Nothing moves. The
          simulator says everyone is alive and the throughput metric quietly
          bleeds to zero.
        </p>
        <p>
          This is the <strong>symmetric standoff</strong>, and it is the dual
          of the obvious failure (neither robot yields and they collide). Any
          reactive yielding policy that is purely local — &quot;if you see
          another agent in your conflict zone, slow down&quot; — sits on a
          knife edge between these two outcomes. The classical multi-agent path
          finding (MAPF) literature has been chewing on this for two decades;
          Stern et al.&apos;s 2019 survey<FootnoteRef n={1} /> gives a useful
          taxonomy of complete planners (CBS, ICTS, M*) that resolve conflicts
          at planning time by <em>jointly</em> searching the configuration
          space.
        </p>
        <p>
          The catch is that joint planners are expensive, brittle to noisy
          perception, and assume a central coordinator with a global map. I
          have three small differential-drive robots, intermittent comms, and a
          perception stack that periodically forgets a stop sign exists. I
          needed something cheaper and more local that still escaped the
          symmetry.
        </p>
        <p>
          The fix turned out to be small: don&apos;t broadcast <em>position</em>,
          broadcast <em>intent</em>. If every bot publishes &quot;I will be at
          intersection X in 2.3 seconds with priority 1,&quot; the symmetry
          breaks before the encounter, and yielding becomes a one-line rule
          instead of an emergent property of two control loops fighting each
          other.
        </p>
      </Section>

      <Section number="02" label="architecture" title="System overview">
        <p>
          Each bot runs an identical stack. The only thing that crosses the
          wire between bots is a single 50 Hz ROS 2 topic,{" "}
          <InlineCode>/fleet/intent</InlineCode>.
        </p>
        <FlowDiagram
          number="01"
          caption="Per-bot stack plus the cross-bot /fleet/intent topic. Best-effort DDS, 50 Hz."
          meta="3 bots · 50 hz topic"
          viewBox="0 0 720 720"
          nodes={[
            {
              id: "cam",
              x: 40,
              y: 30,
              w: 180,
              h: 55,
              badge: "sensor",
              title: "Camera",
            },
            {
              id: "lidar",
              x: 240,
              y: 30,
              w: 180,
              h: 55,
              badge: "sensor",
              title: "Lidar",
            },
            {
              id: "yolo",
              x: 40,
              y: 115,
              w: 180,
              h: 80,
              badge: "01",
              title: "YOLOv8n",
              items: ["signs · peds"],
            },
            {
              id: "costmap",
              x: 240,
              y: 115,
              w: 180,
              h: 80,
              badge: "02",
              title: "Local Costmap",
            },
            {
              id: "bt",
              x: 40,
              y: 230,
              w: 380,
              h: 100,
              badge: "03 / decisions",
              title: "Behavior Tree (BT.CPP)",
              items: ["right-of-way · yield vs go"],
              tone: "accent",
            },
            {
              id: "global",
              x: 40,
              y: 360,
              w: 380,
              h: 70,
              badge: "04 / global plan",
              title: "Hybrid A*",
            },
            {
              id: "local",
              x: 40,
              y: 460,
              w: 380,
              h: 70,
              badge: "05 / local plan",
              title: "DWA Refinement",
            },
            {
              id: "vel",
              x: 40,
              y: 560,
              w: 380,
              h: 65,
              badge: "06 / actuate",
              title: "/cmd_vel",
            },
            {
              id: "intent",
              x: 470,
              y: 230,
              w: 220,
              h: 100,
              badge: "shared topic",
              title: "/fleet/intent",
              items: ["pose · waypoint · eta", "priority · state"],
              tone: "accent",
            },
          ]}
          edges={[
            { from: "cam:bottom", to: "yolo:top" },
            { from: "lidar:bottom", to: "costmap:top" },
            {
              from: "yolo:bottom",
              to: "bt:top",
              waypoints: [[130, 215]],
            },
            {
              from: "costmap:bottom",
              to: "bt:top",
              waypoints: [[330, 215]],
            },
            { from: "bt:bottom", to: "global:top" },
            { from: "global:bottom", to: "local:top" },
            { from: "local:bottom", to: "vel:top" },
            { from: "bt:right", to: "intent:left", label: "pub / sub" },
          ]}
          sideText={[
            {
              x: 690,
              y: 360,
              text: "↔ other bots",
              anchor: "end",
            },
          ]}
        />
        <p>
          The behavior tree consumes both local perception and the fleet intent
          stream. Everything downstream of the BT is a normal Nav2-style
          planner-controller stack. Nothing about the planners knows that there
          are other robots in the world; that knowledge is concentrated in the
          BT.
        </p>
      </Section>

      <Section number="03" label="protocol" title="Intent broadcast">
        <p>
          I went through three iterations of this message before landing on
          something small enough to be cheap and rich enough to be useful.
        </p>
        <p>
          Iteration 1 was just{" "}
          <InlineCode>(robot_id, pose)</InlineCode>. Neighbours had to predict
          ETAs themselves, which meant each bot was effectively running an
          internal model of every other bot. Wasteful and inconsistent.
        </p>
        <p>
          Iteration 2 added <InlineCode>next_waypoint</InlineCode> and{" "}
          <InlineCode>velocity</InlineCode>. Better, but neighbours still had
          to figure out <em>which</em> intersection mattered. With a junction
          every ~3 m in the mini-city, half the field was guesswork.
        </p>
        <p>
          Iteration 3 — the one in the repo — pushes the inference into the
          publisher, where it&apos;s cheap (the bot already knows its plan):
        </p>
        <CodeBlock lang="msg" caption="fleet_msgs/msg/Intent.msg">
{`std_msgs/Header header

uint8   robot_id              # 0..N-1
geometry_msgs/Pose2D pose     # current pose in map frame
geometry_msgs/Pose2D next_waypoint

string  intersection_id       # "" if not approaching one
float32 eta_intersection      # seconds; -1 if N/A
uint8   priority              # 0=lowest, 255=highest; static per robot for now

uint8 STATE_CRUISING    = 0
uint8 STATE_APPROACHING = 1
uint8 STATE_YIELDING    = 2
uint8 STATE_CROSSING    = 3
uint8 state`}
        </CodeBlock>
        <p>
          ETAs are computed from the remaining arc length on the global plan
          divided by a smoothed velocity estimate. They&apos;re noisy —
          typically ±0.4 s at 3 m out — but the BT only needs the{" "}
          <em>ordering</em>, not the absolute value.
        </p>
        <Callout label="qos">
          I publish on a best-effort DDS QoS profile, not reliable.
          Right-of-way is decided every BT tick (10 Hz) so dropping a few
          frames is fine, and reliable QoS introduced 30–60 ms of
          head-of-line latency that occasionally caused the very deadlocks I
          was trying to avoid. Best-effort + fresh data won.
        </Callout>
      </Section>

      <Section number="04" label="decisions" title="Behavior tree for right-of-way">
        <p>
          I started with a finite state machine. It worked for two bots. With
          three, I had a state per pairwise interaction and the transition
          table became something I no longer trusted. I rewrote it as a
          behavior tree using BehaviorTree.CPP, mostly because Colledanchise and
          Ögren&apos;s textbook<FootnoteRef n={2} /> makes a convincing case
          that BTs compose better than FSMs once you have more than a handful
          of states: subtrees are reusable, fallback semantics are explicit,
          and you can hot-swap a branch without rederiving the transition
          graph.
        </p>
        <ASCIIDiagram
          number="02"
          caption="Right-of-way subtree. Fallback (?) tries children left-to-right; sequence (→) runs all in order."
        >
{`                       [Root Sequence]
                              │
                ┌─────────────┴─────────────┐
                │                           │
       [DetectIntersection?]         [DecideRightOfWay]
                                            │
                                       (Fallback ?)
                                            │
              ┌─────────────────┬───────────┴───────────┐
              │                 │                       │
     [NoConflict → Go]   [HigherPriority → Go]   [EarlierETA → Go]
                                                        │
                                                  (else → Yield)


Fallback (?):  succeed on first child that succeeds
Sequence (→): succeed only if all children succeed`}
        </ASCIIDiagram>
        <p>
          The decision logic in one line: <em>go if no conflict, or if I
          outrank my neighbour, or if I get there first; otherwise yield</em>.
          The third clause is the one that did the heavy lifting (see Results).
        </p>
        <p>
          Why this beats an FSM in practice: when I added the traffic-light
          rule three weeks in, it was a new subtree spliced under the root, not
          a rewrite of every transition. The yield/go subtree didn&apos;t even
          know traffic lights existed.
        </p>
      </Section>

      <Section number="05" label="motion" title="Hybrid A* plus DWA">
        <p>
          TurtleBots are differential-drive but the simulated bodies have
          non-trivial turning radii at the velocities I run them at, so I treat
          them as non-holonomic for planning purposes. Plain grid A* produces
          plans with in-place rotations that the controller can&apos;t track
          cleanly, especially when threading a curb cutout.
        </p>
        <p>
          <strong>Global: Hybrid A*.</strong> State is (x, y, θ); expansions
          are short kinematically-feasible arcs at a fixed steering set.
          Heuristic is the max of Reeds-Shepp distance (ignoring obstacles) and
          2D Dijkstra (ignoring kinematics), which is a standard trick to keep
          the search admissible while staying informed. Plans take 40–120 ms
          on my laptop for a 20 m route.
        </p>
        <p>
          <strong>Local: DWA.</strong> Hybrid A* gives me a path; DWA picks the
          next <InlineCode>(v, ω)</InlineCode> command from the dynamic window
          of reachable velocities, scoring each candidate trajectory and
          choosing the highest. This is where late-detected jaywalkers get
          dodged — the global plan never sees them.
        </p>
        <p>The DWA objective, classic Fox et al.<FootnoteRef n={3} />:</p>
        <Equation
          label="DWA"
          tex={`G(v, \\omega) = \\sigma\\big(\\alpha \\cdot \\text{heading}(v, \\omega) + \\beta \\cdot \\text{clearance}(v, \\omega) + \\gamma \\cdot \\text{velocity}(v, \\omega)\\big)`}
        />
        <p>
          Where <InlineCode>heading</InlineCode> rewards alignment with the
          global path&apos;s next pose, <InlineCode>clearance</InlineCode>{" "}
          rewards distance to the nearest costmap obstacle along the rolled-out
          trajectory, <InlineCode>velocity</InlineCode> rewards forward speed
          (so the bot doesn&apos;t choose to stop just to maximize clearance),
          and σ is a smoothing/normalization step. I run with{" "}
          <InlineCode>α=0.6, β=0.3, γ=0.1</InlineCode> after a small grid
          search; jaywalker-heavy scenarios wanted higher β but then the bots
          drove like learner drivers in open intersections.
        </p>
        <p>
          The interaction between BT and DWA matters: when the BT decides to{" "}
          <em>yield</em>, it doesn&apos;t stop the controller. It clamps the
          upper bound of the dynamic window to a crawl (0.05 m/s) and biases{" "}
          <InlineCode>clearance</InlineCode> upward. The bot keeps moving
          slowly, which makes resuming smooth, and crucially,{" "}
          <em>keeps publishing a non-stale ETA</em>. A stopped robot with{" "}
          <InlineCode>eta = ∞</InlineCode> confuses every neighbour&apos;s BT.
        </p>
      </Section>

      <Section number="06" label="perception" title="YOLO for signs and jaywalkers">
        <p>
          Perception is a YOLOv8n<FootnoteRef n={4} /> fine-tuned on ~2,400
          hand-labelled frames from the Gazebo cameras. Classes:{" "}
          <InlineCode>stop_sign, yield_sign, traffic_light_(red/yellow/green),
          pedestrian</InlineCode>. Training took about 40 minutes on a single
          4070, mAP@0.5 around 0.88 on a held-out 300-frame set, with the
          pedestrian class noticeably worse (0.79) than signs (0.93+).
        </p>
        <p>
          Signs are easy: they don&apos;t move, they&apos;re geometrically
          distinctive, and you can afford a high confidence threshold (0.7)
          because a missed detection on one frame is recovered on the next.
          Pedestrians are the actual perception problem. A jaywalker can appear
          from behind a parked car and be in the bot&apos;s path in under 400
          ms. Drop the confidence threshold and you get phantom pedestrians
          spawning from textured walls and the bot panic-stops in the middle of
          an intersection. Raise it and you miss the actual person.
        </p>
        <p>
          What worked: a per-track temporal vote. I run a cheap IOU tracker
          over detections and only commit to a pedestrian-in-path until
          I&apos;ve seen the track in <strong>3 of the last 5 frames at
          confidence ≥ 0.45</strong>. That&apos;s ~150 ms of latency, which the
          DWA&apos;s planning horizon (~1.2 s) absorbs comfortably. Below that
          threshold the BT treats the detection as advisory and only nudges
          clearance weights up, rather than triggering a hard yield.
        </p>
        <Callout label="perception win">
          This was the single biggest behavioural improvement on the perception
          side. Frame-by-frame thresholding gave me 67% safe-arrival; temporal
          voting got me to 94%.
        </Callout>
      </Section>

      <Section number="07" label="results" title="200 runs in a mini-city">
        <p>
          Setup: a 30 m × 30 m mini-city in Gazebo with 6 intersections (4
          stop-controlled, 2 signalized), 3 TurtleBot3 Burgers, and 8 scripted
          pedestrians who choose crossing times from a Poisson process with
          rate matched roughly to a slow college campus. Each run lasts up to 5
          minutes; each bot has a randomized 4-waypoint tour. I ran 200
          randomized seeds.
        </p>
        <p>
          Baseline: no <InlineCode>/fleet/intent</InlineCode> topic; each bot
          uses only its LIDAR-derived costmap and a naive &quot;slow if
          obstacle in conflict zone&quot; rule. Same planners, same
          perception, same BT <em>minus</em> the right-of-way subtree.
        </p>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Baseline</th>
              <th>Ours</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Safe arrivals (no collision, no timeout)</td>
              <td>71%</td>
              <td>
                <strong>94%</strong>
              </td>
            </tr>
            <tr>
              <td>Mean time-to-goal (s)</td>
              <td>78.1</td>
              <td>61.4</td>
            </tr>
            <tr>
              <td>Intersection deadlocks per run</td>
              <td>1.46</td>
              <td>
                <strong>0.18 (~8× reduction)</strong>
              </td>
            </tr>
            <tr>
              <td>Pedestrian near-misses*</td>
              <td>0.31</td>
              <td>0.22</td>
            </tr>
            <tr>
              <td>Hard stops (&gt;1.5 m/s²)</td>
              <td>4.8</td>
              <td>3.1</td>
            </tr>
          </tbody>
        </table>
        <p>
          *near-miss defined as pedestrian within 0.4 m of bot footprint at any
          point.
        </p>
        <p>
          The remaining 6% of failures cluster almost entirely around dense
          pedestrian crossings rather than vehicle-vehicle conflicts. In 11 of
          12 failures, the bot saw the pedestrian, yielded correctly, but a
          second pedestrian entered the crossing before the first cleared and
          the bot timed out waiting. That&apos;s a policy problem, not a
          coordination one — the BT has no notion of &quot;creep into the
          crossing once the leading pedestrian passes.&quot;
        </p>
      </Section>

      <Section number="08" label="ablation" title="A surprising finding">
        <p>
          I expected the <InlineCode>priority</InlineCode> field to do most of
          the work. It&apos;s the most explicit conflict-resolution signal in
          the protocol. It didn&apos;t.
        </p>
        <p>Ablating the message field-by-field:</p>
        <table>
          <thead>
            <tr>
              <th>Field removed</th>
              <th>Safe-arrival drop</th>
              <th>Deadlocks/run</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <InlineCode>priority</InlineCode>
              </td>
              <td>94% → 91%</td>
              <td>0.18 → 0.27</td>
            </tr>
            <tr>
              <td>
                <InlineCode>next_waypoint</InlineCode>
              </td>
              <td>94% → 88%</td>
              <td>0.18 → 0.41</td>
            </tr>
            <tr>
              <td>
                <InlineCode>eta_intersection</InlineCode>
              </td>
              <td>
                <strong>94% → 76%</strong>
              </td>
              <td>
                <strong>0.18 → 1.12</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <BarChart
          number="03"
          caption="Deadlocks per 5-min run by which intent field was ablated. Removing eta_intersection collapses the gains entirely."
          meta="200 runs each"
          bars={[
            { label: "full", value: 0.18 },
            { label: "no priority", value: 0.27 },
            { label: "no waypoint", value: 0.41 },
            { label: "no eta", value: 1.12, highlight: true },
            { label: "baseline", value: 1.46, highlight: true },
          ]}
          yTicks={[0, 0.3, 0.6, 0.9, 1.2, 1.5]}
          yMax={1.6}
          yFormat={(v) => v.toFixed(2)}
          xAxisLabel="condition"
          yAxisLabel="deadlocks / run"
        />
        <p>
          <InlineCode>eta_intersection</InlineCode> is doing roughly{" "}
          <strong>80% of the deadlock reduction on its own</strong>. Why:
          without an ETA, the only way for the BT to decide who goes first is
          priority or pose-distance heuristics, and both are too coarse. Two
          bots approaching at very different speeds but similar distances will
          both think the other is &quot;ahead.&quot; Both yield. Standoff.
        </p>
        <p>
          With an ETA, the asymmetry is explicit and the &quot;yield only if
          your neighbour gets there first&quot; rule fires cleanly. Priority
          becomes a tiebreaker, not the primary signal. In retrospect this is
          obvious — temporal ordering is what makes traffic legible to{" "}
          <em>humans</em> too, not spatial ordering — but I had to watch a lot
          of bots gently bow to each other for ten seconds at a time before I
          believed it.
        </p>
      </Section>

      <Section number="09" label="next" title="What's next">
        <p>Three things I&apos;d want to tackle before claiming this generalizes.</p>
        <p>
          <strong>Heterogeneous fleet.</strong> All three bots have identical
          kinematics, sensors, and the same BT. A mixed fleet (a TurtleBot, a
          slower load-carrier, a faster scout) would stress the ETA-based
          ordering and likely require a learned or negotiated priority instead
          of a static one.
        </p>
        <p>
          <strong>Comms dropout.</strong> Best-effort DDS on a single Wi-Fi
          network is generous. I&apos;d like to test with 30–50% packet loss
          and intentional 200 ms latency spikes. My hypothesis: the BT will
          need a &quot;stale intent&quot; timeout and a conservative fallback,
          which is a clean subtree addition.
        </p>
        <p>
          <strong>Real hardware.</strong> Gazebo cameras are too clean and the
          LIDAR is too honest. Real TurtleBots<FootnoteRef n={5} /> with the
          actual OAK-D camera will surface a different perception failure
          distribution, and I expect the temporal-vote window to need
          re-tuning.
        </p>
        <p>
          Longer term I&apos;m curious whether the intent topic should be
          replaced by a learned message — let a small policy decide what to
          broadcast — but that&apos;s a much bigger project and probably needs
          more than one undergraduate&apos;s worth of evenings.
        </p>
      </Section>

      <Footnotes>
        <Fn n={1}>
          Stern et al., <em>Multi-Agent Pathfinding: Definitions, Variants, and
          Benchmarks</em>, SoCS 2019 —{" "}
          <a
            href="https://arxiv.org/abs/1906.08291"
            target="_blank"
            rel="noopener noreferrer"
          >
            arxiv.org/abs/1906.08291
          </a>
          .
        </Fn>
        <Fn n={2}>
          Colledanchise &amp; Ögren, <em>Behavior Trees in Robotics and AI: An
          Introduction</em>, CRC Press, 2018. Library and reference
          implementation at{" "}
          <a
            href="https://www.behaviortree.dev/"
            target="_blank"
            rel="noopener noreferrer"
          >
            behaviortree.dev
          </a>
          .
        </Fn>
        <Fn n={3}>
          Fox, Burgard, Thrun, <em>The Dynamic Window Approach to Collision
          Avoidance</em>, IEEE R&amp;A Magazine, 1997 —{" "}
          <a
            href="https://www.ri.cmu.edu/pub_files/pub1/fox_dieter_1997_1/fox_dieter_1997_1.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            ri.cmu.edu/fox_1997
          </a>
          .
        </Fn>
        <Fn n={4}>
          Ultralytics YOLOv8 docs —{" "}
          <a
            href="https://docs.ultralytics.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.ultralytics.com
          </a>
          .
        </Fn>
        <Fn n={5}>
          TurtleBot3 platform and ROS 2 stack —{" "}
          <a
            href="https://www.turtlebot.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            turtlebot.com
          </a>{" "}
          and{" "}
          <a href="https://www.ros.org/" target="_blank" rel="noopener noreferrer">
            ros.org
          </a>
          .
        </Fn>
      </Footnotes>
    </>
  );
}
