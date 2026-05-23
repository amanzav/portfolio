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
  AutoparkHybridSearch,
  AutoparkCommitPoint,
  AutoparkScenarioGrid,
} from "@/components/blog";

export function AutoparkPost() {
  return (
    <>
      <TLDR>
        <TLDRItem>
          End-to-end autonomous parking on ROS 2 for UWAFT&apos;s competition
          EV. Perception, planning, control, CAN. Eight nodes on a Jetson Orin.
        </TLDRItem>
        <TLDRItem>
          YOLOv8 plus stereo depth, fused into a 20 cm occupancy grid. Flags
          bays at 0, 15, 30, and 45° approach.
        </TLDRItem>
        <TLDRItem>
          Hybrid A* with Reeds-Shepp analytic expansion. Max-of-two heuristic
          keeps the search admissible.
        </TLDRItem>
        <TLDRItem>
          Cascaded PIDs (cross-track, heading, longitudinal) at 50 Hz. Hit{" "}
          <strong>8 cm RMSE</strong> across 50+ CARLA scenarios.
        </TLDRItem>
        <TLDRItem>
          The bug that ate three weeks wasn&apos;t planning. It was perception
          dropping out mid-maneuver. Fixed with a commit point.
        </TLDRItem>
      </TLDR>

      <Section number="01" label="motivation" title="Parking is harder than driving">
        <p>
          Highway driving is almost trivial in a planning sense: stay in the
          lane, never go backwards, useful trajectories live in a narrow
          envelope. Parking violates all of that.
        </p>
        <p>
          A car is <strong>non-holonomic</strong>. Velocity has to point along
          the heading; you can&apos;t strafe. Configuration space is 3D
          (x, y, θ) but control space is 2D (steering, throttle). Reachable
          states form a thin curved manifold in SE(2), not a ball. In a tight
          bay the goal pose lives somewhere no forward-only trajectory can
          touch. You have to weave and reverse.
        </p>
        <p>
          <strong>Clearances are tight.</strong> A standard bay is ~2.5 m
          wide. The EV is 1.85 m. The lateral margin is roughly the
          localization error.{" "}
          <strong>Oblique detection is ugly.</strong> Approach at 30° and the
          bay opening is foreshortened, the divider lines are half-occluded by
          parked cars, depth gets noisy at grazing incidence.{" "}
          <strong>Reverse is the common case.</strong> Production stacks
          (Apollo, Autoware) treat it as a corner case. For parking it&apos;s
          most of the path.{" "}
          <strong>Jerk is rubric-policed.</strong> Anything above 2 m/s³ on
          engagement loses points, so I can&apos;t just stomp the brake the
          moment a path lands.
        </p>
        <p>
          The &quot;easy for humans, brutal for planners&quot; regime.
          Everything below is an attempt to make the planner a little less
          brutalized.
        </p>
      </Section>

      <Section number="02" label="architecture" title="Eight nodes on a Jetson">
        <p>
          The stack is eight ROS 2 nodes on a Jetson Orin, talking over DDS
          with intra-process zero-copy where I could get it.
        </p>
        <FlowDiagram
          number="01"
          caption="Auto Park pipeline. Sensors merge into a fused costmap; planner runs at 2 Hz, control at 50 Hz."
          meta="10 hz / 50 hz"
          viewBox="0 0 720 600"
          nodes={[
            {
              id: "stereo",
              x: 50,
              y: 20,
              w: 220,
              h: 60,
              badge: "sensor · 60 hz",
              title: "Stereo Camera",
            },
            {
              id: "lidar",
              x: 450,
              y: 20,
              w: 220,
              h: 60,
              badge: "sensor · 16 ch",
              title: "Lidar",
            },
            {
              id: "yolo",
              x: 50,
              y: 110,
              w: 220,
              h: 70,
              badge: "01 / detect",
              title: "YOLOv8 Det",
              items: ["bay + obstacle"],
            },
            {
              id: "depth",
              x: 450,
              y: 110,
              w: 220,
              h: 70,
              badge: "02 / depth",
              title: "Depth Project",
              items: ["lidar as prior"],
            },
            {
              id: "fusion",
              x: 180,
              y: 210,
              w: 360,
              h: 80,
              badge: "03 / fusion → grid",
              title: "Sensor Fusion",
              items: ["20 cm occupancy + bay polygons"],
            },
            {
              id: "planner",
              x: 180,
              y: 320,
              w: 360,
              h: 80,
              badge: "04 / plan · 2 hz",
              title: "Hybrid A*",
              items: ["Reeds-Shepp analytic expansion"],
            },
            {
              id: "pid",
              x: 180,
              y: 430,
              w: 360,
              h: 70,
              badge: "05 / control · 50 hz",
              title: "PID Tracker",
              items: ["xtrack · heading · longitudinal"],
            },
            {
              id: "can",
              x: 180,
              y: 530,
              w: 360,
              h: 60,
              badge: "06 / actuate",
              title: "CAN — steer · throttle · brake",
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
                [160, 200],
                [280, 200],
              ],
            },
            {
              from: "depth:bottom",
              to: "fusion:top",
              waypoints: [
                [560, 200],
                [440, 200],
              ],
            },
            { from: "fusion:bottom", to: "planner:top" },
            { from: "planner:bottom", to: "pid:top" },
            { from: "pid:bottom", to: "can:top" },
          ]}
        />
        <p>
          Sensors run at their own cadence. Planner re-plans at 2 Hz unless an
          obstacle delta exceeds 0.3 m, in which case it preempts. Control is
          the only thing on a real-time scheduler.
        </p>
      </Section>

      <Section number="03" label="perception" title="Why fusion, after two failures">
        <p>I tried three approaches before fusion stuck.</p>
        <p>
          <strong>Pure lidar.</strong> Clean geometry, semantically blind. A
          bay is a flat patch of asphalt; so is a driving lane. I could see{" "}
          <em>that there is room</em>, not <em>that it is a bay</em>.
        </p>
        <p>
          <strong>Pure RGB.</strong> Monocular YOLO finds bay lines
          beautifully in good light but has no metric scale. A 30-pixel line
          could be 3 m or 12 m away. Useless for planning.
        </p>
        <p>
          <strong>Fusion.</strong> YOLOv8-s<FootnoteRef n={5} /> on a custom
          dataset (~14k frames, ~9k synthesized in CARLA with randomized
          lighting, pavement, and bay orientation). Detector outputs four bay
          corners plus obstacle boxes. Stereo depth (Semi-Global Matching with
          lidar as a sparse prior to stabilize textureless asphalt) gives
          metric z per pixel. Fusion lifts each detection into a 3D polygon
          and rasterizes everything into a 20 cm occupancy grid with three
          channels: <InlineCode>free</InlineCode>,{" "}
          <InlineCode>occupied</InlineCode>,{" "}
          <InlineCode>bay_candidate</InlineCode>.
        </p>
        <Callout label="highest-leverage call">
          The CARLA-synthesized labels saved roughly six weeks of manual
          labeling for four days of pipeline work. Sim-to-real gap was real
          (mAP dropped from 0.91 to 0.74 on a small Waterloo lot dataset I
          scraped at 2 a.m.) but ~1,500 real labels and a fine-tune closed it.
        </Callout>
        <p>
          What the planner sees: a costmap and a list of candidate goal poses,
          one per bay, with confidence and orientation.
        </p>
      </Section>

      <Section number="04" label="planner" title="Hybrid A* is the heart">
        <p>
          Grid A* fails for car-like robots because nodes don&apos;t carry
          heading. You get a <em>path</em> through cells, not a{" "}
          <em>drivable</em> one. The polyline ignores turning radius and
          demands heading changes the steering rack physically can&apos;t do.
        </p>
        <p>
          <strong>Hybrid A*</strong>
          <FootnoteRef n={1} /> lets nodes carry continuous state. Each node
          is (x, y, θ); expansions are short kinematic arcs at a fixed set of
          steering inputs (<InlineCode>{"{−δ_max, −δ_max/2, 0, +δ_max/2, +δ_max}"}</InlineCode>,
          forward and reverse). Children land off-grid; the discretization is
          only used for the closed set. Search is discrete, states are
          continuous.
        </p>
        <p>The cost at each node:</p>
        <Equation
          label="cost"
          tex={`f(n) = g(n) + h(n), \\quad h(n) = \\max\\big(h_{\\text{nh}}(n),\\; h_{\\text{ho}}(n)\\big)`}
        />
        <p>
          <InlineCode>g(n)</InlineCode> is arc length plus penalties (1.5x on
          reverse, 2.0x on direction changes — flipping gear is what hurts
          passengers most). <InlineCode>h(n)</InlineCode> is the larger of two:
        </p>
        <p>
          <InlineCode>h_nh</InlineCode>, the{" "}
          <strong>non-holonomic-without-obstacles</strong> heuristic — length
          of the shortest Reeds-Shepp<FootnoteRef n={2} /> curve to the goal,
          ignoring the costmap. Captures kinematics.{" "}
          <InlineCode>h_ho</InlineCode>, the{" "}
          <strong>holonomic-with-obstacles</strong> heuristic — length of the
          shortest grid-A* path, ignoring kinematics. Captures geometry. The
          max stays admissible and dominates either alone. Straight out of
          Dolgov et al.; I didn&apos;t invent it, just verified it works.
        </p>
        <p>
          Near the goal, expanding kinematic arcs gets wasteful — you almost
          never land on the goal pose exactly. Instead I shoot a{" "}
          <strong>Reeds-Shepp analytic expansion</strong> directly to the goal
          and accept it as the tail if it&apos;s collision-free. Typical
          searches close 1,200 to 4,000 nodes for a parallel park versus 40k+
          without.
        </p>
        <AutoparkHybridSearch
          number="02"
          caption="Hybrid A* expands kinematic arcs; one Reeds-Shepp shoot finishes the path."
          meta="~1.2k nodes vs 40k+"
        />
        <Callout label="subtle bug">
          The Reeds-Shepp shoot needs the <em>same</em> footprint inflation as
          the grid-A* heuristic. I had them different and the planner emitted
          paths the tracker couldn&apos;t execute because they grazed the
          inflation boundary. Painful.
        </Callout>
      </Section>

      <Section number="05" label="control" title="Three PIDs and a gear-flip story">
        <p>The tracker is intentionally boring. Three PIDs at 50 Hz.</p>
        <p>
          <strong>Cross-track</strong> drives lateral error{" "}
          <InlineCode>e_y</InlineCode> to zero, summed with a feedforward
          steering command from path curvature.{" "}
          <strong>Heading</strong> drives heading error{" "}
          <InlineCode>e_ψ</InlineCode> to zero; output sums into the same
          steering command. <strong>Longitudinal</strong> drives speed error
          to zero, with the setpoint from a precomputed velocity profile
          (slower at high curvature, zero at direction-change cusps).
        </p>
        <p>Cross-track error against the closest path point:</p>
        <Equation
          label="cross-track"
          tex={`e_y(t) = \\big(\\mathbf{p}_{\\text{car}}(t) - \\mathbf{p}_{\\text{path}}^{*}(t)\\big) \\cdot \\hat{\\mathbf{n}}_{\\text{path}}^{*}(t)`}
        />
        <p>
          <InlineCode>n̂</InlineCode> is the left-hand normal so sign carries
          which side of the path we&apos;re on.
        </p>
        <p>
          <strong>The tuning story.</strong> Ziegler-Nichols on a flat
          straight gave me{" "}
          <InlineCode>K_p = 0.8, K_i = 0.05, K_d = 0.12</InlineCode>. Forward
          looked great. The moment I asked it to track a reverse arc it
          oscillated. Twice I almost blamed the planner before I noticed: the
          cross-track sign convention flips in reverse (the front axle becomes
          the &quot;back&quot; of the kinematic model). ZN had tuned for a
          regime that no longer applied.
        </p>
        <p>
          Hand-tuned a second set for reverse{" "}
          (<InlineCode>K_p = 0.45, K_i = 0.02, K_d = 0.18</InlineCode> —
          softer P, more D for damping) and switch on commanded gear. ZN is
          great when your plant is stationary; for parking the plant changes
          character every shift.
        </p>
      </Section>

      <Section number="06" label="validation" title="CARLA harness, 52 scenarios">
        <p>
          Built a scenario harness on CARLA 0.9.15<FootnoteRef n={4} /> with a
          small YAML DSL.
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
          Across 52 scenarios — bay angles of 0, 15, 30, 45°, parallel and
          perpendicular, wet and dry, three pedestrian profiles — I got{" "}
          <strong>8.1 cm RMSE on final pose translation</strong> and 2.3° on
          heading. p99 planning latency 187 ms, control jitter under 2 ms.
        </p>
        <p>
          Honest caveat: the 8 cm is the mean across <em>successful</em>{" "}
          completions. Three scenarios timed out, all at 45° approach on a wet
          shoulder. Not in the average. Fixing them before competition.
        </p>
        <AutoparkScenarioGrid
          number="03"
          caption="Final-pose error across 52 CARLA scenarios; three 45°-wet timeouts excluded from the RMSE."
          meta="8.1 cm rmse · 52 scenarios"
        />
      </Section>

      <Section number="07" label="war story" title="The bug that ate three weeks">
        <p>Most useful thing I learned, and it has nothing to do with algorithms.</p>
        <p>
          Reverse-into-bay maneuvers kept failing at the end. Car would get
          80% in, planner would emit an infeasible path, tracker would freeze
          or back out. I spent a week on Hybrid A* expansion granularity, a
          week on the cost function, a week suspecting localization drift.
        </p>
        <p>
          The bug was in perception. Once the car was deep in the bay, the
          stereo cameras (A-pillar mounted, forward-biased FoV) lost sight of
          the rear and side markings. Fusion dutifully marked the bay{" "}
          <em>low confidence</em>. The planner — which I&apos;d set to re-plan
          on every confidence drop — would invalidate the in-flight path and
          search from a mostly-uninformed costmap. It usually found something
          worse.
        </p>
        <p>
          The fix was not algorithmic. I added a{" "}
          <strong>commit point</strong>: once the planner is within 1.5 m of
          the goal with heading error below 10°, the path is{" "}
          <em>frozen</em> and the tracker runs it open-loop, with lidar
          emergency-stop as the only override. An ugly finite-state-machine
          hack. Works perfectly.
        </p>
        <AutoparkCommitPoint
          number="04"
          caption="A commit point freezes the path inside the goal window; tracker runs it open-loop."
          meta="re-plan storm → frozen tail"
        />
        <Callout label="lesson">
          The bug I was chasing in the planner was a feedback loop with
          perception. When two modules contest the same search space at the
          same frequency, the bug lives in the protocol between them, not
          inside either one. I now spend more time thinking about{" "}
          <em>cadence</em> than about the algorithms it&apos;s carrying.
        </Callout>
      </Section>

      <Section number="08" label="next" title="What's next">
        <p>Three things on the roadmap.</p>
        <p>
          <strong>Real sensor noise.</strong> CARLA stereo is too clean.
          Collecting ZED 2i data in the UWAFT lot to retrain the YOLO head and
          resample the depth-prior noise.
        </p>
        <p>
          <strong>Latency budget on Orin.</strong> Fusion is 28 ms p50 on a
          desktop RTX 3070. I have 80 ms total at 10 Hz, which means TensorRT
          INT8 with QAT on the YOLO backbone and rewriting the rasterizer in
          CUDA.
        </p>
        <p>
          <strong>Snow.</strong> Competition is in May, so probably fine, but
          the parking-line detector falls to 0.4 mAP under partial cover.
          Future me&apos;s problem.
        </p>
        <p>
          Full stack runs at the SAE Autonomous Challenge in May 2027.
          I&apos;ll write a follow-up once we have real numbers — I expect 8
          cm to roughly double once sensor noise, suspension compliance, and
          tire slip get involved. Still inside the 25 cm rubric.
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
