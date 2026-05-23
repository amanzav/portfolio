"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "@/components/blog/primitives/ChartFrame";

interface AutoparkHybridSearchProps {
  caption: string;
  number?: string;
  meta?: string;
  nodeCountWith?: number;
  nodeCountWithout?: string;
}

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 340;

// deterministic PRNG kept around in case we want jitter later; not used now.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Branch {
  d: string;
  depth: number;
  endX: number;
  endY: number;
  endTheta: number;
}

// Generate a deterministic branching tree of short circular arcs from the
// start pose. Three depths, branching factor 3 at each (~27 leaves). Each
// child arc fans the heading by ±15° over a fixed length. We clip the deepest
// leaves at x ≤ 380 — the search "stops short" before the goal, which is the
// whole point of the analytic tail.
function buildSearchTree(): Branch[] {
  const branches: Branch[] = [];
  const arcLen = 38; // svg units per arc
  const steerAngles = [-15, 0, 15]; // degrees
  type Node = { x: number; y: number; theta: number; depth: number };

  const root: Node = { x: 60, y: 220, theta: 0, depth: 0 };
  const stack: Node[] = [root];

  while (stack.length) {
    const node = stack.pop()!;
    if (node.depth >= 3) continue;
    for (const da of steerAngles) {
      const rad = (Math.PI / 180) * da;
      // Build the arc as a circular sweep. If steering is 0, it's a line.
      const startTheta = (node.theta * Math.PI) / 180;
      let endX: number;
      let endY: number;
      let endTheta: number;
      let d: string;
      if (da === 0) {
        endX = node.x + arcLen * Math.cos(startTheta);
        endY = node.y + arcLen * Math.sin(startTheta);
        endTheta = node.theta;
        d = `M ${node.x} ${node.y} L ${endX} ${endY}`;
      } else {
        // arc with radius derived from arcLen and angle
        const r = arcLen / Math.abs(rad);
        const endThetaRad = startTheta + rad;
        // center is perpendicular to heading, on the side of curvature
        const sign = da > 0 ? 1 : -1;
        const cx = node.x - sign * r * Math.sin(startTheta);
        const cy = node.y + sign * r * Math.cos(startTheta);
        endX = cx + sign * r * Math.sin(endThetaRad);
        endY = cy - sign * r * Math.cos(endThetaRad);
        endTheta = (endThetaRad * 180) / Math.PI;
        const sweepFlag = da > 0 ? 1 : 0;
        d = `M ${node.x} ${node.y} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 ${sweepFlag} ${endX.toFixed(2)} ${endY.toFixed(2)}`;
      }

      // Clip deepest leaves at x ≤ 380 — search "stops short" of goal.
      if (node.depth === 2 && endX > 380) continue;

      branches.push({
        d,
        depth: node.depth,
        endX,
        endY,
        endTheta,
      });
      stack.push({ x: endX, y: endY, theta: endTheta, depth: node.depth + 1 });
    }
  }
  return branches;
}

// silence unused-import warning while keeping the helper available
void mulberry32;

export function AutoparkHybridSearch({
  caption,
  number,
  meta = "~1.2k nodes vs 40k+",
  nodeCountWith = 1200,
  nodeCountWithout = "40k+",
}: AutoparkHybridSearchProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // phase 0 scene · 1 tree expands · 2 tree stops short · 3 reeds-shepp draws · 4 settle
  const [phase, setPhase] = useState(0);
  const [counter, setCounter] = useState(0);

  const branches = useMemo(() => buildSearchTree(), []);

  // looping phase machine
  useEffect(() => {
    if (reduced) {
      setPhase(4);
      setCounter(nodeCountWith);
      return;
    }
    if (!inView) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, p: number) =>
      timers.push(setTimeout(() => !cancelled && setPhase(p), ms));
    const run = () => {
      setPhase(0);
      setCounter(0);
      at(300, 1);
      at(2400, 2);
      at(3400, 3);
      at(5200, 4);
      timers.push(setTimeout(() => !cancelled && run(), 7800));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced, nodeCountWith]);

  // node counter — ramps during phase 1, holds, then settles in phase 4
  useEffect(() => {
    if (reduced) return;
    if (phase < 1) {
      setCounter(0);
      return;
    }
    if (phase === 1 || phase === 2 || phase === 3) {
      const start = performance.now();
      const dur = phase === 1 ? 1900 : 400;
      const from = counter;
      const to = phase === 1 ? Math.round(nodeCountWith * 0.95) : nodeCountWith;
      let raf = 0;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        setCounter(Math.round(from + (to - from) * eased));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
    if (phase === 4) {
      setCounter(nodeCountWith);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reduced, nodeCountWith]);

  const show = (p: number) => phase >= p;

  // Reeds-Shepp curve — a cubic bezier from end-of-tree to the goal, with a
  // visible cusp around (470, 180). Two control points pull it through the cusp
  // and let it sweep up to the goal heading.
  const rsPath =
    "M 380 200 C 430 215 470 195 470 180 C 470 165 500 130 540 115";
  const cuspX = 470;
  const cuspY = 180;
  const rsPathLength = 220; // approximate; pathLength prop lets us animate via strokeDasharray

  return (
    <ChartFrame caption={caption} number={number} meta={meta}>
      <div ref={ref}>
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="chart-svg w-full"
          role="img"
          aria-label={caption}
        >
          <desc>
            Hybrid A* expands short kinematic arcs from the start pose, building
            a branching search tree of about {nodeCountWith} nodes. Near the
            goal, a single Reeds-Shepp analytic curve shoots from the deepest
            branch directly to the goal pose — replacing the {nodeCountWithout}{" "}
            additional nodes a pure kinematic search would have needed.
          </desc>
          <defs>
            <pattern
              id="ahs-scanlines"
              width="2"
              height="3"
              patternUnits="userSpaceOnUse"
            >
              <rect width="2" height="3" fill="transparent" />
              <rect
                width="2"
                height="1"
                fill="rgb(var(--foreground))"
                opacity="0.03"
              />
            </pattern>
          </defs>

          {/* ===== Header strip ===== */}
          <text
            x={24}
            y={22}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            04 · hybrid a*
          </text>
          <text
            x={VB_W - 24}
            y={22}
            textAnchor="end"
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            kinematic arcs + 1 shoot
          </text>

          {/* ===== Scene background ===== */}
          <rect
            x={24}
            y={56}
            width={VB_W - 48}
            height={200}
            fill="url(#ahs-scanlines)"
          />
          <rect
            x={24}
            y={56}
            width={VB_W - 48}
            height={200}
            fill="rgb(var(--foreground) / 0.015)"
            stroke="rgb(var(--border))"
            strokeWidth={0.8}
          />

          {/* ===== Parked car rectangles ===== */}
          <g>
            <rect
              x={420}
              y={80}
              width={80}
              height={70}
              fill="rgb(var(--foreground) / 0.08)"
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
            />
            <text
              x={460}
              y={165}
              textAnchor="middle"
              fontSize="7"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              parked
            </text>
            <rect
              x={580}
              y={80}
              width={80}
              height={70}
              fill="rgb(var(--foreground) / 0.08)"
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
            />
            <text
              x={620}
              y={165}
              textAnchor="middle"
              fontSize="7"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              parked
            </text>
          </g>

          {/* ===== Target bay (dashed outline) ===== */}
          <rect
            x={500}
            y={80}
            width={80}
            height={70}
            fill="rgb(var(--foreground) / 0.02)"
            stroke="rgb(var(--foreground) / 0.5)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          {/* Goal pose chevron at (540, 115) pointing up */}
          <polyline
            points="532,121 540,109 548,121"
            fill="none"
            stroke="rgb(var(--foreground))"
            strokeWidth={1.4}
          />
          <circle
            cx={540}
            cy={115}
            r={1.8}
            fill="rgb(var(--foreground))"
          />
          <text
            x={540}
            y={70}
            textAnchor="middle"
            fontSize="7.5"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            goal
          </text>

          {/* ===== Start pose chevron at (60, 220) pointing right ===== */}
          <polyline
            points="54,213 66,220 54,227"
            fill="none"
            stroke="rgb(var(--foreground))"
            strokeWidth={1.4}
          />
          <circle
            cx={60}
            cy={220}
            r={1.8}
            fill="rgb(var(--foreground))"
          />
          <text
            x={60}
            y={240}
            textAnchor="middle"
            fontSize="7.5"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            start
          </text>

          {/* ===== Search tree branches — staggered by depth ===== */}
          {branches.map((b, i) => {
            const depthDelay = b.depth * 0.55;
            const indexInDepth = i * 0.025;
            const treeOpacity = show(4) ? 0.3 : show(1) ? 0.85 : 0;
            return (
              <motion.path
                key={`branch-${i}`}
                d={b.d}
                fill="none"
                stroke="rgb(var(--foreground))"
                strokeWidth={0.9}
                strokeLinecap="round"
                initial={false}
                animate={{
                  opacity: treeOpacity,
                  pathLength: show(1) ? 1 : 0,
                }}
                transition={{
                  duration: reduced ? 0 : 0.6,
                  ease,
                  delay: reduced ? 0 : show(1) ? depthDelay + indexInDepth : 0,
                }}
              />
            );
          })}

          {/* "would need 40k+" gap label — phase 2 only */}
          <motion.text
            x={420}
            y={235}
            textAnchor="middle"
            fontSize="7.5"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            initial={false}
            animate={{ opacity: phase === 2 ? 0.85 : 0 }}
            transition={{ duration: 0.4, ease }}
          >
            would need {nodeCountWithout}
          </motion.text>

          {/* ===== Reeds-Shepp shoot ===== */}
          <motion.path
            d={rsPath}
            fill="none"
            stroke="rgb(var(--foreground))"
            strokeWidth={show(4) ? 2.2 : 1.8}
            strokeLinecap="round"
            pathLength={rsPathLength}
            initial={false}
            animate={{
              opacity: show(3) ? 1 : 0,
              strokeDashoffset: show(3) ? 0 : rsPathLength,
            }}
            style={{
              strokeDasharray: rsPathLength,
            }}
            transition={{ duration: reduced ? 0 : 1.2, ease }}
          />
          {/* cusp marker — small diamond */}
          <motion.g
            initial={false}
            animate={{ opacity: show(3) ? 1 : 0 }}
            transition={{ duration: 0.4, ease, delay: show(3) ? 0.6 : 0 }}
          >
            <polygon
              points={`${cuspX},${cuspY - 4} ${cuspX + 4},${cuspY} ${cuspX},${cuspY + 4} ${cuspX - 4},${cuspY}`}
              fill="rgb(var(--background))"
              stroke="rgb(var(--foreground))"
              strokeWidth={1}
            />
          </motion.g>

          {/* reeds-shepp label — phase 3+ */}
          <motion.text
            x={450}
            y={195}
            fontSize="8"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            initial={false}
            animate={{ opacity: phase === 3 ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          >
            reeds-shepp shoot
          </motion.text>

          {/* ===== Node-count chip (below scene, left) ===== */}
          <g>
            <text
              x={24}
              y={282}
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              {phase >= 4 ? "with shoot" : phase >= 1 ? "expanding" : "idle"}
            </text>
            <text
              x={24}
              y={302}
              fontSize="13"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
            >
              {phase >= 4
                ? `${(nodeCountWith / 1000).toFixed(1)}k nodes · 1 shoot`
                : `${counter} nodes`}
            </text>
          </g>

          {/* ===== Footer ===== */}
          <text
            x={VB_W - 24}
            y={302}
            textAnchor="end"
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            kinematic search + analytic tail
          </text>
        </svg>
      </div>
    </ChartFrame>
  );
}
