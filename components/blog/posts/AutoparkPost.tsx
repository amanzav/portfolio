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
} from "@/components/blog";

export function AutoparkPost() {
  return (
    <>
      <TLDR>
        <TLDRItem>
          End-to-end autonomous parking stack on ROS 2 for UWAFT&apos;s
          competition EV: perception, planning, control, CAN actuation.
        </TLDRItem>
        <TLDRItem>
          YOLOv8 + stereo depth fusion produces a metric occupancy grid that
          flags open bays at 0/15/30/45° approach angles.
        </TLDRItem>
        <TLDRItem>
          Hybrid A* with Reeds-Shepp analytic expansion handles non-holonomic
          constraints; max-of-two heuristic keeps the search admissible.
        </TLDRItem>
        <TLDRItem>
          Cascaded PID tracker (cross-track, heading, longitudinal) hits{" "}
          <strong>8 cm RMSE</strong> across 50+ CARLA scenarios including wet
          pavement and dynamic pedestrians.
        </TLDRItem>
        <TLDRItem>
          The hardest failure wasn&apos;t planning — it was a perception FoV
          collapse mid-maneuver. Fixed with a &quot;commit point.&quot;
        </TLDRItem>
      </TLDR>

      <Section number="01" label="motivation" title="Why parking is harder than driving">
        <p>
          Driving on a highway is, in a planning sense, almost trivial: you
          stay in a lane, the kinematic envelope of useful trajectories is
          narrow, and you essentially never need to go backwards. Parking
          violates every one of those assumptions.
        </p>
        <p>
          A car is a <strong>non-holonomic</strong> system. Its instantaneous
          velocity vector is constrained to point along its heading; you
          can&apos;t strafe. The configuration space is three-dimensional
          (x, y, θ) but the control space is two-dimensional (steering +
          throttle). This means the set of reachable states from any pose is a
          thin, curved manifold inside SE(2), not a ball. In a tight parking
          bay, the goal pose lies in a region that simply{" "}
          <em>cannot be reached</em> by any forward-only trajectory — you have
          to weave, reverse, and re-approach.
        </p>
        <p>Add to this:</p>
        <p>
          <strong>Tight clearances.</strong> A standard bay is ~2.5 m wide. The
          EV is 1.85 m wide. The lateral margin is on the order of the
          localization error.{" "}
          <strong>Oblique bay detection.</strong> When you approach a lot at
          30°, the bay opening is foreshortened, the dividing lines are
          partially occluded by parked vehicles, and the depth signal is noisy
          at grazing incidence.{" "}
          <strong>Reverse maneuvers.</strong> Most production stacks (Apollo,
          Autoware) treat reverse as a corner case. For parking it&apos;s the{" "}
          <em>common</em> case.{" "}
          <strong>Cold-start braking.</strong> The competition rubric
          penalizes any jerk above 2 m/s³ on engagement, which means I
          can&apos;t just stomp the brake the moment a path is published.
        </p>
        <p>
          This is the &quot;easy for humans, brutal for planners&quot; regime.
          Everything that follows is an attempt to make the planner a little
          less brutalized.
        </p>
      </Section>

      <Section number="02" label="architecture" title="System overview">
        <p>
          The full stack runs as eight ROS 2 nodes on a Jetson Orin, talking
          over DDS with intra-process zero-copy where I could get away with
          it.
        </p>
        <FlowDiagram
          number="01"
          caption="Auto Park pipeline. Sensors merge into a fused costmap; planner runs at 2 Hz, control at 50 Hz."
          meta="10 hz / 50 hz"
          viewBox="0 0 720 820"
          nodes={[
            {
              id: "stereo",
              x: 50,
              y: 20,
              w: 220,
              h: 70,
              badge: "sensor · 60 hz",
              title: "Stereo Camera",
            },
            {
              id: "lidar",
              x: 450,
              y: 20,
              w: 220,
              h: 70,
              badge: "sensor · 16 ch",
              title: "Lidar",
            },
            {
              id: "yolo",
              x: 50,
              y: 130,
              w: 220,
              h: 85,
              badge: "01 / detect",
              title: "YOLOv8 Det",
              items: ["bay + obstacle"],
            },
            {
              id: "depth",
              x: 450,
              y: 130,
              w: 220,
              h: 85,
              badge: "02 / depth",
              title: "Depth Project",
              items: ["lidar as prior"],
            },
            {
              id: "fusion",
              x: 180,
              y: 255,
              w: 360,
              h: 90,
              badge: "03 / fusion",
              title: "Sensor Fusion",
              items: ["semantics + metric depth"],
            },
            {
              id: "grid",
              x: 180,
              y: 375,
              w: 360,
              h: 75,
              badge: "04 / map",
              title: "Occupancy Grid + Bay Polygons",
            },
            {
              id: "planner",
              x: 180,
              y: 480,
              w: 360,
              h: 90,
              badge: "05 / plan · 2 hz",
              title: "Hybrid A*",
              items: ["Reeds-Shepp analytic expansion"],
            },
            {
              id: "pid",
              x: 180,
              y: 600,
              w: 360,
              h: 85,
              badge: "06 / control · 50 hz",
              title: "PID Tracker",
              items: ["xtrack · heading · longitudinal"],
            },
            {
              id: "can",
              x: 180,
              y: 715,
              w: 360,
              h: 80,
              badge: "07 / actuate",
              title: "CAN Actuation",
              items: ["steer · throttle · brake"],
              tone: "accent",
            },
          ]}
          edges={[
            { from: "stereo:bottom", to: "yolo:top" },
            { from: "lidar:bottom", to: "depth:top" },
            {
              from: "yolo:bottom",
              to: "fusion:top",
              waypoints: [
                [160, 245],
                [280, 245],
              ],
            },
            {
              from: "depth:bottom",
              to: "fusion:top",
              waypoints: [
                [560, 245],
                [440, 245],
              ],
            },
            { from: "fusion:bottom", to: "grid:top" },
            { from: "grid:bottom", to: "planner:top" },
            { from: "planner:bottom", to: "pid:top" },
            { from: "pid:bottom", to: "can:top" },
          ]}
        />
        <p>
          Each box on the left runs at sensor cadence; the planner re-plans at
          2 Hz unless an obstacle delta exceeds 0.3 m, in which case it
          preempts; control runs at 50 Hz and is the only thing on a real-time
          scheduler.
        </p>
      </Section>

      <Section number="03" label="perception" title="Bay and obstacle detection">
        <p>I tried three perception approaches before settling on a fused one.</p>
        <p>
          <strong>Approach 1 — pure lidar segmentation.</strong> Lidar gives
          you clean geometry but is semantically blind. A bay is just a flat
          patch of asphalt; so is a driving lane. I could detect{" "}
          <em>that there is room</em> but not{" "}
          <em>that it is a bay</em>.
        </p>
        <p>
          <strong>Approach 2 — pure RGB segmentation.</strong> A monocular
          YOLO model identifies bay lines beautifully in well-lit conditions
          but gives no metric scale. A 30-pixel-wide line could be a bay 3 m
          away or a parking lot pattern 12 m away. Useless for planning.
        </p>
        <p>
          <strong>Approach 3 — fusion.</strong> YOLOv8-s
          <FootnoteRef n={5} /> trained on a custom dataset (about 14k frames,
          ~9k of them synthesized from CARLA with randomized lighting, pavement
          texture, and bay orientation to bootstrap labels before I had real
          footage). The detector outputs four corners of each bay polygon and
          bounding boxes for obstacles. Depth from stereo (Semi-Global
          Matching, with the lidar projected in as a sparse prior to stabilize
          textureless asphalt) gives metric z per pixel. The fusion node lifts
          each detection&apos;s pixel polygon into a 3D polygon and rasterizes
          everything into a 20 cm resolution occupancy grid with three
          channels: <InlineCode>free</InlineCode>,{" "}
          <InlineCode>occupied</InlineCode>,{" "}
          <InlineCode>bay_candidate</InlineCode>.
        </p>
        <Callout label="leverage">
          The CARLA-synthesized labels were the single highest-leverage
          decision in the whole project. I spent four days writing the
          synthesis pipeline and saved roughly six weeks of manual labeling.
          The synthetic-to-real domain gap was real (mAP dropped from 0.91 sim
          to 0.74 on the small real validation set I scraped from a Waterloo
          parking lot at 2 a.m.) but recoverable with about 1,500 real labels
          and a fine-tune.
        </Callout>
        <p>
          The output of perception, for the planner, is dead simple: a costmap
          and a list of candidate goal poses (one per detected bay, with
          confidence and orientation).
        </p>
      </Section>

      <Section number="04" label="planner" title="Hybrid A* is the heart of the stack">
        <p>
          Grid-based A* fails for car-like robots because the search nodes
          don&apos;t carry heading. You can find a <em>path</em> through cells
          but it&apos;s not necessarily <em>drivable</em> — the resulting
          polyline ignores the turning radius and ends up demanding
          instantaneous heading changes the steering rack can&apos;t physically
          execute.
        </p>
        <p>
          <strong>Hybrid A*</strong>
          <FootnoteRef n={1} /> fixes this by letting nodes carry continuous
          state. Each node is (x, y, θ) and expansions are short kinematic arcs
          at a fixed set of steering inputs (typically{" "}
          <InlineCode>
            {"{−δ_max, −δ_max/2, 0, +δ_max/2, +δ_max}"}
          </InlineCode>{" "}
          in both forward and reverse). Children land at non-grid-aligned
          positions; the discretization is only used for the closed set (to
          bound the search). This is the key trick — the <em>search</em> is
          discrete but the <em>states</em> are continuous.
        </p>
        <p>The cost function I&apos;m minimizing at each node:</p>
        <Equation
          label="cost"
          tex={`f(n) = g(n) + h(n), \\quad h(n) = \\max\\big(h_{\\text{nh}}(n),\\; h_{\\text{ho}}(n)\\big)`}
        />
        <p>
          where <InlineCode>g(n)</InlineCode> accumulates arc length plus
          penalties (a multiplier of 1.5 on reverse motion, 2.0 on direction
          changes — flipping from forward to reverse is what hurts passengers
          most), and <InlineCode>h(n)</InlineCode> is the larger of two
          heuristics:
        </p>
        <p>
          <InlineCode>h_nh</InlineCode>: the{" "}
          <strong>non-holonomic-without-obstacles</strong> heuristic. Length of
          the shortest Reeds-Shepp<FootnoteRef n={2} /> curve from n to the
          goal, ignoring the costmap. Captures kinematics.{" "}
          <InlineCode>h_ho</InlineCode>: the{" "}
          <strong>holonomic-with-obstacles</strong> heuristic. Length of the
          shortest grid-A* path from n to the goal, ignoring kinematics.
          Captures geometry.
        </p>
        <p>
          Taking the max gives an admissible heuristic that dominates either
          one alone. This is straight out of Dolgov et al.; I didn&apos;t
          invent it, I just verified it works.
        </p>
        <p>
          Near the goal, expanding kinematic arcs gets wasteful because you
          almost never land on the goal pose exactly. Instead I attempt an{" "}
          <strong>analytic expansion</strong>: shoot a Reeds-Shepp curve from
          the current node directly to the goal, and if it&apos;s
          collision-free in the costmap, accept it as the tail of the path.
          This dramatically reduces node count — typical searches close
          1,200–4,000 nodes for a parallel-park maneuver versus the 40k+ I was
          seeing without analytic expansion.
        </p>
        <Callout label="subtle bug">
          The Reeds-Shepp shooting needs to respect the <em>same</em> footprint
          inflation as the grid-A* heuristic. Early on I had them inflated
          differently and the planner would emit paths the tracker
          couldn&apos;t execute because they grazed the inflation boundary.
          Painful debug.
        </Callout>
      </Section>

      <Section number="05" label="control" title="Three PIDs and a tuning story">
        <p>
          The tracker is intentionally boring. I have three independent PID
          loops running at 50 Hz.
        </p>
        <p>
          <strong>Cross-track PID.</strong> Drives lateral error{" "}
          <InlineCode>e_y</InlineCode> to zero by adding to a feedforward
          steering command computed from the path curvature.{" "}
          <strong>Heading PID.</strong> Drives heading error{" "}
          <InlineCode>e_ψ</InlineCode> to zero. This and the cross-track output
          are summed into a single steering command.{" "}
          <strong>Longitudinal PID.</strong> Drives speed error to zero. The
          setpoint comes from a velocity profile precomputed along the path
          (slower at high-curvature segments, zero at direction-change cusps).
        </p>
        <p>
          Cross-track error is computed against the closest point on the
          planned path:
        </p>
        <Equation
          label="cross-track"
          tex={`e_y(t) = \\big(\\mathbf{p}_{\\text{car}}(t) - \\mathbf{p}_{\\text{path}}^{*}(t)\\big) \\cdot \\hat{\\mathbf{n}}_{\\text{path}}^{*}(t)`}
        />
        <p>
          with <InlineCode>p*_path</InlineCode> the nearest path point and{" "}
          <InlineCode>n̂</InlineCode> its left-hand normal so sign carries
          which side of the path we&apos;re on.
        </p>
        <p>
          <strong>Tuning story.</strong> I started with Ziegler-Nichols on a
          flat straight segment. It gave me{" "}
          <InlineCode>K_p = 0.8, K_i = 0.05, K_d = 0.12</InlineCode> for
          cross-track. Forward driving looked great. The moment I asked it to
          track a reverse arc, it oscillated. Twice I almost concluded the
          planner was emitting infeasible paths before I realized the issue:
          the cross-track error sign convention flips during reverse motion
          (the front axle becomes the &quot;back&quot; of the kinematic model),
          and ZN had tuned for a regime that simply didn&apos;t apply.
        </p>
        <p>
          I hand-tuned a second set of gains for reverse{" "}
          (<InlineCode>K_p = 0.45, K_i = 0.02, K_d = 0.18</InlineCode> — much
          softer P, more D for damping) and switched gain sets based on the
          commanded gear. ZN is great when your plant is stationary; for
          parking, the plant changes character every time the car shifts.
        </p>
      </Section>

      <Section number="06" label="validation" title="CARLA scenario harness">
        <p>
          I built a scenario harness on top of CARLA 0.9.15
          <FootnoteRef n={4} /> with a small YAML DSL.
        </p>
        <CodeBlock lang="yaml" caption="One scenario from the validation suite.">
{`# scenarios/oblique_30deg_wet_pedestrian.yaml
map: Town04
weather:
  precipitation: 0.6
  road_wetness: 0.8
  cloudiness: 0.7
ego:
  spawn: {x: 142.3, y: -88.1, yaw: 30.0}
  initial_speed: 2.0     # m/s, rolling start
target_bay:
  id: "bay_07"
  occupancy: empty
  neighbors: [occupied, occupied]
actors:
  - type: pedestrian
    spawn: {x: 138.0, y: -90.5}
    behavior: cross_at_t=4.0s
  - type: vehicle
    spawn: {x: 130.0, y: -85.0}
    behavior: static
metrics:
  - final_pose_error
  - max_lateral_deviation
  - max_jerk
  - planning_latency_p99`}
        </CodeBlock>
        <p>
          Across 52 scenarios spanning bay approach angles of 0, 15, 30, and
          45°, both parallel and perpendicular bays, wet and dry pavement, and
          three pedestrian profiles, I measured{" "}
          <strong>8.1 cm RMSE on final pose translation</strong> and 2.3°
          RMSE on final heading. The p99 planning latency was 187 ms; control
          loop jitter stayed under 2 ms.
        </p>
        <p>
          The 8 cm number is honest but with a caveat: it&apos;s the mean
          across scenarios where the maneuver completed successfully. Three
          scenarios timed out (all at 45° approach with a wet shoulder) and
          aren&apos;t in the average. I&apos;ll fix those before competition.
        </p>
      </Section>

      <Section number="07" label="war story" title="The bug that took three weeks">
        <p>
          Here&apos;s the most useful thing I learned, and it has nothing to do
          with algorithms.
        </p>
        <p>
          Reverse-into-bay maneuvers kept failing at the very end — the car
          would get 80% of the way in, the planner would emit an infeasible
          path, and the tracker would either freeze or back out and re-attempt.
          I spent a week tuning Hybrid A* expansion granularity, a week
          scrutinizing the cost function, and a week suspecting localization
          drift.
        </p>
        <p>
          The actual problem was perception. Once the car was deep inside the
          bay, the stereo cameras (mounted on the A-pillar with a
          forward-biased FoV) lost sight of the bay&apos;s rear and side
          markings. The fusion node dutifully reported the bay as{" "}
          <em>low confidence</em> and the planner — which I had set to re-plan
          on every confidence drop — would invalidate the in-flight path and
          search from the new (mostly-uninformed) costmap. It would then find a
          different, often worse, path.
        </p>
        <p>
          The fix was not algorithmic. I added a{" "}
          <strong>commit point</strong>: once the planner is within 1.5 m of
          the goal pose with heading error below 10°, the path is{" "}
          <em>frozen</em> and the tracker runs it open-loop to completion (with
          emergency-stop on lidar collision detection as the only override).
          It&apos;s an ugly, finite-state-machine-ish hack. It works perfectly.
        </p>
        <Callout label="lesson">
          The failure I was chasing in the planner was caused by a feedback
          loop with perception. When the search space is contested between two
          modules at the same frequency, the bug lives in the protocol between
          them, not inside either one. I now spend more time thinking about the{" "}
          <em>cadence</em> of inter-module communication than about the
          algorithms inside them.
        </Callout>
      </Section>

      <Section number="08" label="next" title="What's next">
        <p>Three things on the deployment roadmap.</p>
        <p>
          <strong>Real-car sensor noise.</strong> CARLA&apos;s stereo is too
          clean. I&apos;m collecting ZED 2i data in the actual UWAFT lot to
          retrain the YOLO head and resample the depth-prior noise model.
        </p>
        <p>
          <strong>Latency budget on Jetson Orin.</strong> The fusion node is
          currently 28 ms p50 on a desktop RTX 3070. I have 80 ms total to play
          with at 10 Hz; I need to TensorRT-quantize the YOLO backbone
          (probably to INT8 with QAT) and rewrite the rasterizer in CUDA.
        </p>
        <p>
          <strong>Snow.</strong> The competition is in May so I&apos;m probably
          fine, but the parking-line detector goes to 0.4 mAP under partial
          snow cover. Future me&apos;s problem.
        </p>
        <p>
          The full stack will run at the SAE Autonomous Challenge in May 2027.
          I&apos;ll write a follow-up post once we have real-world numbers — I
          expect the 8 cm RMSE to roughly double once sensor noise, suspension
          compliance, and tire slip get involved. That would still beat the
          competition rubric (25 cm) by a comfortable margin.
        </p>
      </Section>

      <Footnotes>
        <Fn n={1}>
          Dolgov, Thrun, Montemerlo, Diebel. &quot;Path Planning for Autonomous
          Vehicles in Unknown Semi-structured Environments.&quot; IJRR 2010 —{" "}
          <a
            href="https://www.cs.cmu.edu/~motionplanning/papers/sbp_papers/integrated4/dolgov_path_planning_long.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            cs.cmu.edu/dolgov_path_planning
          </a>
          .
        </Fn>
        <Fn n={2}>
          Reeds &amp; Shepp. &quot;Optimal paths for a car that goes both
          forwards and backwards.&quot; Pacific J. Math, 1990 —{" "}
          <a
            href="https://msp.org/pjm/1990/145-2/pjm-v145-n2-p06-s.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            msp.org/pjm/1990
          </a>
          .
        </Fn>
        <Fn n={3}>
          ROS 2 Humble documentation —{" "}
          <a
            href="https://docs.ros.org/en/humble/index.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.ros.org/en/humble
          </a>
          .
        </Fn>
        <Fn n={4}>
          CARLA Simulator 0.9.15 docs —{" "}
          <a
            href="https://carla.readthedocs.io/en/0.9.15/"
            target="_blank"
            rel="noopener noreferrer"
          >
            carla.readthedocs.io
          </a>
          .
        </Fn>
        <Fn n={5}>
          Ultralytics YOLOv8 —{" "}
          <a
            href="https://docs.ultralytics.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.ultralytics.com
          </a>
          .
        </Fn>
      </Footnotes>
    </>
  );
}
