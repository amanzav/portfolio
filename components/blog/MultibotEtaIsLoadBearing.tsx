"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "./ChartFrame";

interface AblationRow {
  label: string;
  value: number;
  strong?: boolean;
}

interface MultibotEtaIsLoadBearingProps {
  caption: string;
  number?: string;
  meta?: string;
  rows?: AblationRow[];
  fullValue?: number;
  xMax?: number;
}

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 320;

const DEFAULT_ROWS: AblationRow[] = [
  { label: "full", value: 0.18 },
  { label: "no priority", value: 0.27 },
  { label: "no waypoint", value: 0.41 },
  { label: "no eta", value: 1.12, strong: true },
  { label: "baseline", value: 1.46, strong: true },
];

const ROW_YS = [80, 128, 176, 224, 272];
const BAR_X = 170;
const BAR_END = 560;
const BAR_H = 18;
const VALUE_X = 640;
const DELTA_X = 696;

// scale: 0..xMax → 0..(BAR_END-BAR_X) px
const xBar = (v: number, xMax: number) =>
  BAR_X + (v / xMax) * (BAR_END - BAR_X);

export function MultibotEtaIsLoadBearing({
  caption,
  number,
  meta = "200 runs · deadlocks per 5-min run",
  rows = DEFAULT_ROWS,
  fullValue = 0.18,
  xMax = 1.6,
}: MultibotEtaIsLoadBearingProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // phase 1 idle · 2 bars grow · 3 highlight no-eta · 4 highlight baseline + connector · 5 footer
  const [phase, setPhase] = useState(1);
  const [progress, setProgress] = useState(0); // 0..1 for bar fill + counters

  useEffect(() => {
    if (reduced) {
      setPhase(5);
      setProgress(1);
      return;
    }
    if (!inView) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, p: number) =>
      timers.push(setTimeout(() => !cancelled && setPhase(p), ms));
    const run = () => {
      setPhase(1);
      setProgress(0);
      at(400, 2);
      at(1700, 3);
      at(2900, 4);
      at(4100, 5);
      timers.push(setTimeout(() => !cancelled && run(), 7500));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced]);

  // animate progress 0 → 1 when phase >= 2
  useEffect(() => {
    if (reduced) return;
    if (phase < 2) {
      setProgress(0);
      return;
    }
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reduced]);

  const fullX = xBar(fullValue, xMax);

  // for connector between no-eta (row 3, idx 3) and baseline (idx 4)
  const noEtaIdx = 3;
  const baselineIdx = 4;
  const noEtaEndX = xBar(rows[noEtaIdx].value, xMax);
  const baselineEndX = xBar(rows[baselineIdx].value, xMax);
  const noEtaRowY = ROW_YS[noEtaIdx];
  const baselineRowY = ROW_YS[baselineIdx];

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
            Ablation chart: deadlocks per 5-minute run with one intent field
            removed at a time. The full message averages 0.18 deadlocks per
            run. Removing priority or next_waypoint barely moves the number.
            Removing eta_intersection jumps deadlocks to 1.12 — roughly 80%
            of the way back to the 1.46 baseline that uses no intent topic at
            all.
          </desc>
          <defs>
            <pattern
              id="mb-eta-scanlines"
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

          {/* ===== Header ===== */}
          <text
            x={24}
            y={22}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            08 · ablation
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
            200 runs · deadlocks per 5-min run
          </text>
          <text
            x={24}
            y={40}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.14em" }}
          >
            removed field → deadlocks/run
          </text>

          {/* ===== Reference dashed line at full=0.18 ===== */}
          <line
            x1={fullX}
            x2={fullX}
            y1={62}
            y2={290}
            stroke="rgb(var(--foreground) / 0.45)"
            strokeWidth={0.9}
            strokeDasharray="3 3"
          />
          <text
            x={fullX + 6}
            y={58}
            fontSize="7"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            full · {fullValue.toFixed(2)}
          </text>

          {/* ===== Rows ===== */}
          {rows.map((row, i) => {
            const rowY = ROW_YS[i];
            const barCenterY = rowY;
            const barTopY = rowY - BAR_H / 2;
            const fullBarW = xBar(row.value, xMax) - BAR_X;
            const animatedW = fullBarW * progress;
            const animatedVal = row.value * progress;
            const isNoEta = i === noEtaIdx;
            const isBaseline = i === baselineIdx;
            const highlightNoEta = isNoEta && phase >= 3;
            const highlightBaseline = isBaseline && phase >= 4;
            const highlight = highlightNoEta || highlightBaseline;
            return (
              <g key={`row-${i}`}>
                {/* row label */}
                <text
                  x={24}
                  y={rowY + 4}
                  fontSize="9"
                  fill={
                    row.strong
                      ? "rgb(var(--foreground))"
                      : "rgb(var(--foreground) / 0.65)"
                  }
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
                >
                  {row.label}
                </text>
                {/* bar track */}
                <rect
                  x={BAR_X}
                  y={barTopY}
                  width={BAR_END - BAR_X}
                  height={BAR_H}
                  fill="rgb(var(--foreground) / 0.02)"
                  stroke="rgb(var(--border))"
                  strokeWidth={0.6}
                />
                {/* bar fill */}
                <motion.rect
                  x={BAR_X}
                  y={barTopY}
                  width={animatedW}
                  height={BAR_H}
                  fill={
                    highlight
                      ? "rgb(var(--foreground) / 0.18)"
                      : row.strong
                      ? "rgb(var(--foreground) / 0.1)"
                      : "rgb(var(--foreground) / 0.06)"
                  }
                  initial={false}
                  animate={{
                    stroke: highlight
                      ? "rgb(var(--foreground))"
                      : "rgb(var(--border))",
                    opacity: highlight ? [1, 0.7, 1] : 1,
                  }}
                  transition={{ duration: 0.45, ease }}
                  strokeWidth={highlight ? 1.2 : 0.9}
                />
                {/* numeric value */}
                <text
                  x={VALUE_X}
                  y={rowY + 5}
                  textAnchor="end"
                  fontSize="12"
                  fill={
                    row.strong
                      ? "rgb(var(--foreground))"
                      : "rgb(var(--foreground) / 0.7)"
                  }
                  fontFamily="var(--font-mono)"
                >
                  {animatedVal.toFixed(2)}
                </text>
                {/* delta col */}
                <text
                  x={DELTA_X}
                  y={rowY + 5}
                  textAnchor="end"
                  fontSize="8"
                  fill="rgb(var(--muted))"
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.1em" }}
                >
                  {i === 0
                    ? "—"
                    : `+${(row.value - rows[0].value).toFixed(2)}`}
                </text>
                {/* inline annotation for no-eta */}
                {isNoEta && (
                  <motion.text
                    x={xBar(row.value, xMax) + 8}
                    y={rowY + 4}
                    fontSize="8"
                    fill="rgb(var(--foreground))"
                    fontFamily="var(--font-mono)"
                    style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
                    initial={false}
                    animate={{ opacity: phase >= 3 ? 1 : 0 }}
                    transition={{ duration: 0.4, ease }}
                  >
                    ~80% of the gain
                  </motion.text>
                )}
              </g>
            );
          })}

          {/* ===== Connector between no-eta and baseline (phase >= 4) ===== */}
          <motion.g
            initial={false}
            animate={{ opacity: phase >= 4 ? 1 : 0 }}
            transition={{ duration: 0.5, ease }}
          >
            {/* vertical-ish connector linking right edges of the two strong bars */}
            <line
              x1={noEtaEndX}
              y1={noEtaRowY + BAR_H / 2 + 2}
              x2={baselineEndX}
              y2={baselineRowY - BAR_H / 2 - 2}
              stroke="rgb(var(--foreground) / 0.55)"
              strokeWidth={0.8}
              strokeDasharray="2 2"
            />
            <text
              x={baselineEndX + 8}
              y={(noEtaRowY + baselineRowY) / 2 + 3}
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.12em" }}
            >
              0.34 → baseline
            </text>
          </motion.g>

          {/* ===== Footer ===== */}
          <motion.text
            x={VB_W / 2}
            y={VB_H - 10}
            textAnchor="middle"
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            initial={false}
            animate={{ opacity: phase >= 5 ? 1 : 0.4 }}
            transition={{ duration: 0.5, ease }}
          >
            priority barely moves the needle
          </motion.text>
        </svg>
      </div>
    </ChartFrame>
  );
}
