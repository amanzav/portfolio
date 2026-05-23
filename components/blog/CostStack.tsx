"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "./ChartFrame";

interface Lever {
  label: string;
  delta: number; // amount knocked off the running cost
}

interface CostStackProps {
  caption: string;
  number?: string;
  meta?: string;
  baseline?: number;
  levers?: Lever[];
}

const DEFAULT_LEVERS: Lever[] = [
  { label: "batch 50 rows / call", delta: 36 },
  { label: "delta-only enrichment", delta: 16 },
  { label: "redis cache hits", delta: 8 },
];

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 300;
const BAR_X = 40;
const BAR_W = 460;
const BAR_Y = 60;
const BAR_H = 30;

export function CostStack({
  caption,
  number,
  meta = "monthly openai cost · baseline=100",
  baseline = 100,
  levers = DEFAULT_LEVERS,
}: CostStackProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // 0 idle · 1 baseline · 2..n levers applied
  const [phase, setPhase] = useState(0);
  const [display, setDisplay] = useState(baseline);

  const finalPhase = 1 + levers.length;

  useEffect(() => {
    if (reduced) {
      setPhase(finalPhase);
      return;
    }
    if (!inView) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, p: number) =>
      timers.push(setTimeout(() => !cancelled && setPhase(p), ms));
    const run = () => {
      setPhase(0);
      at(200, 1);
      levers.forEach((_, i) => at(1100 + i * 1100, 2 + i));
      timers.push(
        setTimeout(() => !cancelled && run(), 1100 + levers.length * 1100 + 3000)
      );
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced, levers, finalPhase]);

  // running cost target for current phase
  const applied = Math.max(0, phase - 1);
  const target =
    baseline - levers.slice(0, applied).reduce((s, l) => s + l.delta, 0);

  // ease the displayed number toward target
  useEffect(() => {
    if (reduced) {
      setDisplay(target);
      return;
    }
    const start = performance.now();
    const from = display;
    const dur = 700;
    let raf = 0;
    const tick = (now: number) => {
      const tt = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - tt, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (tt < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, reduced]);

  const show = (p: number) => phase >= p;
  const barLen = (v: number) => (v / baseline) * BAR_W;

  // segment boundaries for the deduction chips under the bar
  let cursor = baseline;

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
            The OpenAI bill, indexed at 100, drops as batching, delta-only
            calls, and Redis cache hits each knock cost off, ending near 40 (a
            60% cut).
          </desc>
          <defs>
            <pattern
              id="cost-scanlines"
              width="2"
              height="3"
              patternUnits="userSpaceOnUse"
            >
              <rect width="2" height="3" fill="transparent" />
              <rect
                width="2"
                height="1"
                fill="rgb(var(--foreground))"
                opacity="0.04"
              />
            </pattern>
          </defs>

          {/* baseline ghost outline */}
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
          <text
            x={BAR_X}
            y={BAR_Y - 10}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            baseline 100 · one llm call per row
          </text>

          {/* live cost bar */}
          <rect
            x={BAR_X}
            y={BAR_Y}
            width={Math.max(0, barLen(display))}
            height={BAR_H}
            fill="url(#cost-scanlines)"
          />
          <motion.rect
            x={BAR_X}
            y={BAR_Y}
            height={BAR_H}
            fill={
              show(finalPhase)
                ? "rgb(var(--foreground) / 0.85)"
                : "rgb(var(--foreground) / 0.5)"
            }
            initial={false}
            animate={{ width: Math.max(0, barLen(target)) }}
            transition={{ duration: reduced ? 0 : 0.7, ease }}
          />

          {/* running cost counter */}
          <text
            x={520}
            y={BAR_Y + 24}
            fontSize="30"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
          >
            {display}
          </text>
          <text
            x={608}
            y={BAR_Y + 24}
            fontSize="11"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
          >
            cost
          </text>

          {/* lever deductions */}
          {levers.map((l, i) => {
            const startVal = cursor;
            cursor -= l.delta;
            const segX = BAR_X + barLen(cursor);
            const segW = barLen(l.delta);
            const active = show(2 + i);
            return (
              <motion.g
                key={l.label}
                initial={false}
                animate={{ opacity: active ? 1 : 0, y: active ? 0 : 6 }}
                transition={{ duration: 0.45, ease }}
              >
                {/* knocked-off slice */}
                <rect
                  x={segX}
                  y={BAR_Y}
                  width={segW}
                  height={BAR_H}
                  fill="none"
                  stroke="rgb(var(--foreground) / 0.4)"
                  strokeWidth={0.7}
                  strokeDasharray="2 3"
                />
                {/* connector + label below */}
                <line
                  x1={segX + segW / 2}
                  x2={segX + segW / 2}
                  y1={BAR_Y + BAR_H}
                  y2={BAR_Y + BAR_H + 18 + i * 26}
                  stroke="rgb(var(--border))"
                  strokeWidth={0.7}
                />
                <text
                  x={segX + segW / 2}
                  y={BAR_Y + BAR_H + 30 + i * 26}
                  textAnchor="middle"
                  fontSize="9"
                  fill="rgb(var(--foreground) / 0.8)"
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.06em" }}
                >
                  {`− ${l.delta}  ${l.label}`}
                </text>
              </motion.g>
            );
          })}

          {/* payoff */}
          <motion.text
            x={520}
            y={BAR_Y + 52}
            fontSize="12"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.1em" }}
            initial={false}
            animate={{ opacity: show(finalPhase) ? 1 : 0 }}
            transition={{ duration: 0.5, ease }}
          >
            60% less
          </motion.text>
        </svg>
      </div>
    </ChartFrame>
  );
}
