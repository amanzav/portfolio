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
  FlowDiagram,
  MultibotPoliteHalt,
  MultibotTemporalVote,
  MultibotEtaIsLoadBearing,
} from "@/components/blog";

export function MultibotPost() {
  return (
    <>
      <TLDR>
        <TLDRItem>
          Three TurtleBot3 Burgers share a simulated mini-city with stop
          signs, traffic lights, and jaywalkers who don&apos;t care about
          either.
        </TLDRItem>
        <TLDRItem>
          Each bot broadcasts an <em>intent</em> message (pose, next waypoint,
          ETA at the upcoming intersection, priority) so neighbours resolve
          right-of-way <em>before</em> the conflict happens.
        </TLDRItem>
        <TLDRItem>
          Perception is a small YOLOv8n; decisions live in a behavior tree;
          motion is Hybrid A* + DWA.
        </TLDRItem>
        <TLDRItem>
          Vs a LIDAR-only baseline, deadlocks drop <strong>~8x</strong> and
          safe-arrival hits <strong>94% over 200 runs</strong>.
        </TLDRItem>
        <TLDRItem>
          The load-bearing field was <InlineCode>eta_intersection</InlineCode>.
          Without it the bots over-yielded and the city ground to a polite
          halt.
        </TLDRItem>
      </TLDR>

      <Section number="01" label="motivation" title="The polite-halt failure">
        <p>
          The interesting failure in multi-agent nav isn&apos;t crashing,
          it&apos;s <em>waiting</em>. Two bots hit a four-way stop, both
          detect each other, both back off, both re-plan, both approach
          again, both back off. Nothing crashes. Nothing moves. The
          throughput metric quietly bleeds to zero.
        </p>
        <p>
          This is the <strong>symmetric standoff</strong>, the dual of the
          obvious failure where neither yields and they collide. Any purely
          local yielding policy sits on a knife edge between the two. The
          MAPF literature has been chewing on this for twenty years; Stern
          et al.&apos;s 2019 survey<FootnoteRef n={1} /> catalogs the
          complete planners (CBS, ICTS, M*) that resolve conflicts by
          jointly searching the configuration space.
        </p>
        <p>
          Those planners are expensive, brittle to noisy perception, and
          assume a central coordinator with a global map. I had three small
          diff-drive robots, intermittent comms, and a perception stack that
          periodically forgot stop signs existed. I needed something
          cheaper.
        </p>
        <p>
          The fix was small: don&apos;t broadcast <em>position</em>,
          broadcast <em>intent</em>. If every bot publishes &quot;I will be
          at intersection X in 2.3 seconds with priority 1,&quot; the
          symmetry breaks before the encounter, and yielding becomes a
          one-line rule instead of two control loops fighting each other.
        </p>
        <MultibotPoliteHalt
          number="01"
          caption="Symmetric standoff without ETA, clean pass with it."
          meta="with vs without eta_intersection"
        />
      </Section>

      <Section number="02" label="architecture" title="One topic between bots">
        <p>
          Each bot runs an identical stack. The only thing crossing the
          wire is one 50 Hz ROS 2 topic, <InlineCode>/fleet/intent</InlineCode>.
        </p>
        <FlowDiagram
          number="02"
          caption="Per-bot stack plus the cross-bot /fleet/intent topic. Best-effort DDS, 50 Hz."
          meta="3 bots · 50 hz topic"
          viewBox="0 0 720 540"
          nodes={[
            {
              id: "cam",
              x: 40,
              y: 20,
              w: 180,
              h: 50,
              badge: "sensor",
              title: "Camera",
            },
            {
              id: "lidar",
              x: 240,
              y: 20,
              w: 180,
              h: 50,
              badge: "sensor",
              title: "Lidar",
            },
            {
              id: "yolo",
              x: 40,
              y: 90,
              w: 180,
              h: 70,
              badge: "01",
              title: "YOLOv8n",
              items: ["signs · peds"],
            },
            {
              id: "costmap",
              x: 240,
              y: 90,
              w: 180,
              h: 70,
              badge: "02",
              title: "Local Costmap",
            },
            {
              id: "bt",
              x: 40,
              y: 180,
              w: 380,
              h: 90,
              badge: "03 / decisions",
              title: "Behavior Tree (BT.CPP)",
              items: ["right-of-way · yield vs go"],
              tone: "accent",
            },
            {
              id: "global",
              x: 40,
              y: 290,
              w: 380,
              h: 60,
              badge: "04 / global plan",
              title: "Hybrid A*",
            },
            {
              id: "local",
              x: 40,
              y: 370,
              w: 380,
              h: 60,
              badge: "05 / local plan",
              title: "DWA Refinement",
            },
            {
              id: "vel",
              x: 40,
              y: 450,
              w: 380,
              h: 60,
              badge: "06 / actuate",
              title: "/cmd_vel",
            },
            {
              id: "intent",
              x: 470,
              y: 180,
              w: 220,
              h: 90,
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
              waypoints: [[130, 170]],
            },
            {
              from: "costmap:bottom",
              to: "bt:top",
              waypoints: [[330, 170]],
            },
            { from: "bt:bottom", to: "global:top" },
            { from: "global:bottom", to: "local:top" },
            { from: "local:bottom", to: "vel:top" },
            { from: "bt:right", to: "intent:left", label: "pub / sub" },
          ]}
          sideText={[
            {
              x: 690,
              y: 290,
              text: "↔ other bots",
              anchor: "end",
            },
          ]}
        />
        <p>
          The BT eats both local perception and the fleet intent stream.
          Everything downstream is a normal Nav2-style planner-controller.
          The planners don&apos;t know other robots exist; that knowledge
          lives entirely in the BT.
        </p>
      </Section>

      <Section number="03" label="protocol" title="Intent broadcast, v3">
        <p>
          Three iterations before I landed on something small enough to be
          cheap and rich enough to be useful.
        </p>
        <p>
          <strong>v1</strong> was just <InlineCode>(robot_id, pose)</InlineCode>.
          Every bot had to run an internal model of every other bot.
          Wasteful and inconsistent.
        </p>
        <p>
          <strong>v2</strong> added <InlineCode>next_waypoint</InlineCode>{" "}
          and <InlineCode>velocity</InlineCode>. Better, but with a junction
          every ~3 m, neighbours still had to guess <em>which</em>{" "}
          intersection mattered.
        </p>
        <p>
          <strong>v3</strong> pushes the inference into the publisher, where
          it&apos;s cheap (the bot already knows its plan):
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
          ETAs are arc length on the global plan over a smoothed velocity
          estimate. Noisy — ±0.4 s at 3 m out — but the BT only needs the
          ordering, not the absolute value.
        </p>
        <Callout label="qos">
          Best-effort DDS, not reliable. Right-of-way ticks at 10 Hz so a
          few dropped frames are fine, and reliable QoS added 30–60 ms of
          head-of-line latency that occasionally caused the deadlocks I was
          trying to avoid. Fresh beats guaranteed.
        </Callout>
      </Section>

      <Section number="04" label="decisions" title="Behavior tree instead of FSM">
        <p>
          Started with a finite state machine. Worked for two bots. With
          three I had a state per pairwise interaction and the transition
          table became something I no longer trusted. Rewrote it as a
          behavior tree on BehaviorTree.CPP, mostly because Colledanchise
          and Ögren<FootnoteRef n={2} /> argue BTs compose better past a
          handful of states: subtrees reuse, fallback semantics are
          explicit, you can hot-swap a branch without rederiving the
          transition graph.
        </p>
        <ASCIIDiagram
          number="03"
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
          The decision in one line: <em>go if no conflict, or if I outrank
          my neighbour, or if I get there first; otherwise yield</em>. The
          third clause did most of the work (see Results).
        </p>
        <p>
          The payoff: when I added the traffic-light rule three weeks in,
          it was a new subtree under the root, not a rewrite of every
          transition. The yield/go subtree didn&apos;t even know traffic
          lights existed.
        </p>
      </Section>

      <Section number="05" label="motion" title="Hybrid A* plus DWA">
        <p>
          TurtleBots are diff-drive but the simulated bodies have
          non-trivial turning radii at my run velocities, so I treat them
          as non-holonomic. Plain grid A* produces in-place rotations the
          controller can&apos;t track when threading a curb cutout.
        </p>
        <p>
          <strong>Global: Hybrid A*.</strong> State is (x, y, θ);
          expansions are short kinematically-feasible arcs at a fixed
          steering set. Heuristic is the max of Reeds-Shepp distance
          (ignoring obstacles) and 2D Dijkstra (ignoring kinematics).
          Plans take <strong>40–120 ms</strong> on my laptop for a 20 m
          route.
        </p>
        <p>
          <strong>Local: DWA.</strong> Hybrid A* gives me a path; DWA picks
          the next <InlineCode>(v, ω)</InlineCode> from the dynamic window
          of reachable velocities. Late-detected jaywalkers get dodged
          here — the global plan never sees them.
        </p>
        <p>The DWA objective, classic Fox et al.<FootnoteRef n={3} />:</p>
        <Equation
          label="DWA"
          tex={`G(v, \\omega) = \\sigma\\big(\\alpha \\cdot \\text{heading}(v, \\omega) + \\beta \\cdot \\text{clearance}(v, \\omega) + \\gamma \\cdot \\text{velocity}(v, \\omega)\\big)`}
        />
        <p>
          <InlineCode>heading</InlineCode> rewards alignment with the next
          pose, <InlineCode>clearance</InlineCode> rewards distance to the
          nearest costmap obstacle, <InlineCode>velocity</InlineCode>{" "}
          rewards forward speed (so the bot doesn&apos;t stop just to
          maximize clearance). I run <InlineCode>α=0.6, β=0.3, γ=0.1</InlineCode>{" "}
          after a small grid search. Jaywalker-heavy scenarios wanted
          higher β but then the bots drove like learner drivers in open
          intersections.
        </p>
        <p>
          BT and DWA interaction matters: when the BT decides to{" "}
          <em>yield</em>, it doesn&apos;t stop the controller. It clamps
          the dynamic window&apos;s upper bound to a crawl (0.05 m/s) and
          biases clearance up. The bot keeps creeping, which makes resuming
          smooth and — crucially — <em>keeps publishing a non-stale ETA</em>.
          A stopped robot with <InlineCode>eta = ∞</InlineCode> confuses
          every neighbour&apos;s BT.
        </p>
      </Section>

      <Section number="06" label="perception" title="YOLO for signs and jaywalkers">
        <p>
          YOLOv8n<FootnoteRef n={4} /> fine-tuned on ~2,400 hand-labelled
          Gazebo frames. Classes: <InlineCode>stop_sign, yield_sign,
          traffic_light_(red/yellow/green), pedestrian</InlineCode>. ~40
          minutes on a 4070, mAP@0.5 around 0.88, pedestrians noticeably
          worse (0.79) than signs (0.93+).
        </p>
        <p>
          Signs are easy. They don&apos;t move, they&apos;re geometrically
          distinct, you can run a high confidence threshold (0.7) because
          a missed frame is recovered on the next. Pedestrians are the
          actual problem. A jaywalker can appear from behind a parked car
          and be in the bot&apos;s path in under 400 ms. Drop the
          threshold and you get phantom pedestrians spawning from textured
          walls and the bot panic-stops mid-intersection. Raise it and you
          miss the real person.
        </p>
        <p>
          What worked: a per-track temporal vote. I run a cheap IOU
          tracker and only commit to a pedestrian-in-path once I&apos;ve
          seen the track in <strong>3 of the last 5 frames at confidence
          ≥ 0.45</strong>. That&apos;s ~150 ms of latency, which the
          DWA&apos;s ~1.2 s horizon absorbs comfortably. Below threshold
          the BT treats the detection as advisory and only nudges
          clearance weights up.
        </p>
        <Callout label="perception win">
          Biggest single improvement on the perception side.
          Frame-by-frame thresholding got 67% safe-arrival; temporal
          voting got 94%.
        </Callout>
        <MultibotTemporalVote
          number="04"
          caption="Per-track vote commits the real jaywalker, rejects the phantom."
          meta="3 of last 5 @ conf ≥ 0.45"
        />
      </Section>

      <Section number="07" label="results" title="200 runs in a mini-city">
        <p>
          Setup: a 30 m × 30 m Gazebo mini-city with 6 intersections (4
          stop-controlled, 2 signalized), 3 TurtleBot3 Burgers, 8 scripted
          pedestrians crossing on a Poisson process tuned to a slow
          college campus. Each run is up to 5 minutes with a randomized
          4-waypoint tour per bot. 200 seeds.
        </p>
        <p>
          Baseline: same stack minus <InlineCode>/fleet/intent</InlineCode>{" "}
          and the right-of-way subtree. Each bot uses only its LIDAR
          costmap and &quot;slow if obstacle in conflict zone.&quot;
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
          *near-miss = pedestrian within 0.4 m of bot footprint.
        </p>
        <p>
          The remaining 6% of failures cluster around dense pedestrian
          crossings, not vehicle-vehicle conflicts. In 11 of 12 failures
          the bot saw the pedestrian, yielded correctly, and then a second
          pedestrian entered before the first cleared and the bot timed
          out waiting. That&apos;s a policy hole — the BT has no notion of
          &quot;creep in once the leading pedestrian passes.&quot;
        </p>
      </Section>

      <Section number="08" label="ablation" title="The surprising field">
        <p>
          I expected <InlineCode>priority</InlineCode> to do most of the
          work. It&apos;s the most explicit conflict-resolution signal in
          the message. It didn&apos;t.
        </p>
        <p>Field-by-field ablation:</p>
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
        <MultibotEtaIsLoadBearing
          number="05"
          caption="Removing eta_intersection collapses ~80% of the deadlock-reduction gain."
          meta="200 runs · deadlocks per 5-min run"
        />
        <p>
          <InlineCode>eta_intersection</InlineCode> does roughly{" "}
          <strong>80% of the deadlock reduction on its own</strong>.
          Without an ETA, the BT has to fall back on priority or
          pose-distance, and both are too coarse. Two bots approaching at
          different speeds but similar distances will both think the other
          is ahead. Both yield. Standoff.
        </p>
        <p>
          With an ETA the asymmetry is explicit and the &quot;yield only
          if your neighbour gets there first&quot; rule fires cleanly.
          Priority becomes a tiebreaker. Obvious in retrospect — temporal
          ordering is what makes traffic legible to humans too — but I
          had to watch a lot of bots gently bow to each other for ten
          seconds at a time before I believed it.
        </p>
      </Section>

      <Section number="09" label="next" title="What I&apos;d push on next">
        <p>
          <strong>Heterogeneous fleet.</strong> All three bots are
          identical. Mix in a slow load-carrier and a fast scout and the
          ETA ordering breaks; static priority probably needs to become
          negotiated or learned.
        </p>
        <p>
          <strong>Comms dropout.</strong> Best-effort DDS on one Wi-Fi
          network is generous. 30–50% packet loss and 200 ms spikes would
          stress it. My guess: the BT needs a stale-intent timeout and a
          conservative fallback, which is a clean subtree addition.
        </p>
        <p>
          <strong>Real hardware.</strong> Gazebo cameras are too clean and
          the LIDAR too honest. Real TurtleBots<FootnoteRef n={5} /> with
          an OAK-D will surface a different failure distribution and the
          temporal-vote window will need re-tuning.
        </p>
        <p>
          Longer term I want to know whether the intent topic should be
          replaced by a learned message — let a small policy decide what
          to broadcast. That&apos;s a much bigger project and probably
          needs more than one undergrad&apos;s worth of evenings.
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
