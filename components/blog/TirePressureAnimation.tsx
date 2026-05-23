"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "./ChartFrame";

interface TirePressureAnimationProps {
  caption: string;
  number?: string;
  meta?: string;
  baselineMs?: number;
  optimisedMs?: number;
  fmvssCeilingMs?: number;
}

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 360;

// pipeline node geometry
const NODE_W = 104;
const NODE_H = 60;
const NODE_Y = 200;
const NODE_GAP = 18;
const PIPE_X0 = 96;

const nodeX = (i: number) => PIPE_X0 + i * (NODE_W + NODE_GAP);
const nodeCenterX = (i: number) => nodeX(i) + NODE_W / 2;
const nodeCenterY = NODE_Y + NODE_H / 2;

// latency bar geometry
const BAR_X = 96;
const BAR_W = 444;
const BAR_Y = 96;
const BAR_H = 14;

// stage cumulative latency (ms) at the exit of each node, both modes
const BASELINE_STAGE_MS = [50, 450, 650, 1400];
const OPTIMISED_STAGE_MS = [25, 60, 90, 612];

// chips shown above each node in baseline mode
const BASELINE_CHIPS: Record<number, string[]> = {
  1: ["+heap memcpy", "+200 ms preempt"],
  2: ["+200 ms poll jitter"],
};

// single chip shown in optimised mode (spans across ISR + transport)
const OPTIMISED_CHIP = "lock-free ring buffer · event wake";

export function TirePressureAnimation({
  caption,
  number,
  meta = "1400 ms → 612 ms · −56%",
  baselineMs = 1400,
  optimisedMs = 612,
  fmvssCeilingMs = 2000,
}: TirePressureAnimationProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // phases
  // 0  idle
  // 1  sensor pulses · dot born
  // 2  dot enters RF receiver  (stage 0)
  // 3  dot enters ISR          (stage 1)
  // 4  dot leaves ISR
  // 5  dot enters transport    (stage 2)
  // 6  dot enters cluster      (stage 3)
  // 7  dot hits lamp · baseline locked
  // 8  flip to optimised · chips fade, sub-labels morph, bar empties
  // 9  optimised dot enters RF
  // 10 optimised dot enters ISR
  // 11 optimised dot enters transport
  // 12 optimised dot enters cluster
  // 13 optimised dot hits lamp · final state
  const [phase, setPhase] = useState(0);
  const FINAL = 13;
  const mode: "baseline" | "optimised" = phase >= 8 ? "optimised" : "baseline";

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
      at(300, 1);
      at(600, 2);
      at(1000, 3);
      at(1600, 4);
      at(2000, 5);
      at(2600, 6);
      at(3400, 7);
      at(4200, 8);
      at(4600, 9);
      at(4900, 10);
      at(5300, 11);
      at(5800, 12);
      at(6400, 13);
      timers.push(setTimeout(() => !cancelled && run(), 8800));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced]);

  // figure out dot position
  // baseline dot stages: phase 2..7  (sensor → node0 → node1 → node1exit → node2 → node3 → lamp)
  // optimised dot stages: phase 9..13
  const SENSOR_X = 44;
  const SENSOR_Y = nodeCenterY;
  const LAMP_X = 656;
  const LAMP_Y = nodeCenterY;

  function dotTarget(): { cx: number; cy: number; opacity: number } {
    if (reduced) {
      // park final dot at the lamp for the optimised pass
      return { cx: LAMP_X - 18, cy: LAMP_Y, opacity: 0.9 };
    }
    // baseline travel
    if (phase >= 1 && phase < 8) {
      if (phase === 1) return { cx: SENSOR_X + 16, cy: SENSOR_Y, opacity: 0.9 };
      if (phase === 2) return { cx: nodeCenterX(0), cy: nodeCenterY, opacity: 0.9 };
      if (phase === 3) return { cx: nodeCenterX(1), cy: nodeCenterY, opacity: 0.9 };
      if (phase === 4) return { cx: nodeX(1) + NODE_W + 4, cy: nodeCenterY, opacity: 0.9 };
      if (phase === 5) return { cx: nodeCenterX(2), cy: nodeCenterY, opacity: 0.9 };
      if (phase === 6) return { cx: nodeCenterX(3), cy: nodeCenterY, opacity: 0.9 };
      if (phase === 7) return { cx: LAMP_X - 18, cy: LAMP_Y, opacity: 0.9 };
    }
    // optimised travel
    if (phase >= 9 && phase <= 13) {
      if (phase === 9) return { cx: nodeCenterX(0), cy: nodeCenterY, opacity: 0.9 };
      if (phase === 10) return { cx: nodeCenterX(1), cy: nodeCenterY, opacity: 0.9 };
      if (phase === 11) return { cx: nodeCenterX(2), cy: nodeCenterY, opacity: 0.9 };
      if (phase === 12) return { cx: nodeCenterX(3), cy: nodeCenterY, opacity: 0.9 };
      if (phase === 13) return { cx: LAMP_X - 18, cy: LAMP_Y, opacity: 0.9 };
    }
    return { cx: SENSOR_X, cy: SENSOR_Y, opacity: 0 };
  }
  const dot = dotTarget();

  // latency bar width (px) and counter value
  function barState(): { ms: number; width: number; locked: boolean } {
    if (reduced) {
      return {
        ms: optimisedMs,
        width: (optimisedMs / fmvssCeilingMs) * BAR_W,
        locked: true,
      };
    }
    if (phase < 2) return { ms: 0, width: 0, locked: false };
    // baseline accumulation
    if (phase >= 2 && phase < 7) {
      const stage = Math.min(3, phase - 2); // dot in node `stage`
      const ms = BASELINE_STAGE_MS[stage];
      return { ms, width: (ms / fmvssCeilingMs) * BAR_W, locked: false };
    }
    if (phase === 7) {
      return {
        ms: baselineMs,
        width: (baselineMs / fmvssCeilingMs) * BAR_W,
        locked: true,
      };
    }
    // mode flip
    if (phase === 8) return { ms: 0, width: 0, locked: false };
    // optimised accumulation (phases 9..12)
    if (phase >= 9 && phase < 13) {
      const stage = Math.min(3, phase - 9);
      const ms = OPTIMISED_STAGE_MS[stage];
      return { ms, width: (ms / fmvssCeilingMs) * BAR_W, locked: false };
    }
    // phase 13 optimised locked
    return {
      ms: optimisedMs,
      width: (optimisedMs / fmvssCeilingMs) * BAR_W,
      locked: true,
    };
  }
  const bar = barState();

  // node sub-labels morph between modes
  const isrSub = mode === "baseline" ? "low prio · memcpy" : "high prio · ring buf";
  const transportSub = mode === "baseline" ? "polling 5 Hz" : "event wake";

  // FMVSS ceiling tick position
  const ceilingX = BAR_X + Math.min(BAR_W, (fmvssCeilingMs / fmvssCeilingMs) * BAR_W);

  // counter text
  const counterText = bar.locked
    ? mode === "baseline"
      ? `${baselineMs} ms · baseline`
      : `${optimisedMs} ms · optimised · −${Math.round(
          ((baselineMs - optimisedMs) / baselineMs) * 100
        )}%`
    : `${bar.ms} ms`;

  // baseline ghost bar position (drawn under the live bar during optimised pass)
  const ghostWidth = (baselineMs / fmvssCeilingMs) * BAR_W;
  const showGhost = mode === "optimised";

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
            A TPMS sensor frame travels from the wheel through the RF receiver,
            ISR, transport, and cluster firmware before lighting the dashboard
            lamp. On the baseline path low-priority preemption, an ISR-side
            heap memcpy, and a 5 Hz polling loop pile on about 1400 ms. After
            bumping the IRQ priority, swapping the memcpy for a lock-free ring
            buffer, and replacing the polling loop with an event wake, the
            same path settles at about 612 ms with the regulator-driven 800 ms
            debounce untouched.
          </desc>

          <defs>
            <pattern
              id="tpms-scan"
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

          {/* ===== mode toggle (top-right) ===== */}
          <g>
            <text
              x={VB_W - 24}
              y={32}
              textAnchor="end"
              fontSize="9"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
            >
              mode
            </text>
            <motion.text
              x={VB_W - 24}
              y={50}
              textAnchor="end"
              fontSize="13"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.16em", textTransform: "uppercase" }}
              initial={false}
              animate={{ opacity: 1 }}
            >
              {mode === "baseline" ? "baseline" : "optimised"}
            </motion.text>
            <motion.line
              x1={VB_W - 124}
              x2={VB_W - 24}
              y1={56}
              y2={56}
              stroke="rgb(var(--foreground))"
              strokeWidth={0.9}
              strokeDasharray="3 3"
              initial={false}
              animate={{ opacity: 0.7 }}
              transition={{ duration: 0.4, ease }}
            />
          </g>

          {/* ===== latency bar ===== */}
          <text
            x={BAR_X}
            y={BAR_Y - 10}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            latency budget
          </text>

          {/* outline */}
          <rect
            x={BAR_X}
            y={BAR_Y}
            width={BAR_W}
            height={BAR_H}
            fill="none"
            stroke="rgb(var(--border))"
            strokeWidth={0.8}
            strokeDasharray="3 4"
          />
          {/* scanline backing */}
          <rect
            x={BAR_X}
            y={BAR_Y}
            width={BAR_W}
            height={BAR_H}
            fill="url(#tpms-scan)"
          />

          {/* baseline ghost (only visible during optimised pass) */}
          <motion.rect
            x={BAR_X}
            y={BAR_Y}
            height={BAR_H}
            fill="none"
            stroke="rgb(var(--foreground) / 0.4)"
            strokeWidth={0.8}
            strokeDasharray="2 3"
            initial={false}
            animate={{
              opacity: showGhost ? 0.6 : 0,
              width: ghostWidth,
            }}
            transition={{ duration: 0.4, ease }}
          />

          {/* live fill */}
          <motion.rect
            x={BAR_X}
            y={BAR_Y}
            height={BAR_H}
            fill={
              mode === "optimised"
                ? "rgb(var(--foreground) / 0.85)"
                : "rgb(var(--foreground) / 0.5)"
            }
            initial={false}
            animate={{ width: Math.max(0, bar.width) }}
            transition={{
              duration: reduced ? 0 : mode === "optimised" ? 0.25 : 0.5,
              ease,
            }}
          />

          {/* FMVSS ceiling tick */}
          <line
            x1={ceilingX}
            x2={ceilingX}
            y1={BAR_Y - 4}
            y2={BAR_Y + BAR_H + 4}
            stroke="rgb(var(--foreground))"
            strokeDasharray="2 3"
            strokeWidth={0.9}
            opacity={0.7}
          />
          <text
            x={ceilingX - 4}
            y={BAR_Y - 4}
            textAnchor="end"
            fontSize="7.5"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            fmvss 138 budget
          </text>

          {/* counter */}
          <text
            x={BAR_X + BAR_W + 18}
            y={BAR_Y + 14}
            fontSize="24"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
          >
            {bar.locked ? `${bar.ms}` : `${bar.ms}`}
          </text>
          <text
            x={BAR_X + BAR_W + 18}
            y={BAR_Y + 30}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            {bar.locked ? counterText.split(" ").slice(1).join(" ") : "ms · accumulating"}
          </text>

          {/* ===== wheel sensor ===== */}
          <g>
            <motion.g
              initial={false}
              animate={
                reduced
                  ? { opacity: 0 }
                  : phase === 1
                  ? { opacity: [0, 0.8, 0], scale: [0.7, 1.5, 1.9] }
                  : { opacity: 0, scale: 1 }
              }
              transition={{ duration: 0.8, ease }}
              style={{ transformOrigin: `${SENSOR_X}px ${SENSOR_Y - 18}px` }}
            >
              <path
                d={`M ${SENSOR_X - 10} ${SENSOR_Y - 22} A 10 10 0 0 1 ${SENSOR_X + 10} ${SENSOR_Y - 22}`}
                fill="none"
                stroke="rgb(var(--foreground))"
                strokeWidth={0.9}
              />
              <path
                d={`M ${SENSOR_X - 14} ${SENSOR_Y - 28} A 14 14 0 0 1 ${SENSOR_X + 14} ${SENSOR_Y - 28}`}
                fill="none"
                stroke="rgb(var(--foreground))"
                strokeWidth={0.7}
                opacity={0.7}
              />
            </motion.g>
            <circle
              cx={SENSOR_X}
              cy={SENSOR_Y}
              r={9}
              fill="rgb(var(--foreground) / 0.06)"
              stroke="rgb(var(--foreground))"
              strokeWidth={1}
            />
            <circle
              cx={SENSOR_X}
              cy={SENSOR_Y}
              r={3.5}
              fill="rgb(var(--foreground))"
              opacity={0.7}
            />
            <text
              x={SENSOR_X}
              y={SENSOR_Y + 26}
              textAnchor="middle"
              fontSize="7.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              sensor
            </text>
          </g>

          {/* connector sensor → first node */}
          <line
            x1={SENSOR_X + 9}
            x2={nodeX(0) - 2}
            y1={SENSOR_Y}
            y2={nodeCenterY}
            stroke="rgb(var(--border))"
            strokeWidth={0.8}
          />

          {/* ===== pipeline nodes ===== */}
          {(["rf receiver", "isr", "transport", "cluster"] as const).map(
            (label, i) => {
              const x = nodeX(i);
              const isActive =
                (phase >= 2 + i && phase < 7) ||
                (phase >= 9 + i && phase < 13);
              const subLabel =
                i === 0
                  ? "rf 315 mhz"
                  : i === 1
                  ? isrSub
                  : i === 2
                  ? transportSub
                  : "debounce 800 ms";
              // gentle tremor on ISR during baseline preempt (phase 3..4)
              const tremor =
                !reduced && i === 1 && (phase === 3 || phase === 4)
                  ? { x: [0, -1.2, 1.2, -0.8, 0] }
                  : { x: 0 };
              return (
                <motion.g
                  key={label}
                  initial={false}
                  animate={tremor}
                  transition={{ duration: 0.5, ease }}
                >
                  <rect
                    x={x}
                    y={NODE_Y}
                    width={NODE_W}
                    height={NODE_H}
                    fill="url(#tpms-scan)"
                  />
                  <rect
                    x={x}
                    y={NODE_Y}
                    width={NODE_W}
                    height={NODE_H}
                    fill={
                      isActive
                        ? "rgb(var(--foreground) / 0.06)"
                        : "rgb(var(--foreground) / 0.025)"
                    }
                    stroke={
                      isActive
                        ? "rgb(var(--foreground))"
                        : "rgb(var(--border))"
                    }
                    strokeWidth={isActive ? 1.2 : 0.9}
                  />
                  <text
                    x={x + 10}
                    y={NODE_Y + 14}
                    fontSize="7.5"
                    fill="rgb(var(--muted))"
                    fontFamily="var(--font-mono)"
                    style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
                  >
                    {`0${i + 1}`}
                  </text>
                  <text
                    x={x + NODE_W / 2}
                    y={NODE_Y + 32}
                    textAnchor="middle"
                    fontSize="11"
                    fill="rgb(var(--foreground))"
                    fontFamily="var(--font-mono)"
                    style={{ letterSpacing: "0.06em" }}
                  >
                    {label}
                  </text>
                  <text
                    x={x + NODE_W / 2}
                    y={NODE_Y + 47}
                    textAnchor="middle"
                    fontSize="7.5"
                    fill="rgb(var(--muted))"
                    fontFamily="var(--font-mono)"
                    style={{ letterSpacing: "0.1em" }}
                  >
                    {subLabel}
                  </text>
                </motion.g>
              );
            }
          )}

          {/* connectors between nodes */}
          {[0, 1, 2].map((i) => (
            <line
              key={`conn-${i}`}
              x1={nodeX(i) + NODE_W}
              x2={nodeX(i + 1)}
              y1={nodeCenterY}
              y2={nodeCenterY}
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
            />
          ))}

          {/* connector cluster → lamp */}
          <line
            x1={nodeX(3) + NODE_W}
            x2={LAMP_X - 18}
            y1={nodeCenterY}
            y2={LAMP_Y}
            stroke="rgb(var(--border))"
            strokeWidth={0.9}
          />

          {/* ===== bottleneck chips (baseline) ===== */}
          {Object.entries(BASELINE_CHIPS).map(([nodeIdxStr, chips]) => {
            const nodeIdx = Number(nodeIdxStr);
            const cx = nodeCenterX(nodeIdx);
            return chips.map((chipText, ci) => {
              const visible = mode === "baseline" && phase >= 3 + nodeIdx;
              const chipY = NODE_Y - 22 - ci * 18;
              return (
                <motion.g
                  key={`base-chip-${nodeIdx}-${ci}`}
                  initial={false}
                  animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -4 }}
                  transition={{ duration: 0.35, ease }}
                >
                  <rect
                    x={cx - 56}
                    y={chipY - 9}
                    width={112}
                    height={14}
                    fill="rgb(var(--foreground) / 0.06)"
                    stroke="rgb(var(--foreground) / 0.45)"
                    strokeWidth={0.8}
                  />
                  <text
                    x={cx}
                    y={chipY + 1}
                    textAnchor="middle"
                    fontSize="7.5"
                    fill="rgb(var(--foreground))"
                    fontFamily="var(--font-mono)"
                    style={{ letterSpacing: "0.08em" }}
                  >
                    {chipText}
                  </text>
                </motion.g>
              );
            });
          })}

          {/* ===== optimised chip (single, spans ISR + transport) ===== */}
          <motion.g
            initial={false}
            animate={{
              opacity: mode === "optimised" && phase >= 9 ? 1 : 0,
              y: mode === "optimised" && phase >= 9 ? 0 : -4,
            }}
            transition={{ duration: 0.4, ease }}
          >
            {(() => {
              const midX = (nodeCenterX(1) + nodeCenterX(2)) / 2;
              const chipY = NODE_Y - 22;
              const chipW = 220;
              return (
                <>
                  <rect
                    x={midX - chipW / 2}
                    y={chipY - 9}
                    width={chipW}
                    height={14}
                    fill="rgb(var(--foreground) / 0.08)"
                    stroke="rgb(var(--foreground))"
                    strokeWidth={0.9}
                  />
                  <text
                    x={midX}
                    y={chipY + 1}
                    textAnchor="middle"
                    fontSize="8"
                    fill="rgb(var(--foreground))"
                    fontFamily="var(--font-mono)"
                    style={{ letterSpacing: "0.08em" }}
                  >
                    {OPTIMISED_CHIP}
                  </text>
                </>
              );
            })()}
          </motion.g>

          {/* ===== regulator chip on cluster (always present, muted) ===== */}
          <g>
            <rect
              x={nodeCenterX(3) - 56}
              y={NODE_Y + NODE_H + 8}
              width={112}
              height={14}
              fill="none"
              stroke="rgb(var(--border))"
              strokeWidth={0.7}
              strokeDasharray="2 3"
            />
            <text
              x={nodeCenterX(3)}
              y={NODE_Y + NODE_H + 18}
              textAnchor="middle"
              fontSize="7.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.1em" }}
            >
              regulator · 800 ms
            </text>
          </g>

          {/* ===== dashboard lamp ===== */}
          <g>
            {/* cluster outline */}
            <rect
              x={LAMP_X - 18}
              y={LAMP_Y - 22}
              width={42}
              height={44}
              fill="rgb(var(--foreground) / 0.02)"
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
            />
            {/* lamp glyph (tire + ! mark) */}
            <motion.g
              initial={false}
              animate={{
                opacity:
                  phase === 7 || phase === 13 || reduced ? 1 : 0.25,
              }}
              transition={{ duration: 0.3, ease }}
            >
              <path
                d={`M ${LAMP_X - 4} ${LAMP_Y - 6} Q ${LAMP_X + 3} ${LAMP_Y - 14} ${LAMP_X + 10} ${LAMP_Y - 6} L ${LAMP_X + 12} ${LAMP_Y + 6} Q ${LAMP_X + 3} ${LAMP_Y + 10} ${LAMP_X - 6} ${LAMP_Y + 6} Z`}
                fill="rgb(var(--foreground))"
                opacity={0.85}
              />
              <text
                x={LAMP_X + 3}
                y={LAMP_Y + 3}
                textAnchor="middle"
                fontSize="9"
                fill="rgb(var(--background))"
                fontFamily="var(--font-mono)"
                style={{ fontWeight: 700 }}
              >
                !
              </text>
            </motion.g>
            <text
              x={LAMP_X + 3}
              y={LAMP_Y + 36}
              textAnchor="middle"
              fontSize="7.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              lamp
            </text>
          </g>

          {/* ===== travelling frame dot ===== */}
          <motion.circle
            r={3}
            fill="rgb(var(--foreground))"
            initial={false}
            animate={{ cx: dot.cx, cy: dot.cy, opacity: dot.opacity }}
            transition={{
              duration: reduced ? 0 : mode === "optimised" ? 0.3 : 0.5,
              ease,
            }}
          />

          {/* ===== payoff line (only on final locked optimised state) ===== */}
          <motion.text
            x={BAR_X + BAR_W + 18}
            y={BAR_Y + 48}
            fontSize="11"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.12em" }}
            initial={false}
            animate={{
              opacity: (phase === 13 || reduced) ? 1 : 0,
            }}
            transition={{ duration: 0.4, ease }}
          >
            {`−${Math.round(((baselineMs - optimisedMs) / baselineMs) * 100)}%`}
          </motion.text>

          {/* ===== pipeline axis label ===== */}
          <text
            x={VB_W / 2}
            y={NODE_Y + NODE_H + 46}
            textAnchor="middle"
            fontSize="9"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            sensor → receiver → isr → transport → cluster → lamp
          </text>
        </svg>
      </div>
    </ChartFrame>
  );
}
