"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "./ChartFrame";

interface AutoparkScenarioGridProps {
  caption: string;
  number?: string;
  meta?: string;
  rmseCm?: number;
  rubricCm?: number;
  successCount?: number;
  timeoutCount?: number;
  seed?: number;
}

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 300;

// deterministic PRNG so SSR and client agree
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

// Plot axis x in [80, 680], error in cm in [0, 30]
const AX_X0 = 80;
const AX_X1 = 680;
const AX_Y = 210;
const ERR_MAX_CM = 30;
const mapErr = (cm: number) =>
  AX_X0 + (Math.min(ERR_MAX_CM, Math.max(0, cm)) / ERR_MAX_CM) * (AX_X1 - AX_X0);

// y band for jitter
const Y_BAND_TOP = 80;
const Y_BAND_BOT = 190;

interface Scenario {
  i: number;
  errCm: number;
  approachDeg: 0 | 15 | 30 | 45;
  y: number;
  opacity: number;
}

const APPROACHES: ReadonlyArray<0 | 15 | 30 | 45> = [0, 15, 30, 45];
const OPACITY_BY_APPROACH: Record<number, number> = {
  0: 0.95,
  15: 0.85,
  30: 0.7,
  45: 0.55,
};

function generateScenarios(
  seed: number,
  successCount: number,
  rmseCm: number,
  rubricCm: number
): Scenario[] {
  const rnd = mulberry32(seed);
  const list: Scenario[] = [];
  for (let i = 0; i < successCount; i++) {
    // sample error from a half-normal-ish distribution centered on a target so
    // RMSE of the cloud is roughly rmseCm
    const u = rnd();
    const v = rnd();
    // Box-Muller, half-normal
    const z = Math.abs(Math.sqrt(-2 * Math.log(u + 1e-9)) * Math.cos(2 * Math.PI * v));
    // scale so RMSE ≈ rmseCm; multiply by rmseCm because E[|N(0,σ²)|²] = σ²
    let errCm = z * rmseCm;
    // clamp so points stay inside the rubric — these are "successful" only
    if (errCm > rubricCm - 1) errCm = rubricCm - 1 - rnd() * 2;
    if (errCm < 0.4) errCm = 0.4 + rnd() * 0.6;
    const approach = APPROACHES[Math.floor(rnd() * APPROACHES.length)];
    const yJ = Y_BAND_TOP + 6 + rnd() * (Y_BAND_BOT - Y_BAND_TOP - 12);
    list.push({
      i,
      errCm,
      approachDeg: approach,
      y: yJ,
      opacity: OPACITY_BY_APPROACH[approach],
    });
  }
  // sort by error for left-to-right stagger
  list.sort((a, b) => a.errCm - b.errCm);
  return list.map((s, idx) => ({ ...s, i: idx }));
}

export function AutoparkScenarioGrid({
  caption,
  number,
  meta = "8.1 cm rmse · 52 scenarios",
  rmseCm = 8.1,
  rubricCm = 25,
  successCount = 49,
  timeoutCount = 3,
  seed = 11,
}: AutoparkScenarioGridProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // phase 0 idle · 1 axis + big card · 2 dots fade in · 3 rmse drops · 4 timeouts cluster
  const [phase, setPhase] = useState(0);

  const scenarios = useMemo(
    () => generateScenarios(seed, successCount, rmseCm, rubricCm),
    [seed, successCount, rmseCm, rubricCm]
  );

  // timeouts — start positions along axis (just above), end positions stacked right
  const timeouts = useMemo(() => {
    const rnd = mulberry32(seed + 999);
    return Array.from({ length: timeoutCount }, (_, i) => {
      const startX = AX_X0 + 40 + rnd() * (AX_X1 - AX_X0 - 80);
      const startY = AX_Y - 6;
      const endX = 695;
      const endY = 95 + i * 20;
      return { i, startX, startY, endX, endY };
    });
  }, [timeoutCount, seed]);

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
      at(200, 1);
      at(900, 2);
      at(3500, 3);
      at(4800, 4);
      timers.push(setTimeout(() => !cancelled && run(), 7800));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced]);

  const show = (p: number) => phase >= p;

  const rmseX = mapErr(rmseCm);

  // Axis ticks — include the rmseCm tick rendered heavier
  const ticks: Array<{ v: number; label: string; heavy?: boolean; note?: string }> = [
    { v: 0, label: "0" },
    { v: 5, label: "5" },
    { v: rmseCm, label: rmseCm.toFixed(1), heavy: true },
    { v: 15, label: "15" },
    { v: rubricCm, label: `${rubricCm}`, note: "rubric" },
  ];

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
            A scatter of {successCount + timeoutCount} CARLA scenarios plotted
            by final-pose error in centimetres. The {successCount} successful
            completions cluster left of the {rubricCm} cm rubric, with an RMSE
            of {rmseCm} cm marked by a dashed line. {timeoutCount} 45° wet-
            shoulder scenarios timed out and are stacked separately on the
            right — honestly excluded from the RMSE average.
          </desc>
          <defs>
            <pattern
              id="asg-scanlines"
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
            06 · validation
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
            {successCount + timeoutCount} scenarios
          </text>

          {/* ===== Big RMSE card top-right ===== */}
          <motion.g
            initial={false}
            animate={{ opacity: show(1) ? 1 : 0, x: show(1) ? 0 : 8 }}
            transition={{ duration: 0.5, ease }}
          >
            <rect
              x={520}
              y={40}
              width={160}
              height={40}
              fill="rgb(var(--foreground) / 0.05)"
              stroke="rgb(var(--foreground))"
              strokeWidth={1}
            />
            <text
              x={534}
              y={64}
              fontSize="22"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
            >
              {rmseCm.toFixed(1)} cm
            </text>
            <text
              x={672}
              y={76}
              textAnchor="end"
              fontSize="7"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              final-pose rmse
            </text>
          </motion.g>

          {/* ===== Axis (drawn phase 1+) ===== */}
          <motion.g
            initial={false}
            animate={{ opacity: show(1) ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          >
            <line
              x1={AX_X0}
              x2={AX_X1}
              y1={AX_Y}
              y2={AX_Y}
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
            />
            {ticks.map((tk) => (
              <g key={`tick-${tk.v}`}>
                <line
                  x1={mapErr(tk.v)}
                  x2={mapErr(tk.v)}
                  y1={AX_Y - 3}
                  y2={AX_Y + 3}
                  stroke="rgb(var(--border))"
                  strokeWidth={tk.heavy ? 1.2 : 0.9}
                />
                <text
                  x={mapErr(tk.v)}
                  y={AX_Y + 14}
                  textAnchor="middle"
                  fontSize={tk.heavy ? "8.5" : "7.5"}
                  fill={
                    tk.heavy
                      ? "rgb(var(--foreground))"
                      : "rgb(var(--muted))"
                  }
                  fontFamily="var(--font-mono)"
                  style={{
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  {tk.label} cm
                </text>
                {tk.note && (
                  <text
                    x={mapErr(tk.v)}
                    y={AX_Y + 26}
                    textAnchor="middle"
                    fontSize="7"
                    fill="rgb(var(--muted))"
                    fontFamily="var(--font-mono)"
                    style={{
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                    }}
                  >
                    {tk.note}
                  </text>
                )}
              </g>
            ))}
          </motion.g>

          {/* ===== Scatter dots ===== */}
          {scenarios.map((s) => {
            const cx = mapErr(s.errCm);
            return (
              <motion.circle
                key={`dot-${s.i}`}
                cx={cx}
                cy={s.y}
                r={2.6}
                fill="rgb(var(--foreground))"
                initial={false}
                animate={{
                  opacity: show(2) ? s.opacity : 0,
                  scale: show(2) ? 1 : 0.4,
                }}
                transition={{
                  duration: 0.35,
                  ease,
                  delay: reduced ? 0 : show(2) ? 0.03 * s.i : 0,
                }}
                style={{ transformOrigin: `${cx}px ${s.y}px` }}
              />
            );
          })}

          {/* ===== RMSE dashed line (phase 3+) ===== */}
          <motion.line
            x1={rmseX}
            x2={rmseX}
            y1={70}
            y2={200}
            stroke="rgb(var(--foreground))"
            strokeWidth={1.2}
            strokeDasharray="4 3"
            pathLength={1}
            initial={false}
            animate={{
              opacity: show(3) ? 1 : 0,
              pathLength: show(3) ? 1 : 0,
            }}
            transition={{ duration: reduced ? 0 : 0.7, ease }}
          />
          <motion.text
            x={rmseX}
            y={62}
            textAnchor="middle"
            fontSize="8"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            initial={false}
            animate={{ opacity: show(3) ? 1 : 0 }}
            transition={{ duration: 0.4, ease, delay: show(3) ? 0.3 : 0 }}
          >
            {rmseCm} cm rmse · n={successCount} successes
          </motion.text>

          {/* ===== Timed-out scenarios (phase 4) ===== */}
          {timeouts.map((t) => (
            <motion.g
              key={`timeout-${t.i}`}
              initial={false}
              animate={{
                cx: show(4) ? t.endX : t.startX,
                cy: show(4) ? t.endY : t.startY,
                opacity: show(4) ? 1 : show(2) ? 0.4 : 0,
              }}
              transition={{
                duration: 0.7,
                ease,
                delay: reduced ? 0 : show(4) ? t.i * 0.12 : 0,
              }}
            >
              <motion.circle
                r={4}
                fill="rgb(var(--background))"
                stroke="rgb(var(--foreground))"
                strokeWidth={1.1}
                initial={false}
                animate={{
                  cx: show(4) ? t.endX : t.startX,
                  cy: show(4) ? t.endY : t.startY,
                }}
                transition={{
                  duration: 0.7,
                  ease,
                  delay: reduced ? 0 : show(4) ? t.i * 0.12 : 0,
                }}
              />
              <motion.g
                initial={false}
                animate={{
                  x: show(4) ? t.endX : t.startX,
                  y: show(4) ? t.endY : t.startY,
                }}
                transition={{
                  duration: 0.7,
                  ease,
                  delay: reduced ? 0 : show(4) ? t.i * 0.12 : 0,
                }}
              >
                <line
                  x1={-2}
                  y1={-2}
                  x2={2}
                  y2={2}
                  stroke="rgb(var(--foreground))"
                  strokeWidth={1}
                />
                <line
                  x1={-2}
                  y1={2}
                  x2={2}
                  y2={-2}
                  stroke="rgb(var(--foreground))"
                  strokeWidth={1}
                />
              </motion.g>
            </motion.g>
          ))}

          {/* timed-out cluster label */}
          <motion.text
            x={690}
            y={155}
            textAnchor="end"
            fontSize="7.5"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            initial={false}
            animate={{ opacity: show(4) ? 1 : 0 }}
            transition={{ duration: 0.4, ease, delay: show(4) ? 0.6 : 0 }}
          >
            {timeoutCount} timed out · 45° wet
          </motion.text>

          {/* ===== Opacity legend (bottom-left) ===== */}
          <motion.g
            initial={false}
            animate={{ opacity: show(2) ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          >
            <text
              x={24}
              y={250}
              fontSize="7"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              approach
            </text>
            {APPROACHES.map((ang, idx) => {
              const xL = 24 + idx * 48;
              return (
                <g key={`leg-${ang}`}>
                  <circle
                    cx={xL + 6}
                    cy={266}
                    r={2.6}
                    fill="rgb(var(--foreground))"
                    opacity={OPACITY_BY_APPROACH[ang]}
                  />
                  <text
                    x={xL + 14}
                    y={269}
                    fontSize="7"
                    fill="rgb(var(--muted))"
                    fontFamily="var(--font-mono)"
                    style={{ letterSpacing: "0.14em" }}
                  >
                    {ang}°
                  </text>
                </g>
              );
            })}
          </motion.g>

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
            successful completions only · honest exclusions visible
          </text>
        </svg>
      </div>
    </ChartFrame>
  );
}
