"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "@/components/blog/primitives/ChartFrame";

interface DocSpec {
  domain: string;
  daysFromFiling: number;
  trust?: number;
}

interface TradeLeakageGuardProps {
  caption: string;
  number?: string;
  meta?: string;
  docs?: DocSpec[];
}

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 300;

// Axis mapping: daysFromFiling ∈ [-30, +6] → x ∈ [40, 680]
const AXIS_X0 = 40;
const AXIS_X1 = 680;
const AXIS_Y = 210;
const BARRIER_X = 520; // x for d=0 (t_filing)

const dayToX = (d: number) =>
  AXIS_X0 + ((d + 30) / 36) * (AXIS_X1 - AXIS_X0);

const CHIP_W = 96;
const CHIP_H = 22;
const LANES = [78, 110, 142, 174];

const DEFAULT_DOCS: DocSpec[] = [
  { domain: "reuters", daysFromFiling: -28, trust: 0.95 },
  { domain: "bloomberg", daysFromFiling: -19, trust: 0.93 },
  { domain: "company 8-k", daysFromFiling: -11, trust: 0.99 },
  { domain: "wsj", daysFromFiling: -4, trust: 0.9 },
  { domain: "seo-farm", daysFromFiling: 1, trust: 0.05 },
  { domain: "reddit", daysFromFiling: 3, trust: 0.2 },
  { domain: "blog post", daysFromFiling: 4, trust: 0.15 },
];

export function TradeLeakageGuard({
  caption,
  number,
  meta = "7 candidates · 4 admitted · ≤ t_filing",
  docs = DEFAULT_DOCS,
}: TradeLeakageGuardProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // phase: 0 idle (chips stacked left) · 1 chips slide to dates ·
  //        2 barrier solidifies · 3 right-of-barrier dimmed + strike ·
  //        4 counter ticks 7 → 4
  const [phase, setPhase] = useState(0);
  const [admitted, setAdmitted] = useState(7);

  const totalDocs = docs.length;
  const admittedCount = useMemo(
    () => docs.filter((d) => d.daysFromFiling <= 0).length,
    [docs]
  );

  // Deterministically assign each chip to a lane using a left-to-right
  // packing scan: place chip in first lane whose previous chip's right
  // edge < chip.x - 6.
  const placed = useMemo(() => {
    const sorted = docs
      .map((d, i) => ({ ...d, i, x: dayToX(d.daysFromFiling) }))
      .sort((a, b) => a.x - b.x);
    const laneRightEdge: number[] = [
      -Infinity,
      -Infinity,
      -Infinity,
      -Infinity,
    ];
    const result = sorted.map((d) => {
      let lane = 0;
      for (let l = 0; l < LANES.length; l++) {
        if (laneRightEdge[l] < d.x - 6) {
          lane = l;
          break;
        }
      }
      laneRightEdge[lane] = d.x + CHIP_W;
      return { ...d, lane };
    });
    // restore original order so React keys remain stable
    return result.sort((a, b) => a.i - b.i);
  }, [docs]);

  useEffect(() => {
    if (reduced) {
      setPhase(4);
      setAdmitted(admittedCount);
      return;
    }
    if (!inView) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, p: number) =>
      timers.push(setTimeout(() => !cancelled && setPhase(p), ms));
    const run = () => {
      setPhase(0);
      setAdmitted(totalDocs);
      at(350, 1);
      at(1700, 2);
      at(2500, 3);
      at(3400, 4);
      timers.push(setTimeout(() => !cancelled && run(), 7500));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced, admittedCount, totalDocs]);

  // Counter tick 7 → 4 during phase 4
  useEffect(() => {
    if (reduced) return;
    if (phase < 4) {
      setAdmitted(totalDocs);
      return;
    }
    const start = performance.now();
    const dur = 700;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(totalDocs - (totalDocs - admittedCount) * eased);
      setAdmitted(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reduced, totalDocs, admittedCount]);

  const show = (p: number) => phase >= p;

  // Idle stack position (chips bunched near left margin, lane-stacked)
  const stackedX = (lane: number) => 56 + lane * 6;

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
            The evidence pinning gate. Exa returns seven candidate documents.
            Each is placed on a time axis at its published_at date relative to
            t_filing. The vertical barrier at t_filing drops any document
            published after the filing, so the model only sees the four
            admissible excerpts.
          </desc>
          <defs>
            <pattern
              id="tlg-scanlines"
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

          {/* ── Header ─────────────────────────────────────────────── */}
          <text
            x={24}
            y={22}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            evidence pinning · published_before = t_filing
          </text>
          <text
            x={696}
            y={22}
            textAnchor="end"
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            exa candidates · gate · admitted
          </text>
          <text
            x={40}
            y={40}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            exa returns {totalDocs} candidate docs · gate accepts {admittedCount}
          </text>

          {/* Counter (top right) */}
          <text
            x={696}
            y={42}
            textAnchor="end"
            fontSize="14"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
          >
            {admitted} admitted
          </text>

          {/* ── Region labels ────────────────────────────────────── */}
          <text
            x={280}
            y={64}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            admissible
          </text>
          <text
            x={600}
            y={64}
            fontSize="8"
            fill="rgb(var(--foreground) / 0.45)"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            future · dropped
          </text>

          {/* faint scanline fill in admissible zone */}
          <rect
            x={AXIS_X0}
            y={70}
            width={BARRIER_X - AXIS_X0}
            height={AXIS_Y - 70}
            fill="url(#tlg-scanlines)"
          />

          {/* ── Axis ──────────────────────────────────────────────── */}
          <line
            x1={AXIS_X0}
            x2={AXIS_X1}
            y1={AXIS_Y}
            y2={AXIS_Y}
            stroke="rgb(var(--border))"
            strokeWidth={0.9}
          />
          {[
            { d: -30, label: "t−30d" },
            { d: -20, label: "t−20d" },
            { d: -10, label: "t−10d" },
            { d: 0, label: "t_filing" },
            { d: 5, label: "t+5d" },
          ].map((t) => (
            <g key={t.label}>
              <line
                x1={dayToX(t.d)}
                x2={dayToX(t.d)}
                y1={AXIS_Y - 3}
                y2={AXIS_Y + 3}
                stroke="rgb(var(--border))"
                strokeWidth={0.9}
              />
              <text
                x={dayToX(t.d)}
                y={226}
                textAnchor="middle"
                fontSize="7.5"
                fill={
                  t.d === 0
                    ? "rgb(var(--foreground))"
                    : "rgb(var(--muted))"
                }
                fontFamily="var(--font-mono)"
                style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* ── t_filing vertical barrier ─────────────────────────── */}
          <motion.line
            x1={BARRIER_X}
            x2={BARRIER_X}
            y1={70}
            y2={AXIS_Y}
            stroke="rgb(var(--foreground))"
            strokeWidth={1.4}
            strokeDasharray={show(2) ? "0" : "3 3"}
            initial={false}
            animate={{ opacity: show(2) ? 1 : 0.35 }}
            transition={{ duration: 0.4, ease }}
          />
          <motion.text
            x={BARRIER_X}
            y={58}
            textAnchor="middle"
            fontSize="8"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
            initial={false}
            animate={{ opacity: show(2) ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          >
            t_filing
          </motion.text>

          {/* ── Document chips ────────────────────────────────────── */}
          {placed.map((d, idx) => {
            const targetX = d.x - CHIP_W / 2;
            const startX = stackedX(d.lane);
            const cx = show(1) ? targetX : startX;
            const dropped = d.daysFromFiling > 0;
            const chipFill = "rgb(var(--background))";
            const chipStroke =
              show(3) && dropped
                ? "rgb(var(--border))"
                : show(3) && !dropped
                ? "rgb(var(--foreground))"
                : "rgb(var(--border))";
            const chipOpacity = show(3) && dropped ? 0.28 : 1;
            const chipStrokeWidth = show(3) && !dropped ? 1.2 : 0.8;
            const chipY = LANES[d.lane];

            return (
              <motion.g
                key={`doc-${d.i}`}
                initial={false}
                animate={{
                  x: cx,
                  opacity: chipOpacity,
                }}
                transition={{
                  duration: reduced ? 0 : 0.7,
                  ease,
                  delay: reduced ? 0 : show(1) ? (idx % 4) * 0.06 : 0,
                }}
              >
                <rect
                  x={0}
                  y={chipY}
                  width={CHIP_W}
                  height={CHIP_H}
                  fill={chipFill}
                  stroke={chipStroke}
                  strokeWidth={chipStrokeWidth}
                />
                <text
                  x={6}
                  y={chipY + 14}
                  fontSize="7.5"
                  fill="rgb(var(--foreground))"
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.06em" }}
                >
                  {d.domain}
                </text>
                {/* admitted check tick */}
                {!dropped && (
                  <motion.text
                    x={CHIP_W - 8}
                    y={chipY + 15}
                    textAnchor="end"
                    fontSize="9"
                    fill="rgb(var(--foreground))"
                    fontFamily="var(--font-mono)"
                    initial={false}
                    animate={{ opacity: show(3) ? 1 : 0 }}
                    transition={{ duration: 0.3, ease }}
                  >
                    ✓
                  </motion.text>
                )}
                {/* dropped strike-through + dropped tag */}
                {dropped && (
                  <>
                    <motion.line
                      x1={2}
                      x2={CHIP_W - 2}
                      y1={chipY + CHIP_H / 2}
                      y2={chipY + CHIP_H / 2}
                      stroke="rgb(var(--foreground))"
                      strokeWidth={1}
                      initial={false}
                      animate={{ opacity: show(3) ? 0.6 : 0 }}
                      transition={{ duration: 0.4, ease }}
                    />
                    <motion.text
                      x={CHIP_W - 4}
                      y={chipY - 2}
                      textAnchor="end"
                      fontSize="6.5"
                      fill="rgb(var(--foreground) / 0.65)"
                      fontFamily="var(--font-mono)"
                      style={{
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                      }}
                      initial={false}
                      animate={{ opacity: show(3) ? 1 : 0 }}
                      transition={{ duration: 0.3, ease }}
                    >
                      dropped
                    </motion.text>
                  </>
                )}
              </motion.g>
            );
          })}

          {/* ── Footer ────────────────────────────────────────────── */}
          <text
            x={360}
            y={282}
            textAnchor="middle"
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            claude only sees the {admittedCount} admitted excerpts
          </text>
        </svg>
      </div>
    </ChartFrame>
  );
}
