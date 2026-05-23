"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "@/components/blog/primitives/ChartFrame";

interface CostVec {
  alpha: number;
  beta: number;
  gamma: number;
  delta: number;
  eps: number;
}

interface RouteSpec {
  label: string;
  d: string;
  iceCost: CostVec;
  evCost: CostVec;
}

interface GasRoutingAnimationProps {
  caption: string;
  number?: string;
  meta?: string;
  // kept for backward-compat with existing call sites; unused in this layout
  routes?: RouteSpec[];
  picks?: { ice: number; ev: number };
}

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 260;

// map geometry
const MAP_X = 24;
const MAP_Y = 72;
const MAP_W = 672;
const MAP_H = 140;

const ORIGIN_X = MAP_X + 36;
const ORIGIN_Y = MAP_Y + MAP_H / 2; // 142
const DEST_X = MAP_X + MAP_W - 36;
const DEST_Y = MAP_Y + MAP_H / 2;
const MID_X = (ORIGIN_X + DEST_X) / 2;

// Three routes between origin and destination.
//   A = shortest, straight middle line
//   B = uphill, bows up
//   C = downhill (regen), bows down
const ROUTES = [
  {
    key: "A",
    label: "route a · shortest",
    d: `M ${ORIGIN_X} ${ORIGIN_Y} C ${ORIGIN_X + 160} ${ORIGIN_Y - 6}, ${DEST_X - 160} ${DEST_Y + 6}, ${DEST_X} ${DEST_Y}`,
    labelY: 132, // just above the straight path at y=142
  },
  {
    key: "B",
    label: "route b · uphill",
    d: `M ${ORIGIN_X} ${ORIGIN_Y} C ${ORIGIN_X + 120} ${MAP_Y}, ${DEST_X - 120} ${MAP_Y}, ${DEST_X} ${DEST_Y}`,
    labelY: 82, // above apex (~88)
  },
  {
    key: "C",
    label: "route c · downhill · regen",
    d: `M ${ORIGIN_X} ${ORIGIN_Y} C ${ORIGIN_X + 120} ${MAP_Y + MAP_H}, ${DEST_X - 120} ${MAP_Y + MAP_H}, ${DEST_X} ${DEST_Y}`,
    labelY: 204, // below apex (~196)
  },
];

export function GasRoutingAnimation({
  caption,
  number,
  meta = "top-k re-rank on energy",
}: GasRoutingAnimationProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // simplified phases
  // 0 idle (all routes faint)
  // 1 ICE: route A highlighted (shortest)
  // 2 vehicle flip → EV
  // 3 EV: route C highlighted (regen wins)
  // 4 payoff line "time-optimal → energy-optimal"
  const [phase, setPhase] = useState(0);
  const FINAL = 4;

  useEffect(() => {
    if (reduced) {
      setPhase(FINAL);
      return;
    }
    if (!inView) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, p: number) =>
      timers.push(setTimeout(() => !cancelled && setPhase(p), ms));
    const run = () => {
      setPhase(0);
      at(400, 1); // ICE picks A
      at(2600, 2); // flip
      at(3200, 3); // EV picks C
      at(4400, 4); // payoff
      timers.push(setTimeout(() => !cancelled && run(), 7800));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced]);

  const vehicle: "ice" | "ev" = phase >= 2 ? "ev" : "ice";
  // picked route index: -1 / 0 (A) / 2 (C)
  const pick = phase >= 3 ? 2 : phase >= 1 ? 0 : -1;
  const showPayoff = phase >= 4;

  // pick chip sits near right side of picked route
  const PICK_X = MID_X + 110; // 470
  const pickYs = [ORIGIN_Y, 110, 174]; // approx y on each route at PICK_X
  const pickY = pick >= 0 ? pickYs[pick] : ORIGIN_Y;

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
            Three candidate routes connect origin and destination. The F-150
            picks the shortest. When the vehicle line flips to the Mach-E, the
            regen credit on the downhill route makes it the cheapest by energy
            and the pick slides from the time-optimal route to the
            energy-optimal one.
          </desc>

          <defs>
            <pattern
              id="gas-scan"
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

          {/* ===== vehicle toggle (top-right) ===== */}
          <g>
            <text
              x={VB_W - 24}
              y={28}
              textAnchor="end"
              fontSize="9"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
            >
              vehicle
            </text>
            <motion.text
              key={vehicle}
              x={VB_W - 24}
              y={48}
              textAnchor="end"
              fontSize="13"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
              initial={reduced ? false : { opacity: 0, y: 44 }}
              animate={{ opacity: 1, y: 48 }}
              transition={{ duration: reduced ? 0 : 0.4, ease }}
            >
              {vehicle === "ice" ? "f-150 (ice)" : "mach-e (ev)"}
            </motion.text>
          </g>

          {/* ===== top-left section caption ===== */}
          <text
            x={MAP_X}
            y={60}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            top-k candidates · energy re-rank
          </text>

          {/* ===== map frame ===== */}
          <rect
            x={MAP_X}
            y={MAP_Y}
            width={MAP_W}
            height={MAP_H}
            fill="url(#gas-scan)"
          />
          <rect
            x={MAP_X}
            y={MAP_Y}
            width={MAP_W}
            height={MAP_H}
            fill="none"
            stroke="rgb(var(--border))"
            strokeWidth={0.8}
            strokeDasharray="3 4"
          />

          {/* ===== origin / destination ===== */}
          <g>
            <circle
              cx={ORIGIN_X}
              cy={ORIGIN_Y}
              r={5}
              fill="rgb(var(--foreground))"
              opacity={0.85}
            />
            <text
              x={ORIGIN_X}
              y={ORIGIN_Y + 18}
              textAnchor="middle"
              fontSize="7.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              origin
            </text>
            <circle
              cx={DEST_X}
              cy={DEST_Y}
              r={5}
              fill="none"
              stroke="rgb(var(--foreground))"
              strokeWidth={1.3}
            />
            <text
              x={DEST_X}
              y={DEST_Y + 18}
              textAnchor="middle"
              fontSize="7.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              dest
            </text>
          </g>

          {/* ===== routes ===== */}
          {ROUTES.map((r, i) => {
            const picked = pick === i;
            const dim = pick >= 0 && !picked;
            return (
              <g key={r.key}>
                <motion.path
                  d={r.d}
                  fill="none"
                  stroke="rgb(var(--foreground))"
                  strokeWidth={picked ? 2 : 1.2}
                  strokeLinecap="round"
                  initial={false}
                  animate={{
                    strokeOpacity: picked ? 0.95 : dim ? 0.22 : 0.55,
                  }}
                  transition={{ duration: reduced ? 0 : 0.5, ease }}
                />
                <text
                  x={MID_X}
                  y={r.labelY}
                  textAnchor="middle"
                  fontSize="8"
                  fill={
                    picked
                      ? "rgb(var(--foreground))"
                      : "rgb(var(--muted))"
                  }
                  fontFamily="var(--font-mono)"
                  style={{
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  {r.label}
                </text>
              </g>
            );
          })}

          {/* ===== pick chip (sits near right end of picked route) ===== */}
          <motion.g
            initial={false}
            animate={{
              x: PICK_X - 30,
              y: pickY - 22,
              opacity: pick >= 0 ? 1 : 0,
            }}
            transition={{ duration: reduced ? 0 : 0.6, ease }}
          >
            <rect
              x={0}
              y={0}
              width={60}
              height={16}
              fill="rgb(var(--background))"
              stroke="rgb(var(--foreground))"
              strokeWidth={1}
            />
            <text
              x={30}
              y={11}
              textAnchor="middle"
              fontSize="8"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              &gt; pick
            </text>
          </motion.g>

          {/* ===== payoff line ===== */}
          <motion.text
            x={VB_W / 2}
            y={240}
            textAnchor="middle"
            fontSize="9"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
            initial={false}
            animate={{ opacity: showPayoff ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          >
            time-optimal → energy-optimal
          </motion.text>
        </svg>
      </div>
    </ChartFrame>
  );
}
