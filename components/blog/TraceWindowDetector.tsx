"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "./ChartFrame";

interface TraceWindowDetectorProps {
  caption: string;
  number?: string;
  meta?: string;
  cnnCeiling?: number;
  lstmFinal?: number;
  threshold?: number;
  seed?: number;
}

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 380;

// deterministic PRNG so SSR matches client
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

// Trace lanes layout
const TRACE_X = 60;
const TRACE_W = 540;
const SAMPLES = 90;
const LANE_H = 36;
const LANE_GAP = 6;

const LANES = [
  { id: "rsrp", label: "rsrp", note: "slow drift across full 90s" },
  { id: "retx", label: "retransmits", note: "clusters last 25s" },
  { id: "thermal", label: "thermal", note: "gradual climb" },
] as const;

const TRACE_Y = 28;
const DROP_X = TRACE_X + TRACE_W; // right edge of trace
const DROP_LABEL_Y = TRACE_Y - 10;

// Per-lane y positions
const laneTop = (i: number) => TRACE_Y + i * (LANE_H + LANE_GAP);
const laneMid = (i: number) => laneTop(i) + LANE_H / 2;
const laneBottom = (i: number) => laneTop(i) + LANE_H;

const TRACES_BOTTOM = laneBottom(LANES.length - 1);

// CNN row
const CNN_Y = TRACES_BOTTOM + 30;
const CNN_H = 50;
const CNN_WIN_W = 90; // ~15 of 90 samples
const GAUGE_X = 620;
const GAUGE_W = 60;
const GAUGE_H = 10;

// LSTM row
const LSTM_Y = CNN_Y + CNN_H + 28;
const LSTM_H = 50;
const LSTM_CELLS = 30;
const LSTM_CELL_W = (TRACE_W - (LSTM_CELLS - 1) * 2) / LSTM_CELLS;
const LSTM_CELL_H = 10;
const LSTM_CELL_Y = LSTM_Y + 22;

export function TraceWindowDetector({
  caption,
  number,
  meta = "90s window · cnn vs lstm",
  cnnCeiling = 0.74,
  lstmFinal = 0.88,
  threshold = 0.85,
  seed = 11,
}: TraceWindowDetectorProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // 0 idle · 1 traces fade in + drop pulse · 2 cnn slides · 3 cnn dim, lstm activates · 4 both frozen with final values
  const [phase, setPhase] = useState(0);
  const [cnnT, setCnnT] = useState(0); // 0..1 window slide
  const [lstmT, setLstmT] = useState(0); // 0..1 cells fill / gauge climb

  useEffect(() => {
    if (reduced) {
      setPhase(4);
      setCnnT(1);
      setLstmT(1);
      return;
    }
    if (!inView) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, p: number) =>
      timers.push(setTimeout(() => !cancelled && setPhase(p), ms));
    const run = () => {
      setPhase(0);
      setCnnT(0);
      setLstmT(0);
      at(200, 1);
      at(800, 2);
      at(4500, 3);
      at(7800, 4);
      timers.push(setTimeout(() => !cancelled && run(), 10500));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced]);

  // CNN window slide (phase === 2)
  useEffect(() => {
    if (reduced || phase !== 2) return;
    const start = performance.now();
    const dur = 3500;
    let raf = 0;
    const tick = (now: number) => {
      const tt = Math.min(1, (now - start) / dur);
      setCnnT(tt);
      if (tt < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reduced]);

  // LSTM fill (phase === 3)
  useEffect(() => {
    if (reduced || phase !== 3) return;
    const start = performance.now();
    const dur = 3000;
    let raf = 0;
    const tick = (now: number) => {
      const tt = Math.min(1, (now - start) / dur);
      setLstmT(tt);
      if (tt < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reduced]);

  // Precompute trace polylines once, keyed on seed
  const traces = useMemo(() => {
    const rnd = mulberry32(seed);
    // RSRP: slow downward drift with noise
    // retransmits: low until ~70%, then cluster
    // thermal: gradual climb with mild noise
    const rsrp: number[] = [];
    const retx: number[] = [];
    const thermal: number[] = [];
    for (let i = 0; i < SAMPLES; i++) {
      const t = i / (SAMPLES - 1);
      rsrp.push(0.22 + (1 - t) * 0.55 + (rnd() - 0.5) * 0.08);
      const burstWeight = t > 0.72 ? (t - 0.72) / 0.28 : 0;
      retx.push(
        0.15 +
          (rnd() - 0.5) * 0.06 +
          burstWeight * 0.7 * (0.5 + rnd() * 0.5)
      );
      thermal.push(0.2 + t * 0.55 + (rnd() - 0.5) * 0.05);
    }
    const lanes = [rsrp, retx, thermal];
    // build polyline points strings within lane bounds
    const polys = lanes.map((vals, laneIdx) => {
      const top = laneTop(laneIdx);
      const inner = LANE_H - 8; // padding
      return vals
        .map((v, i) => {
          const x = TRACE_X + (i / (SAMPLES - 1)) * TRACE_W;
          const y = top + 4 + (1 - Math.max(0, Math.min(1, v))) * inner;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
    });
    return { lanes, polys };
  }, [seed]);

  const show = (p: number) => phase >= p;

  // CNN window position
  const cnnWinX = TRACE_X + cnnT * (TRACE_W - CNN_WIN_W);

  // CNN gauge: jitters 0.5-0.7, spikes to ~0.74 near retransmit cluster
  const cnnGaugeValue = useMemo(() => {
    if (phase < 2) return 0;
    if (phase >= 3) return cnnCeiling;
    // map cnnT 0..1 to deterministic jitter via mulberry seeded by sample idx
    const idx = Math.floor(cnnT * 60);
    const rnd = mulberry32(seed + 200 + idx);
    const baseline = 0.55 + rnd() * 0.12;
    // burst when window overlaps last-25% retransmit cluster
    const windowRightFrac =
      (cnnWinX + CNN_WIN_W - TRACE_X) / TRACE_W;
    const inBurst = windowRightFrac > 0.85;
    return inBurst ? Math.min(cnnCeiling, baseline + 0.15) : baseline;
  }, [phase, cnnT, cnnCeiling, seed, cnnWinX]);

  const lstmGaugeValue = useMemo(() => {
    if (phase < 3) return 0;
    if (phase >= 4) return lstmFinal;
    // smooth ease climbing from 0.3 to lstmFinal
    const start = 0.3;
    const eased = 1 - Math.pow(1 - lstmT, 2);
    return start + (lstmFinal - start) * eased;
  }, [phase, lstmT, lstmFinal]);

  // LSTM cell fill count
  const lstmFilledCount = Math.floor(lstmT * LSTM_CELLS);

  const cnnDim = show(3);
  const lstmActive = show(3);

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
            A 90-second multivariate connectivity trace: RSRP drifts slowly
            downward across the whole window, retransmits cluster in the last
            25 seconds, thermal climbs gradually. A CNN&apos;s local receptive
            field slides across the trace and only spikes near the
            retransmit cluster, ceilinged around {Math.round(cnnCeiling * 100)}%
            confidence. An LSTM with attention consumes the same sequence
            left-to-right; its hidden-state cells progressively fill and
            attention concentrates on the slow RSRP drift, pushing confidence
            past the {Math.round(threshold * 100)}% deploy threshold to{" "}
            {Math.round(lstmFinal * 100)}%.
          </desc>
          <defs>
            <pattern
              id="twd-scanlines"
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
              id="twd-attn"
              width="3"
              height="3"
              patternUnits="userSpaceOnUse"
            >
              <rect width="3" height="3" fill="transparent" />
              <rect
                width="1"
                height="3"
                fill="rgb(var(--foreground))"
                opacity="0.18"
              />
            </pattern>
          </defs>

          {/* ══════════ TRACE LANES ══════════ */}
          <text
            x={TRACE_X}
            y={DROP_LABEL_Y}
            fontSize="8.5"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            telemetry · 90s window · 100ms cadence
          </text>

          {LANES.map((lane, i) => {
            const top = laneTop(i);
            return (
              <motion.g
                key={lane.id}
                initial={false}
                animate={{ opacity: show(1) ? 1 : 0 }}
                transition={{
                  duration: 0.5,
                  ease,
                  delay: reduced ? 0 : show(1) ? i * 0.1 : 0,
                }}
              >
                <rect
                  x={TRACE_X}
                  y={top}
                  width={TRACE_W}
                  height={LANE_H}
                  fill="url(#twd-scanlines)"
                />
                <rect
                  x={TRACE_X}
                  y={top}
                  width={TRACE_W}
                  height={LANE_H}
                  fill="rgb(var(--foreground) / 0.025)"
                  stroke="rgb(var(--border))"
                  strokeWidth={0.7}
                />
                <text
                  x={TRACE_X - 8}
                  y={laneMid(i) + 3}
                  textAnchor="end"
                  fontSize="8.5"
                  fill="rgb(var(--foreground) / 0.85)"
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
                >
                  {lane.label}
                </text>
                <polyline
                  points={traces.polys[i]}
                  fill="none"
                  stroke="rgb(var(--foreground) / 0.7)"
                  strokeWidth={1}
                />
              </motion.g>
            );
          })}

          {/* drop-event vertical marker at right edge */}
          <motion.g
            initial={false}
            animate={{
              opacity: show(1) ? 1 : 0,
            }}
            transition={{ duration: 0.4, ease }}
          >
            <motion.line
              x1={DROP_X}
              x2={DROP_X}
              y1={TRACE_Y - 4}
              y2={TRACES_BOTTOM + 4}
              stroke="rgb(var(--foreground))"
              strokeWidth={1.2}
              animate={
                phase === 1 && !reduced
                  ? { opacity: [0.4, 1, 0.6, 1, 0.6] }
                  : { opacity: 0.7 }
              }
              transition={{ duration: 1.2, ease }}
            />
            <text
              x={DROP_X + 6}
              y={TRACE_Y + 6}
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              drop
            </text>
            <text
              x={DROP_X + 6}
              y={TRACE_Y + 18}
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              event
            </text>
          </motion.g>

          {/* ══════════ CNN ROW ══════════ */}
          <motion.g
            initial={false}
            animate={{ opacity: show(2) ? (cnnDim ? 0.45 : 1) : 0 }}
            transition={{ duration: 0.4, ease }}
          >
            <text
              x={TRACE_X}
              y={CNN_Y - 6}
              fontSize="8.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              cnn · local receptive field
            </text>

            {/* CNN window box — sliding rect */}
            <rect
              x={cnnWinX}
              y={TRACE_Y - 2}
              width={CNN_WIN_W}
              height={TRACES_BOTTOM - TRACE_Y + 4}
              fill="rgb(var(--foreground) / 0.04)"
              stroke="rgb(var(--foreground) / 0.5)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />

            {/* CNN gauge label */}
            <text
              x={TRACE_X}
              y={CNN_Y + 16}
              fontSize="8"
              fill="rgb(var(--foreground) / 0.8)"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
            >
              p(drop) · jittery
            </text>

            {/* CNN gauge bar */}
            <rect
              x={GAUGE_X - 220}
              y={CNN_Y + 22}
              width={200}
              height={GAUGE_H}
              fill="rgb(var(--foreground) / 0.04)"
              stroke="rgb(var(--border))"
              strokeWidth={0.7}
            />
            <rect
              x={GAUGE_X - 220}
              y={CNN_Y + 22}
              width={200 * Math.min(1, cnnGaugeValue)}
              height={GAUGE_H}
              fill="rgb(var(--foreground) / 0.55)"
            />
            {/* threshold tick */}
            <line
              x1={GAUGE_X - 220 + 200 * threshold}
              x2={GAUGE_X - 220 + 200 * threshold}
              y1={CNN_Y + 19}
              y2={CNN_Y + 22 + GAUGE_H + 3}
              stroke="rgb(var(--foreground))"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
            <text
              x={GAUGE_X - 16}
              y={CNN_Y + 30}
              textAnchor="end"
              fontSize="10"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
            >
              {Math.round(cnnGaugeValue * 100)}%
            </text>
            <text
              x={GAUGE_X - 220}
              y={CNN_Y + 46}
              fontSize="7.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              ceiling ≈ {Math.round(cnnCeiling * 100)}% · misses slow drift
            </text>
          </motion.g>

          {/* ══════════ LSTM ROW ══════════ */}
          <motion.g
            initial={false}
            animate={{ opacity: lstmActive ? 1 : 0 }}
            transition={{ duration: 0.45, ease }}
          >
            <text
              x={TRACE_X}
              y={LSTM_Y - 6}
              fontSize="8.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              lstm · hidden state · attention over slow drift
            </text>

            {/* Attention overlay heat — applied across the trace lanes
                (rendered here so it sits visually under the LSTM row label).
                Concentrated on the long RSRP drift region (0..70% of width). */}
            {lstmActive && (
              <rect
                x={TRACE_X}
                y={laneTop(0) - 2}
                width={TRACE_W * 0.7}
                height={LANE_H + 4}
                fill="url(#twd-attn)"
                opacity={0.85}
              />
            )}

            {/* LSTM hidden-state cells, filling left to right */}
            {Array.from({ length: LSTM_CELLS }).map((_, idx) => {
              const x =
                TRACE_X + idx * (LSTM_CELL_W + 2);
              const filled = idx < lstmFilledCount || phase >= 4;
              const op = filled ? 0.25 + (idx / LSTM_CELLS) * 0.65 : 0.12;
              return (
                <rect
                  key={`lstm-cell-${idx}`}
                  x={x}
                  y={LSTM_CELL_Y}
                  width={LSTM_CELL_W}
                  height={LSTM_CELL_H}
                  fill="rgb(var(--foreground))"
                  opacity={op}
                />
              );
            })}

            {/* LSTM gauge bar */}
            <rect
              x={GAUGE_X - 220}
              y={LSTM_Y + 38}
              width={200}
              height={GAUGE_H}
              fill="rgb(var(--foreground) / 0.04)"
              stroke="rgb(var(--border))"
              strokeWidth={0.7}
            />
            <rect
              x={GAUGE_X - 220}
              y={LSTM_Y + 38}
              width={200 * Math.min(1, lstmGaugeValue)}
              height={GAUGE_H}
              fill="rgb(var(--foreground) / 0.9)"
            />
            <line
              x1={GAUGE_X - 220 + 200 * threshold}
              x2={GAUGE_X - 220 + 200 * threshold}
              y1={LSTM_Y + 35}
              y2={LSTM_Y + 38 + GAUGE_H + 3}
              stroke="rgb(var(--foreground))"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
            <text
              x={GAUGE_X - 16}
              y={LSTM_Y + 46}
              textAnchor="end"
              fontSize="10"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
            >
              {Math.round(lstmGaugeValue * 100)}%
            </text>
            <text
              x={GAUGE_X - 220}
              y={LSTM_Y + 62}
              fontSize="7.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              clears {Math.round(threshold * 100)}% threshold · catches long-horizon precursor
            </text>
          </motion.g>

          {/* threshold legend tick on both gauges */}
          <text
            x={GAUGE_X - 220 + 200 * threshold + 4}
            y={CNN_Y + 16}
            fontSize="7"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
            opacity={show(2) ? 0.8 : 0}
          >
            deploy · {Math.round(threshold * 100)}%
          </text>
        </svg>
      </div>
    </ChartFrame>
  );
}
