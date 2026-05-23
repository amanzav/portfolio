"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "./ChartFrame";

interface OnboardingShrinkProps {
  caption: string;
  number?: string;
  meta?: string;
  beforeDays?: number;
  afterDays?: number;
  // kept for backwards compatibility with existing call sites — unused
  fieldCount?: number;
  questionCount?: number;
  payoffMultiplier?: string;
}

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 280;

// Single shared day axis (0 → beforeDays) lets the visual length of each lane
// carry the headline message: the AFTER bar literally finishes in ~28% of the
// horizontal space. No detail row, no decoration — just contrast.
export function OnboardingShrink({
  caption,
  number,
  meta = "14d manual → 4d self-serve",
  beforeDays = 14,
  afterDays = 4,
  payoffMultiplier = "pipeline 3×",
}: OnboardingShrinkProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // phase: 0 idle · 1 before lane fills · 2 after lane fills · 3 payoff
  const [phase, setPhase] = useState(0);

  // Shared day axis
  const AXIS_X = 24;
  const AXIS_END = VB_W - 24;
  const TRACK_W = AXIS_END - AXIS_X;
  const dayX = (d: number) => AXIS_X + (d / beforeDays) * TRACK_W;

  // Lanes
  const BEFORE_LABEL_Y = 78;
  const BEFORE_TRACK_Y = 88;
  const TRACK_H = 44;

  const AFTER_LABEL_Y = 168;
  const AFTER_TRACK_Y = 178;

  const AXIS_Y = AFTER_TRACK_Y + TRACK_H + 14; // shared bottom axis = 236

  // BEFORE stages — 3 chunks, abbreviated
  const beforeStages = useMemo(
    () => [
      { id: "kickoff", label: "kickoff", day0: 0, day1: 1, faded: false },
      {
        id: "manual-build",
        label: "manual notion build",
        day0: 1,
        day1: 13,
        faded: false,
      },
      { id: "handoff", label: "handoff", day0: 13, day1: beforeDays, faded: false },
    ],
    [beforeDays]
  );

  // AFTER stages — 3 chunks. Labels kept to single words so each fits
  // comfortably inside its narrow chip.
  const afterStages = useMemo(
    () => [
      { id: "form", label: "form", day0: 0, day1: 1.2 },
      { id: "auto", label: "auto-fill", day0: 1.2, day1: 3 },
      { id: "live", label: "live", day0: 3, day1: afterDays },
    ],
    [afterDays]
  );

  // looping phase machine
  useEffect(() => {
    if (reduced) {
      setPhase(3);
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
      at(2400, 2);
      at(3600, 3);
      timers.push(setTimeout(() => !cancelled && run(), 7500));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced]);

  const show = (p: number) => phase >= p;

  // Payoff card (top, right-aligned)
  const PAYOFF = { x: VB_W - 220, y: 10, w: 196, h: 52 };

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
            Old onboarding ran {beforeDays} days, dominated by a manual Notion
            build by the CEO. The new self-serve flow finishes in {afterDays}{" "}
            days — a Typeform pipes into a Python webhook that clones the
            Notion template, leaving only a short human review. {payoffMultiplier}.
          </desc>
          <defs>
            <pattern
              id="ob-scanlines"
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

          {/* ===== Header strip (top-left descriptor) ===== */}
          <text
            x={24}
            y={28}
            fontSize="9"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            contract → live workspace
          </text>
          <text
            x={24}
            y={44}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.14em" }}
          >
            shared scale · 0 → {beforeDays} days
          </text>

          {/* ===== Payoff card (top-right) ===== */}
          <motion.g
            initial={false}
            animate={{
              opacity: show(3) ? 1 : 0,
              y: show(3) ? 0 : 4,
            }}
            transition={{ duration: 0.5, ease }}
          >
            <rect
              x={PAYOFF.x}
              y={PAYOFF.y}
              width={PAYOFF.w}
              height={PAYOFF.h}
              fill="rgb(var(--foreground) / 0.06)"
              stroke="rgb(var(--foreground))"
              strokeWidth={1}
            />
            <text
              x={PAYOFF.x + 14}
              y={PAYOFF.y + 16}
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
            >
              onboarding
            </text>
            <text
              x={PAYOFF.x + 14}
              y={PAYOFF.y + 36}
              fontSize="17"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
            >
              {beforeDays} → {afterDays} days
            </text>
            <text
              x={PAYOFF.x + PAYOFF.w - 14}
              y={PAYOFF.y + 48}
              textAnchor="end"
              fontSize="8"
              fill="rgb(var(--foreground) / 0.75)"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              {payoffMultiplier}
            </text>
          </motion.g>

          {/* ===== BEFORE lane label ===== */}
          <text
            x={AXIS_X}
            y={BEFORE_LABEL_Y}
            fontSize="9"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            before · {beforeDays} days
          </text>

          {/* BEFORE baseline track */}
          <rect
            x={AXIS_X}
            y={BEFORE_TRACK_Y}
            width={TRACK_W}
            height={TRACK_H}
            fill="rgb(var(--foreground) / 0.02)"
            stroke="rgb(var(--border))"
            strokeWidth={0.8}
          />

          {/* BEFORE stage chips - reveal sequentially as the lane "fills" */}
          {beforeStages.map((s, i) => {
            const x0 = dayX(s.day0);
            const x1 = dayX(s.day1);
            const w = x1 - x0;
            const active = show(1);
            return (
              <motion.g
                key={s.id}
                initial={false}
                animate={{ opacity: active ? 1 : 0 }}
                transition={{
                  duration: 0.5,
                  ease,
                  delay: reduced ? 0 : active ? i * 0.55 : 0,
                }}
              >
                <rect
                  x={x0 + 2}
                  y={BEFORE_TRACK_Y + 4}
                  width={Math.max(4, w - 4)}
                  height={TRACK_H - 8}
                  fill="url(#ob-scanlines)"
                />
                <rect
                  x={x0 + 2}
                  y={BEFORE_TRACK_Y + 4}
                  width={Math.max(4, w - 4)}
                  height={TRACK_H - 8}
                  fill={
                    s.id === "manual-build"
                      ? "rgb(var(--foreground) / 0.07)"
                      : "rgb(var(--foreground) / 0.035)"
                  }
                  stroke="rgb(var(--border))"
                  strokeWidth={0.8}
                />
                {/* label centered in chip if it fits, else top-left */}
                <text
                  x={x0 + w / 2}
                  y={BEFORE_TRACK_Y + TRACK_H / 2 + 3}
                  textAnchor="middle"
                  fontSize="8.5"
                  fill={
                    s.id === "manual-build"
                      ? "rgb(var(--foreground))"
                      : "rgb(var(--foreground) / 0.7)"
                  }
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.16em", textTransform: "uppercase" }}
                >
                  {s.label}
                </text>
              </motion.g>
            );
          })}

          {/* ===== AFTER lane label ===== */}
          <motion.text
            x={AXIS_X}
            y={AFTER_LABEL_Y}
            fontSize="9"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
            initial={false}
            animate={{ opacity: show(2) ? 1 : 0.4 }}
            transition={{ duration: 0.5, ease }}
          >
            after · {afterDays} days · typeform → python → notion
          </motion.text>

          {/* "self-serve" tag, on the right side of after lane (in the empty zone),
              visually claims the won-back time */}
          <motion.text
            x={AXIS_END}
            y={AFTER_LABEL_Y}
            textAnchor="end"
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
            initial={false}
            animate={{ opacity: show(2) ? 1 : 0 }}
            transition={{ duration: 0.5, ease, delay: reduced ? 0 : 0.4 }}
          >
            ← {beforeDays - afterDays} days saved
          </motion.text>

          {/* AFTER baseline ghost track (full width, very faint — shows the
              shape of the old envelope under the short new bar) */}
          <motion.rect
            x={AXIS_X}
            y={AFTER_TRACK_Y}
            width={TRACK_W}
            height={TRACK_H}
            fill="transparent"
            stroke="rgb(var(--border))"
            strokeWidth={0.5}
            strokeDasharray="3 4"
            initial={false}
            animate={{ opacity: show(2) ? 0.6 : 0 }}
            transition={{ duration: 0.5, ease }}
          />

          {/* AFTER actual track (short) */}
          <motion.rect
            x={AXIS_X}
            y={AFTER_TRACK_Y}
            width={dayX(afterDays) - AXIS_X}
            height={TRACK_H}
            fill="rgb(var(--foreground) / 0.04)"
            stroke="rgb(var(--foreground))"
            strokeWidth={1}
            initial={false}
            animate={{ opacity: show(2) ? 1 : 0 }}
            transition={{ duration: 0.5, ease }}
          />

          {/* AFTER stage chips */}
          {afterStages.map((s, i) => {
            const x0 = dayX(s.day0);
            const x1 = dayX(s.day1);
            const w = x1 - x0;
            return (
              <motion.g
                key={s.id}
                initial={false}
                animate={{ opacity: show(2) ? 1 : 0 }}
                transition={{
                  duration: 0.4,
                  ease,
                  delay: reduced ? 0 : show(2) ? i * 0.18 : 0,
                }}
              >
                <rect
                  x={x0 + 1}
                  y={AFTER_TRACK_Y + 4}
                  width={Math.max(4, w - 2)}
                  height={TRACK_H - 8}
                  fill="rgb(var(--foreground) / 0.06)"
                  stroke="rgb(var(--border))"
                  strokeWidth={0.7}
                />
                <text
                  x={x0 + w / 2}
                  y={AFTER_TRACK_Y + TRACK_H / 2 + 3}
                  textAnchor="middle"
                  fontSize="7.5"
                  fill="rgb(var(--foreground))"
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
                >
                  {s.label}
                </text>
              </motion.g>
            );
          })}

          {/* ===== shared day-axis ticks ===== */}
          <g>
            <line
              x1={AXIS_X}
              x2={AXIS_END}
              y1={AXIS_Y}
              y2={AXIS_Y}
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
            />
            {[0, afterDays, 7, beforeDays].map((d) => (
              <g key={`tick-${d}`}>
                <line
                  x1={dayX(d)}
                  x2={dayX(d)}
                  y1={AXIS_Y - 3}
                  y2={AXIS_Y + 3}
                  stroke="rgb(var(--border))"
                  strokeWidth={0.9}
                />
                <text
                  x={dayX(d)}
                  y={AXIS_Y + 14}
                  textAnchor="middle"
                  fontSize="8"
                  fill={
                    d === afterDays || d === beforeDays
                      ? "rgb(var(--foreground))"
                      : "rgb(var(--muted))"
                  }
                  fontFamily="var(--font-mono)"
                  style={{
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  day {d}
                </text>
              </g>
            ))}
          </g>

          {/* ===== footer ===== */}
          <text
            x={VB_W / 2}
            y={VB_H - 8}
            textAnchor="middle"
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            long manual lane vs short automated lane · same scale
          </text>
        </svg>
      </div>
    </ChartFrame>
  );
}
