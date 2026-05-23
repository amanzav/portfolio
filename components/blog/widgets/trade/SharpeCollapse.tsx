"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "@/components/blog/primitives/ChartFrame";

interface BugSpec {
  label: string;
  sub: string;
}

interface TradeSharpeCollapseProps {
  caption: string;
  number?: string;
  meta?: string;
  beforeSharpe?: number;
  afterSharpe?: number;
  bugs?: BugSpec[];
}

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 320;

// Sharpe axis maps [0, 3.5] → [80, 640]
const AXIS_X0 = 80;
const AXIS_X1 = 640;
const AXIS_Y = 200;
const SHARPE_MAX = 3.5;
const sharpeToX = (s: number) =>
  AXIS_X0 + (Math.max(0, Math.min(s, SHARPE_MAX)) / SHARPE_MAX) * (AXIS_X1 - AXIS_X0);

const BAR_BEFORE_Y = 120;
const BAR_AFTER_Y = 170;
const BAR_H = 30;

const DEFAULT_BUGS: BugSpec[] = [
  { label: "exa cache", sub: "query-string · future docs" },
  { label: "firestore index", sub: "sort desc, read asc" },
];

export function TradeSharpeCollapse({
  caption,
  number,
  meta = "leakage bugfix · 3.2 → 1.6",
  beforeSharpe = 3.2,
  afterSharpe = 1.6,
  bugs = DEFAULT_BUGS,
}: TradeSharpeCollapseProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // phase: 0 idle (BEFORE bar at 3.2 with stamps) ·
  //        1 stamps shake + strike-through, fade ·
  //        2 BEFORE bar shrinks 3.2 → 1.6 ·
  //        3 reframes as AFTER (slides down to BAR_AFTER_Y), ghost stays ·
  //        4 bottom callout fades in
  const [phase, setPhase] = useState(0);

  // Stamp positions, above BEFORE bar — narrower so the fixed-tick ✓ stays
  // inside the 720 px viewbox.
  const stampPositions = useMemo(
    () =>
      bugs.slice(0, 2).map((b, idx) => ({
        ...b,
        x: idx === 0 ? 170 : 390,
        w: 188,
        y: 78,
        h: 30,
        idx,
      })),
    [bugs]
  );

  useEffect(() => {
    if (reduced) {
      setPhase(4);
      return;
    }
    if (!inView) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, p: number) =>
      timers.push(setTimeout(() => !cancelled && setPhase(p), ms));
    const run = () => {
      setPhase(0);
      at(700, 1);
      at(2100, 2);
      at(3400, 3);
      at(4100, 4);
      timers.push(setTimeout(() => !cancelled && run(), 7800));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced]);

  const show = (p: number) => phase >= p;

  // Active bar width/x position. After phase 2 it shrinks; after phase 3
  // it slides down to the AFTER lane y.
  const activeBarWidth = show(2)
    ? sharpeToX(afterSharpe) - AXIS_X0
    : sharpeToX(beforeSharpe) - AXIS_X0;
  const activeBarY = show(3) ? BAR_AFTER_Y : BAR_BEFORE_Y;

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
            Apparent Sharpe of {beforeSharpe} before fixing two leakage bugs
            (an Exa client caching by query string and a Firestore index sorted
            descending but read ascending). After the fix, the honest Sharpe
            settles at {afterSharpe}. The shrinking bar is the entire story.
          </desc>
          <defs>
            <pattern
              id="tsc-scanlines"
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
            <pattern
              id="tsc-hatch"
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="6" height="6" fill="transparent" />
              <rect
                width="1"
                height="6"
                fill="rgb(var(--foreground))"
                opacity="0.06"
              />
            </pattern>
          </defs>

          {/* ── Headers ────────────────────────────────────────── */}
          <text
            x={24}
            y={22}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            before bugfix · two silent leaks
          </text>
          <text
            x={696}
            y={22}
            textAnchor="end"
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            after bugfix · honest sharpe
          </text>

          {/* ── Zone shading (BELIEVABLE 0..2.0, TOO GOOD 2.0..3.5) ── */}
          <rect
            x={sharpeToX(0)}
            y={AXIS_Y - 130}
            width={sharpeToX(2.0) - sharpeToX(0)}
            height={130}
            fill="url(#tsc-scanlines)"
          />
          <rect
            x={sharpeToX(2.0)}
            y={AXIS_Y - 130}
            width={sharpeToX(3.5) - sharpeToX(2.0)}
            height={130}
            fill="url(#tsc-hatch)"
          />

          {/* ── Bug stamps (phase 0–1) ─────────────────────────── */}
          {stampPositions.map((s) => {
            const struck = show(1);
            return (
              <motion.g
                key={`stamp-${s.idx}`}
                initial={false}
                animate={
                  phase === 1 && !reduced
                    ? { x: [0, -2, 2, 0], opacity: 1 }
                    : { x: 0, opacity: show(2) ? 0.25 : 1 }
                }
                transition={{ duration: 0.5, ease }}
              >
                <rect
                  x={s.x}
                  y={s.y}
                  width={s.w}
                  height={s.h}
                  fill="rgb(var(--background))"
                  stroke="rgb(var(--foreground))"
                  strokeWidth={0.9}
                />
                {/* BUG badge */}
                <rect
                  x={s.x + 6}
                  y={s.y + 6}
                  width={28}
                  height={12}
                  fill="rgb(var(--foreground) / 0.1)"
                  stroke="rgb(var(--foreground))"
                  strokeWidth={0.7}
                />
                <text
                  x={s.x + 20}
                  y={s.y + 15}
                  textAnchor="middle"
                  fontSize="7"
                  fill="rgb(var(--foreground))"
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
                >
                  bug
                </text>
                <text
                  x={s.x + 40}
                  y={s.y + 14}
                  fontSize="8"
                  fill="rgb(var(--foreground))"
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
                >
                  {s.label}
                </text>
                <text
                  x={s.x + 40}
                  y={s.y + 25}
                  fontSize="7"
                  fill="rgb(var(--muted))"
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.1em" }}
                >
                  {s.sub}
                </text>
                {/* strike-through — starts after the BUG badge so it crosses
                    only the label text, leaving the badge readable */}
                <motion.line
                  x1={s.x + 38}
                  x2={s.x + s.w - 2}
                  y1={s.y + s.h / 2}
                  y2={s.y + s.h / 2}
                  stroke="rgb(var(--foreground))"
                  strokeWidth={1}
                  initial={false}
                  animate={{ opacity: struck ? 0.7 : 0 }}
                  transition={{ duration: 0.4, ease }}
                />
                {/* fixed tick */}
                <motion.text
                  x={s.x + s.w + 6}
                  y={s.y + s.h / 2 + 4}
                  fontSize="11"
                  fill="rgb(var(--foreground))"
                  fontFamily="var(--font-mono)"
                  initial={false}
                  animate={{ opacity: struck ? 1 : 0 }}
                  transition={{ duration: 0.3, ease, delay: 0.25 }}
                >
                  ✓
                </motion.text>
              </motion.g>
            );
          })}

          {/* ── Ghost outline at the original 3.2 (visible from phase 3) ── */}
          <motion.rect
            x={AXIS_X0}
            y={BAR_BEFORE_Y}
            width={sharpeToX(beforeSharpe) - AXIS_X0}
            height={BAR_H}
            fill="none"
            stroke="rgb(var(--foreground) / 0.4)"
            strokeWidth={0.8}
            strokeDasharray="3 3"
            initial={false}
            animate={{ opacity: show(3) ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          />
          {/* Ghost label "was 3.2" */}
          <motion.text
            x={sharpeToX(beforeSharpe) - 6}
            y={BAR_BEFORE_Y + BAR_H / 2 + 3}
            textAnchor="end"
            fontSize="7.5"
            fill="rgb(var(--foreground) / 0.55)"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            initial={false}
            animate={{ opacity: show(3) ? 1 : 0 }}
            transition={{ duration: 0.4, ease, delay: 0.1 }}
          >
            was {beforeSharpe.toFixed(1)}
          </motion.text>

          {/* ── The active bar (the headline animation) ──────── */}
          <motion.rect
            x={AXIS_X0}
            initial={false}
            animate={{
              y: activeBarY,
              width: activeBarWidth,
              opacity: 1,
            }}
            transition={{ duration: reduced ? 0 : 1.0, ease }}
            height={BAR_H}
            fill="rgb(var(--foreground) / 0.08)"
            stroke="rgb(var(--foreground))"
            strokeWidth={1.2}
          />
          {/* BEFORE label (visible until phase 3 when it morphs to AFTER) */}
          <motion.text
            x={AXIS_X0 + 12}
            initial={false}
            animate={{
              y: activeBarY + BAR_H / 2 + 3,
              opacity: show(3) ? 0 : 1,
            }}
            transition={{ duration: 0.4, ease }}
            fontSize="9"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            before · sharpe {beforeSharpe.toFixed(1)}
          </motion.text>
          {/* shrinking label mid-animation showing current Sharpe */}
          <motion.text
            x={AXIS_X0 + activeBarWidth - 10}
            initial={false}
            animate={{
              y: activeBarY + BAR_H / 2 + 3,
              opacity: show(3) ? 1 : 0,
            }}
            transition={{ duration: 0.4, ease, delay: 0.15 }}
            textAnchor="end"
            fontSize="9"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            after · sharpe {afterSharpe.toFixed(1)}
          </motion.text>

          {/* ── Sharpe axis ──────────────────────────────────── */}
          <line
            x1={AXIS_X0}
            x2={AXIS_X1}
            y1={AXIS_Y}
            y2={AXIS_Y}
            stroke="rgb(var(--border))"
            strokeWidth={0.9}
          />
          {[
            { v: 0, emph: false },
            { v: 1.0, emph: false },
            { v: 1.6, emph: true },
            { v: 2.0, emph: false },
            { v: 3.0, emph: false },
            { v: 3.2, emph: true },
          ].map((t) => (
            <g key={`tick-${t.v}`}>
              <line
                x1={sharpeToX(t.v)}
                x2={sharpeToX(t.v)}
                y1={AXIS_Y - 3}
                y2={AXIS_Y + 3}
                stroke="rgb(var(--border))"
                strokeWidth={0.9}
              />
              <text
                x={sharpeToX(t.v)}
                y={216}
                textAnchor="middle"
                fontSize={t.emph ? 9 : 7.5}
                fill={
                  t.emph ? "rgb(var(--foreground))" : "rgb(var(--muted))"
                }
                fontFamily="var(--font-mono)"
                style={{ letterSpacing: "0.1em" }}
              >
                {t.v.toFixed(1)}
              </text>
            </g>
          ))}

          {/* zone labels (below ticks) */}
          <text
            x={140}
            y={234}
            fontSize="7.5"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.2em", textTransform: "uppercase" }}
          >
            believable
          </text>
          <text
            x={520}
            y={234}
            fontSize="7.5"
            fill="rgb(var(--foreground) / 0.55)"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.2em", textTransform: "uppercase" }}
          >
            too good to be true
          </text>

          <text
            x={360}
            y={250}
            textAnchor="middle"
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            sharpe ratio
          </text>

          {/* ── Bottom callout ──────────────────────────────── */}
          <motion.g
            initial={false}
            animate={{ opacity: show(4) ? 1 : 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <text
              x={360}
              y={276}
              textAnchor="middle"
              fontSize="16"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
            >
              −{(beforeSharpe - afterSharpe).toFixed(1)} sharpe
            </text>
            <text
              x={360}
              y={302}
              textAnchor="middle"
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
            >
              honest baseline &gt; flattering fantasy
            </text>
          </motion.g>
        </svg>
      </div>
    </ChartFrame>
  );
}
