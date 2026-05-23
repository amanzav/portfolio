"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "@/components/blog/primitives/ChartFrame";

interface TennisCoverageGapProps {
  caption: string;
  number?: string;
  meta?: string;
  /** Cells (col, row) that should be highlighted as the gap. Default: ad-side
   *  baseline near the net's right end. */
  gapCells?: Array<[number, number]>;
  /** 6-row × 9-col matrix in [0,1]. Default deterministically generated. */
  grid?: number[][];
}

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 340;

// Court rectangle in viewBox coords
const COURT = { x: 120, y: 70, w: 480, h: 220 };
const COLS = 9;
const ROWS = 6;
const CELL_W = COURT.w / COLS;       // ~53.33
const CELL_H = COURT.h / ROWS;       // ~36.67
const NET_X = COURT.x + COURT.w / 2; // 360 (column boundary between 4 and 5)

// Default ad-side baseline gap: rows 5..6 (=indices 4,5), cols 7..8 (=indices 6,7).
// Player perspective: deuce on the left (cols 0..3), ad on the right (cols 5..8).
const DEFAULT_GAP: Array<[number, number]> = [
  [7, 5],
  [8, 5],
];

// deterministic PRNG so SSR + client agree
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

// Build a 6×9 matrix biased to the deuce side (left 4 cols high), with the gap
// cells forced near zero. Returns rows[row][col].
function buildDefaultGrid(gap: Array<[number, number]>) {
  const rnd = mulberry32(31);
  const rows: number[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < COLS; c++) {
      let v: number;
      if (c <= 3) {
        // deuce side — high coverage, slight noise
        v = 0.68 + rnd() * 0.28;
      } else if (c === 4) {
        // center column — moderate
        v = 0.45 + rnd() * 0.25;
      } else {
        // ad side — moderate
        v = 0.4 + rnd() * 0.28;
      }
      // baseline rows (top and bottom) slightly higher than mid
      if (r === 0 || r === ROWS - 1) v = Math.min(1, v + 0.05);
      // mid rows (3,4) slightly less covered
      if (r === 2 || r === 3) v = Math.max(0.25, v - 0.1);
      row.push(Math.max(0, Math.min(1, v)));
    }
    rows.push(row);
  }
  // force gap cells near-zero
  gap.forEach(([c, r]) => {
    if (rows[r] && rows[r][c] !== undefined) rows[r][c] = 0.06;
  });
  return rows;
}

export function TennisCoverageGap({
  caption,
  number,
  meta = "9 × 6 grid · 14 matches",
  gapCells = DEFAULT_GAP,
  grid,
}: TennisCoverageGapProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // phase: 0 idle · 1 court only · 2 cells fade in row-by-row
  //        · 3 non-gap cells dim, gap cells outlined · 4 bracket + label
  //        · 5 "deuce-side bias" sub-note
  const [phase, setPhase] = useState(0);

  const matrix = useMemo(
    () => grid ?? buildDefaultGrid(gapCells),
    [grid, gapCells]
  );

  const gapSet = useMemo(() => {
    const s = new Set<string>();
    gapCells.forEach(([c, r]) => s.add(`${c}-${r}`));
    return s;
  }, [gapCells]);

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
      at(800, 2);
      at(3000, 3);
      at(4200, 4);
      at(5400, 5);
      timers.push(setTimeout(() => !cancelled && run(), 8000));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced]);

  const show = (p: number) => phase >= p;

  // Bracket pointing at the rightmost gap cell from outside the court.
  const lastGap = gapCells[gapCells.length - 1];
  const gapCx = COURT.x + (lastGap[0] + 0.5) * CELL_W;
  const gapCy = COURT.y + (lastGap[1] + 0.5) * CELL_H;
  const bracketPath = `M${COURT.x + COURT.w + 14},${gapCy - 14} L${COURT.x + COURT.w + 4},${gapCy - 14} L${COURT.x + COURT.w + 4},${gapCy + 14} L${COURT.x + COURT.w + 14},${gapCy + 14}`;
  const arrowFromX = COURT.x + COURT.w + 4;
  const arrowToX = gapCx + CELL_W * 0.45;

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
            A 9×6 court-coverage heatmap accumulated over 220 rallies and 14
            matches. Cells encode time spent in each zone; the left (deuce)
            side runs noticeably hotter than the right (ad) side, and a 1.4
            meter hole sits at the ad-side baseline that opponents have been
            exploiting.
          </desc>
          <defs>
            <pattern
              id="tcg-scanlines"
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
            y={24}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            08 · coverage heatmap
          </text>
          <text
            x={VB_W - 24}
            y={24}
            textAnchor="end"
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            220 rallies · 14 matches
          </text>

          {/* sub-header: grid spec */}
          <text
            x={VB_W / 2}
            y={58}
            textAnchor="middle"
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            9 × 6 grid
          </text>

          {/* side labels above court (deuce / net / ad) */}
          <text
            x={240}
            y={82}
            textAnchor="middle"
            fontSize="7.5"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            deuce
          </text>
          <text
            x={360}
            y={82}
            textAnchor="middle"
            fontSize="7"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            net
          </text>
          <text
            x={480}
            y={82}
            textAnchor="middle"
            fontSize="7.5"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            ad
          </text>

          {/* ===== Court background ===== */}
          <rect
            x={COURT.x}
            y={COURT.y}
            width={COURT.w}
            height={COURT.h}
            fill="url(#tcg-scanlines)"
          />
          <rect
            x={COURT.x}
            y={COURT.y}
            width={COURT.w}
            height={COURT.h}
            fill="rgb(var(--foreground) / 0.02)"
            stroke="rgb(var(--border))"
            strokeWidth={0.9}
          />

          {/* faint service boxes */}
          <line
            x1={COURT.x}
            y1={COURT.y + COURT.h / 4}
            x2={COURT.x + COURT.w}
            y2={COURT.y + COURT.h / 4}
            stroke="rgb(var(--border))"
            strokeWidth={0.5}
            opacity={0.4}
          />
          <line
            x1={COURT.x}
            y1={COURT.y + (COURT.h * 3) / 4}
            x2={COURT.x + COURT.w}
            y2={COURT.y + (COURT.h * 3) / 4}
            stroke="rgb(var(--border))"
            strokeWidth={0.5}
            opacity={0.4}
          />

          {/* net (vertical) */}
          <line
            x1={NET_X}
            y1={COURT.y}
            x2={NET_X}
            y2={COURT.y + COURT.h}
            stroke="rgb(var(--foreground))"
            strokeWidth={0.9}
            opacity={0.55}
          />

          {/* ===== Heatmap cells ===== */}
          {matrix.map((row, r) =>
            row.map((v, c) => {
              const isGap = gapSet.has(`${c}-${r}`);
              // base target opacity = data value
              const baseOpacity = v * 0.85;
              // in phase 3+, non-gap cells dim (max 0.65)
              const dimmedOpacity = Math.min(0.65, baseOpacity);
              const cellOpacity = show(2)
                ? show(3) && !isGap
                  ? dimmedOpacity
                  : baseOpacity
                : 0;
              return (
                <g key={`cell-${r}-${c}`}>
                  <motion.rect
                    x={COURT.x + c * CELL_W}
                    y={COURT.y + r * CELL_H}
                    width={CELL_W}
                    height={CELL_H}
                    fill="rgb(var(--foreground))"
                    initial={false}
                    animate={{ opacity: cellOpacity }}
                    transition={{
                      duration: reduced ? 0 : 0.45,
                      ease,
                      delay: reduced
                        ? 0
                        : show(2)
                        ? r * 0.08 + c * 0.01
                        : 0,
                    }}
                  />
                  {isGap && (
                    <motion.rect
                      x={COURT.x + c * CELL_W + 0.5}
                      y={COURT.y + r * CELL_H + 0.5}
                      width={CELL_W - 1}
                      height={CELL_H - 1}
                      fill="none"
                      stroke="rgb(var(--foreground))"
                      strokeWidth={1}
                      strokeDasharray="3 2"
                      initial={false}
                      animate={{ opacity: show(3) ? 1 : 0 }}
                      transition={{
                        duration: 0.4,
                        ease,
                        delay: show(3) ? 0.1 : 0,
                      }}
                    />
                  )}
                </g>
              );
            })
          )}

          {/* grid lines on top (very faint) */}
          {Array.from({ length: COLS + 1 }).map((_, i) => (
            <line
              key={`gl-v-${i}`}
              x1={COURT.x + i * CELL_W}
              y1={COURT.y}
              x2={COURT.x + i * CELL_W}
              y2={COURT.y + COURT.h}
              stroke="rgb(var(--border))"
              strokeWidth={0.3}
              opacity={0.5}
            />
          ))}
          {Array.from({ length: ROWS + 1 }).map((_, i) => (
            <line
              key={`gl-h-${i}`}
              x1={COURT.x}
              y1={COURT.y + i * CELL_H}
              x2={COURT.x + COURT.w}
              y2={COURT.y + i * CELL_H}
              stroke="rgb(var(--border))"
              strokeWidth={0.3}
              opacity={0.5}
            />
          ))}

          {/* baseline label below court */}
          <text
            x={360}
            y={302}
            textAnchor="middle"
            fontSize="7"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            baseline (mine)
          </text>

          {/* ===== Bracket + gap label ===== */}
          <motion.path
            d={bracketPath}
            fill="none"
            stroke="rgb(var(--foreground))"
            strokeWidth={1}
            initial={false}
            animate={{ pathLength: show(4) ? 1 : 0, opacity: show(4) ? 1 : 0 }}
            transition={{ duration: 0.6, ease }}
          />
          {/* arrow from bracket inward to gap */}
          <motion.line
            x1={arrowFromX}
            y1={gapCy}
            x2={arrowToX}
            y2={gapCy}
            stroke="rgb(var(--foreground))"
            strokeWidth={1}
            initial={false}
            animate={{ opacity: show(4) ? 0.85 : 0 }}
            transition={{ duration: 0.4, ease, delay: show(4) ? 0.4 : 0 }}
          />
          <motion.polyline
            points={`${arrowToX + 5},${gapCy - 3} ${arrowToX},${gapCy} ${arrowToX + 5},${gapCy + 3}`}
            fill="none"
            stroke="rgb(var(--foreground))"
            strokeWidth={1}
            initial={false}
            animate={{ opacity: show(4) ? 0.85 : 0 }}
            transition={{ duration: 0.4, ease, delay: show(4) ? 0.5 : 0 }}
          />
          {/* label below the court, right-aligned, clear of every cell */}
          <motion.text
            x={696}
            y={302}
            textAnchor="end"
            fontSize="8.5"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
            initial={false}
            animate={{ opacity: show(4) ? 1 : 0 }}
            transition={{ duration: 0.4, ease, delay: show(4) ? 0.6 : 0 }}
          >
            1.4 m gap · ad-side baseline
          </motion.text>

          {/* ===== Legend (opacity gradient bar) ===== */}
          <g>
            {Array.from({ length: 6 }).map((_, i) => {
              const op = 0.12 + (i / 5) * 0.78;
              return (
                <rect
                  key={`leg-${i}`}
                  x={260 + i * 33}
                  y={310}
                  width={33}
                  height={8}
                  fill="rgb(var(--foreground))"
                  opacity={op}
                />
              );
            })}
            <rect
              x={260}
              y={310}
              width={200}
              height={8}
              fill="none"
              stroke="rgb(var(--border))"
              strokeWidth={0.6}
            />
            <text
              x={252}
              y={316}
              textAnchor="end"
              fontSize="7"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              low
            </text>
            <text
              x={468}
              y={316}
              fontSize="7"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              high
            </text>
          </g>

          {/* footer / sub-note */}
          <motion.text
            x={VB_W / 2}
            y={VB_H - 8}
            textAnchor="middle"
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
            initial={false}
            animate={{ opacity: show(5) ? 1 : 0 }}
            transition={{ duration: 0.5, ease }}
          >
            biased to deuce side · 1.4 m hole opponents exploit
          </motion.text>
        </svg>
      </div>
    </ChartFrame>
  );
}
