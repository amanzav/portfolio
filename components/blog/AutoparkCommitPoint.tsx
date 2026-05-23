"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "./ChartFrame";

interface AutoparkCommitPointProps {
  caption: string;
  number?: string;
  meta?: string;
  commitRadiusM?: number;
  commitHeadingDeg?: number;
}

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 300;

// Time axis: t in [0, 8] seconds, mapped onto x in [80, 680].
// "Progress" axis y: progress in [0, 1.05], mapped onto y in [base, base - bandH].
const T0 = 0;
const T1 = 8;
const AX_X0 = 80;
const AX_X1 = 680;
const AX_Y = 258;

const BEFORE_BASE_Y = 132; // y at progress = 0
const BEFORE_TOP_Y = 88; // y at progress = 1
const AFTER_BASE_Y = 230;
const AFTER_TOP_Y = 186;

const mapT = (t: number) => AX_X0 + ((t - T0) / (T1 - T0)) * (AX_X1 - AX_X0);
const mapBefore = (p: number) =>
  BEFORE_BASE_Y + (BEFORE_TOP_Y - BEFORE_BASE_Y) * Math.min(1, Math.max(0, p));
const mapAfter = (p: number) =>
  AFTER_BASE_Y + (AFTER_TOP_Y - AFTER_BASE_Y) * Math.min(1, Math.max(0, p));

// Pre-bake progress(t) for both traces.
// BEFORE: smooth ease-out climb t in [0, 5] reaching 0.85, then sinusoidal
// oscillation amplitude 0.08, decaying frequency, never crossing 1.0.
function progressBefore(t: number) {
  if (t <= 5) {
    const x = t / 5;
    return 0.85 * (1 - Math.pow(1 - x, 2.2));
  }
  const dt = t - 5;
  const decay = Math.exp(-dt * 0.55);
  const freq = 2.8;
  // base climbs slightly toward 0.88 then wobbles; never hits 1.0
  const base = 0.85 + 0.03 * (1 - decay);
  return base + 0.08 * decay * Math.sin(freq * dt + 0.3);
}

// AFTER: same climb to 0.85 at t=5, then a clean ease to 1.0 by t=6.5.
function progressAfter(t: number) {
  if (t <= 5) {
    const x = t / 5;
    return 0.85 * (1 - Math.pow(1 - x, 2.2));
  }
  if (t >= 6.5) return 1.0;
  const x = (t - 5) / 1.5;
  const eased = 1 - Math.pow(1 - x, 3);
  return 0.85 + 0.15 * eased;
}

function buildPath(progressFn: (t: number) => number, mapY: (p: number) => number) {
  const samples = 160;
  let d = "";
  for (let i = 0; i <= samples; i++) {
    const t = T0 + (i / samples) * (T1 - T0);
    const x = mapT(t);
    const y = mapY(progressFn(t));
    d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

export function AutoparkCommitPoint({
  caption,
  number,
  meta = "re-plan storm → frozen tail",
  commitRadiusM = 1.5,
  commitHeadingDeg = 10,
}: AutoparkCommitPointProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // phase 0 idle · 1 rows draw · 2 before trace climbs · 3 before oscillates with X marks
  //       · 4 after trace climbs + commit bar slams · 5 after settles past bar
  const [phase, setPhase] = useState(0);

  const beforePath = useMemo(() => buildPath(progressBefore, mapBefore), []);
  const afterPath = useMemo(() => buildPath(progressAfter, mapAfter), []);

  // X-marks for failed re-plans
  const xMarks = useMemo(
    () =>
      [5.2, 6.4, 7.5].map((t) => ({
        t,
        x: mapT(t),
        y: mapBefore(progressBefore(t)),
      })),
    []
  );

  useEffect(() => {
    if (reduced) {
      setPhase(5);
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
      at(700, 2);
      at(2400, 3);
      at(3800, 4);
      at(5200, 5);
      timers.push(setTimeout(() => !cancelled && run(), 7800));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced]);

  const show = (p: number) => phase >= p;

  const commitX = mapT(5);
  const afterPathLength = 1000;
  const beforePathLength = 1000;

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
            Two progress-vs-time traces of the same parking maneuver. The BEFORE
            trace climbs cleanly until t = 5 s then oscillates indefinitely as
            perception confidence drops trigger a re-plan loop, never reaching
            the goal. The AFTER trace climbs identically, then crosses a commit
            point at {commitRadiusM} m and {commitHeadingDeg}° heading — the
            path is frozen and the tracker drives it open-loop to the goal by
            t ≈ 6.5 s.
          </desc>
          <defs>
            <pattern
              id="acp-scanlines"
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
            07 · commit point
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
            before / after
          </text>

          {/* ===== Lane labels (left gutter) ===== */}
          <text
            x={24}
            y={70}
            fontSize="9"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            before
          </text>
          <text
            x={24}
            y={168}
            fontSize="9"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            after
          </text>

          {/* progress axis label rotated */}
          <text
            x={16}
            y={130}
            fontSize="7"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            transform="rotate(-90 16 130)"
          >
            progress
          </text>

          {/* ===== BEFORE row background ===== */}
          <motion.rect
            x={AX_X0}
            y={BEFORE_TOP_Y}
            width={AX_X1 - AX_X0}
            height={BEFORE_BASE_Y - BEFORE_TOP_Y}
            fill="url(#acp-scanlines)"
            initial={false}
            animate={{ opacity: show(1) ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          />
          <motion.rect
            x={AX_X0}
            y={BEFORE_TOP_Y}
            width={AX_X1 - AX_X0}
            height={BEFORE_BASE_Y - BEFORE_TOP_Y}
            fill="transparent"
            stroke="rgb(var(--border))"
            strokeWidth={0.8}
            initial={false}
            animate={{ opacity: show(1) ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          />
          {/* before goal line (dotted) */}
          <motion.line
            x1={AX_X0}
            x2={AX_X1}
            y1={mapBefore(1)}
            y2={mapBefore(1)}
            stroke="rgb(var(--muted))"
            strokeWidth={0.7}
            strokeDasharray="2 3"
            initial={false}
            animate={{ opacity: show(1) ? 0.7 : 0 }}
            transition={{ duration: 0.4, ease }}
          />
          <motion.text
            x={684}
            y={mapBefore(1) - 2}
            textAnchor="end"
            fontSize="7"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            initial={false}
            animate={{ opacity: show(1) ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          >
            goal
          </motion.text>

          {/* ===== AFTER row background ===== */}
          <motion.rect
            x={AX_X0}
            y={AFTER_TOP_Y}
            width={AX_X1 - AX_X0}
            height={AFTER_BASE_Y - AFTER_TOP_Y}
            fill="url(#acp-scanlines)"
            initial={false}
            animate={{ opacity: show(1) ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          />
          <motion.rect
            x={AX_X0}
            y={AFTER_TOP_Y}
            width={AX_X1 - AX_X0}
            height={AFTER_BASE_Y - AFTER_TOP_Y}
            fill="transparent"
            stroke="rgb(var(--border))"
            strokeWidth={0.8}
            initial={false}
            animate={{ opacity: show(1) ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          />
          <motion.line
            x1={AX_X0}
            x2={AX_X1}
            y1={mapAfter(1)}
            y2={mapAfter(1)}
            stroke="rgb(var(--muted))"
            strokeWidth={0.7}
            strokeDasharray="2 3"
            initial={false}
            animate={{ opacity: show(1) ? 0.7 : 0 }}
            transition={{ duration: 0.4, ease }}
          />
          <motion.text
            x={684}
            y={mapAfter(1) - 2}
            textAnchor="end"
            fontSize="7"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            initial={false}
            animate={{ opacity: show(1) ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          >
            goal
          </motion.text>

          {/* ===== BEFORE trace ===== */}
          <motion.path
            d={beforePath}
            fill="none"
            stroke="rgb(var(--foreground))"
            strokeWidth={1.4}
            strokeLinecap="round"
            pathLength={beforePathLength}
            initial={false}
            animate={{
              opacity: show(2) ? 1 : 0,
              strokeDashoffset: show(2) ? 0 : beforePathLength,
            }}
            style={{
              strokeDasharray: beforePathLength,
            }}
            transition={{ duration: reduced ? 0 : 2.2, ease }}
          />

          {/* X-marks for failed re-plans (phase 3+) */}
          {xMarks.map((m, i) => (
            <motion.g
              key={`xmark-${i}`}
              initial={false}
              animate={{
                opacity: show(3) ? 0.95 : 0,
                scale: show(3) ? 1 : 0.6,
              }}
              transition={{
                duration: 0.35,
                ease,
                delay: reduced ? 0 : show(3) ? i * 0.25 : 0,
              }}
              style={{ transformOrigin: `${m.x}px ${m.y}px` }}
            >
              <line
                x1={m.x - 4}
                y1={m.y - 4}
                x2={m.x + 4}
                y2={m.y + 4}
                stroke="rgb(var(--foreground))"
                strokeWidth={1.4}
              />
              <line
                x1={m.x - 4}
                y1={m.y + 4}
                x2={m.x + 4}
                y2={m.y - 4}
                stroke="rgb(var(--foreground))"
                strokeWidth={1.4}
              />
            </motion.g>
          ))}

          {/* infeasible · re-plan loop label */}
          <motion.text
            x={mapT(6.4)}
            y={76}
            textAnchor="middle"
            fontSize="7.5"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            initial={false}
            animate={{ opacity: phase === 3 ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          >
            infeasible · re-plan loop
          </motion.text>

          {/* ===== AFTER trace ===== */}
          <motion.path
            d={afterPath}
            fill="none"
            stroke="rgb(var(--foreground))"
            strokeWidth={1.6}
            strokeLinecap="round"
            pathLength={afterPathLength}
            initial={false}
            animate={{
              opacity: show(4) ? 1 : 0,
              strokeDashoffset: show(4) ? 0 : afterPathLength,
            }}
            style={{
              strokeDasharray: afterPathLength,
            }}
            transition={{ duration: reduced ? 0 : 1.8, ease }}
          />

          {/* ===== Commit-point bar (vertical dashed at t≈5s, after row only) ===== */}
          <motion.line
            x1={commitX}
            x2={commitX}
            y1={AFTER_TOP_Y - 8}
            y2={AFTER_BASE_Y + 10}
            stroke="rgb(var(--foreground))"
            strokeWidth={show(4) ? 1.5 : 1}
            strokeDasharray="4 3"
            initial={false}
            animate={{
              opacity: show(4) ? 1 : 0,
              strokeWidth: show(4) && phase === 4 ? [1, 2.2, 1.5] : 1.5,
            }}
            transition={{ duration: 0.5, ease }}
          />
          <motion.text
            x={commitX + 8}
            y={175}
            fontSize="7.5"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.16em", textTransform: "uppercase" }}
            initial={false}
            animate={{ opacity: show(4) ? 1 : 0 }}
            transition={{ duration: 0.4, ease, delay: show(4) ? 0.3 : 0 }}
          >
            commit · {commitRadiusM}m / {commitHeadingDeg}°
          </motion.text>

          {/* frozen path chip — placed just above the goal pulse (phase 5+) */}
          <motion.text
            x={mapT(7.4)}
            y={mapAfter(1) - 10}
            textAnchor="middle"
            fontSize="7"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            initial={false}
            animate={{ opacity: show(5) ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          >
            frozen path
          </motion.text>

          {/* goal-reached pulse on after row */}
          <motion.circle
            cx={mapT(6.5)}
            cy={mapAfter(1)}
            r={4}
            fill="none"
            stroke="rgb(var(--foreground))"
            strokeWidth={1.2}
            initial={false}
            animate={
              show(5) && !reduced
                ? { opacity: [0, 1, 0.5], scale: [0.6, 1.4, 1] }
                : { opacity: show(5) ? 1 : 0, scale: 1 }
            }
            transition={{ duration: 1.1, ease, repeat: Infinity, repeatDelay: 0.4 }}
            style={{ transformOrigin: `${mapT(6.5)}px ${mapAfter(1)}px` }}
          />

          {/* ===== Time axis ===== */}
          <line
            x1={AX_X0}
            x2={AX_X1}
            y1={AX_Y}
            y2={AX_Y}
            stroke="rgb(var(--border))"
            strokeWidth={0.9}
          />
          {[0, 2, 4, 6, 8].map((t) => (
            <g key={`tick-${t}`}>
              <line
                x1={mapT(t)}
                x2={mapT(t)}
                y1={AX_Y - 3}
                y2={AX_Y + 3}
                stroke="rgb(var(--border))"
                strokeWidth={0.9}
              />
              <text
                x={mapT(t)}
                y={AX_Y + 14}
                textAnchor="middle"
                fontSize="7.5"
                fill="rgb(var(--muted))"
                fontFamily="var(--font-mono)"
                style={{
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                {t === 0 ? "0" : `${t}s`}
              </text>
            </g>
          ))}

          {/* ===== Footer ===== */}
          <text
            x={VB_W / 2}
            y={290}
            textAnchor="middle"
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            re-plan storm · single commit · open-loop tail
          </text>
        </svg>
      </div>
    </ChartFrame>
  );
}
