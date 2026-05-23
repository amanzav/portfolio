"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "./ChartFrame";

interface SyncDirtySetProps {
  caption: string;
  number?: string;
  meta?: string;
}

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 360;

// ─── Intake row (horizontal, top) ─────────────────────────────
const SRC   = { x: 20,  y: 30, w: 80, h: 30 };
const DIRTY = { x: 120, y: 30, w: 80, h: 30 };
const BATCH = { x: 220, y: 30, w: 80, h: 30 };

// ─── Cache stack (centered under batch) ───────────────────────
const STACK_CX = BATCH.x + BATCH.w / 2; // 260

type CacheLayout = {
  id: "memory" | "redis" | "postgres";
  label: string;
  sub: string;
  hitRate: string;
  hitNote: string;
  y: number; // box top
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  gap: number;
};

const CACHES: CacheLayout[] = [
  {
    id: "memory",
    label: "memory",
    sub: "process · 3 of 12 cols",
    hitRate: "~90% hits",
    hitNote: "returned",
    y: 110,
    cols: 3, rows: 3,
    cellW: 26, cellH: 8, gap: 2,
  },
  {
    id: "redis",
    label: "redis",
    sub: "shared · 3 of 12 cols",
    hitRate: "~9% hits",
    hitNote: "returned",
    y: 180,
    cols: 3, rows: 5,
    cellW: 26, cellH: 8, gap: 2,
  },
  {
    id: "postgres",
    label: "postgres",
    sub: "source · 12 of 12 cols",
    hitRate: "<1%",
    hitNote: "cold fetch",
    y: 280,
    cols: 12, rows: 7,
    cellW: 24, cellH: 7, gap: 2,
  },
];

function cacheWidth(c: CacheLayout) {
  return c.cols * c.cellW + (c.cols - 1) * c.gap;
}
function cacheHeight(c: CacheLayout) {
  return c.rows * c.cellH + (c.rows - 1) * c.gap;
}
function cacheX(c: CacheLayout) {
  return STACK_CX - cacheWidth(c) / 2;
}
function cellRect(c: CacheLayout, idx: number) {
  const col = idx % c.cols;
  const row = Math.floor(idx / c.cols);
  return {
    x: cacheX(c) + col * (c.cellW + c.gap),
    y: c.y + row * (c.cellH + c.gap),
    w: c.cellW,
    h: c.cellH,
  };
}
function cellCenter(c: CacheLayout, idx: number) {
  const r = cellRect(c, idx);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

// ─── Request probes ───────────────────────────────────────────
type RequestSpec = {
  dest: "memory" | "redis" | "postgres";
  cellIdx: number;
  triggerT: number;
};

const REQUESTS: RequestSpec[] = [
  { dest: "memory",   cellIdx: 0,  triggerT: 0.04 },
  { dest: "memory",   cellIdx: 4,  triggerT: 0.11 },
  { dest: "memory",   cellIdx: 7,  triggerT: 0.18 },
  { dest: "redis",    cellIdx: 5,  triggerT: 0.25 },
  { dest: "memory",   cellIdx: 2,  triggerT: 0.32 },
  { dest: "memory",   cellIdx: 5,  triggerT: 0.39 },
  { dest: "memory",   cellIdx: 8,  triggerT: 0.46 },
  { dest: "postgres", cellIdx: 51, triggerT: 0.53 },
  { dest: "memory",   cellIdx: 1,  triggerT: 0.61 },
  { dest: "redis",    cellIdx: 11, triggerT: 0.68 },
  { dest: "memory",   cellIdx: 3,  triggerT: 0.75 },
  { dest: "memory",   cellIdx: 6,  triggerT: 0.82 },
  { dest: "memory",   cellIdx: 4,  triggerT: 0.89 },
];

const TRAVEL_T = 0.07;
const LIT_T = 0.08;

function layoutFor(id: "memory" | "redis" | "postgres"): CacheLayout {
  const l = CACHES.find((c) => c.id === id);
  if (!l) throw new Error("unknown cache");
  return l;
}

export function SyncDirtySet({
  caption,
  number,
  meta = "200K rows · nightly",
}: SyncDirtySetProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  const [phase, setPhase] = useState(0);
  const [t, setT] = useState(0);

  useEffect(() => {
    if (reduced) {
      setPhase(3);
      setT(1);
      return;
    }
    if (!inView) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, p: number) =>
      timers.push(setTimeout(() => !cancelled && setPhase(p), ms));
    const run = () => {
      setPhase(0);
      setT(0);
      at(200, 1);
      at(1200, 2);
      at(8000, 3);
      timers.push(setTimeout(() => !cancelled && run(), 11500));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced]);

  useEffect(() => {
    if (reduced || phase !== 2) return;
    const start = performance.now();
    const dur = 6600;
    let raf = 0;
    const tick = (now: number) => {
      const tt = Math.min(1, (now - start) / dur);
      setT(tt);
      if (tt < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reduced]);

  const show = (p: number) => phase >= p;

  const batchExitX = BATCH.x + BATCH.w / 2;
  const batchExitY = BATCH.y + BATCH.h;

  // payoff card positioned far right
  const PAYOFF = { x: 488, y: 22, w: 212, h: 78 };

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
            A nightly sync funnels 200K rows through a dirty-set that drops
            194K unchanged ones; the survivors are batched 50 at a time, and
            each row lookup probes a cache hierarchy. Process memory (small,
            projected to 3 of 12 columns) absorbs about 90% of reads. Redis
            (shared, same projection) absorbs about 9%. Postgres holds the
            full 12-column source of truth and is almost never touched. The
            same job that took 52 minutes per-row finishes in 3 minutes — a
            17× speedup driven by dirty-set, batching, projection, and
            layered caching.
          </desc>
          <defs>
            <pattern id="syn-scan" width="2" height="3" patternUnits="userSpaceOnUse">
              <rect width="2" height="3" fill="transparent" />
              <rect width="2" height="1" fill="rgb(var(--foreground))" opacity="0.03" />
            </pattern>
          </defs>

          {/* ═════════════════ INTAKE (horizontal, top-left) ═════════════════ */}
          <motion.text
            x={SRC.x}
            y={SRC.y - 10}
            fontSize="9"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            initial={false}
            animate={{ opacity: show(1) ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          >
            intake · nightly
          </motion.text>

          <motion.g
            initial={false}
            animate={{ opacity: show(1) ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          >
            {/* source */}
            <rect x={SRC.x} y={SRC.y} width={SRC.w} height={SRC.h} fill="url(#syn-scan)" />
            <rect
              x={SRC.x}
              y={SRC.y}
              width={SRC.w}
              height={SRC.h}
              fill="rgb(var(--foreground) / 0.035)"
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
            />
            <text
              x={SRC.x + SRC.w / 2}
              y={SRC.y + 13}
              textAnchor="middle"
              fontSize="9"
              fill="rgb(var(--foreground) / 0.85)"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              source
            </text>
            <text
              x={SRC.x + SRC.w / 2}
              y={SRC.y + 25}
              textAnchor="middle"
              fontSize="7.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
            >
              200K rows
            </text>

            {/* arrow source → dirty */}
            <line
              x1={SRC.x + SRC.w}
              y1={SRC.y + SRC.h / 2}
              x2={DIRTY.x - 4}
              y2={DIRTY.y + DIRTY.h / 2}
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
            />
            <polyline
              points={`${DIRTY.x - 8},${DIRTY.y + DIRTY.h / 2 - 3} ${DIRTY.x - 4},${DIRTY.y + DIRTY.h / 2} ${DIRTY.x - 8},${DIRTY.y + DIRTY.h / 2 + 3}`}
              fill="none"
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
            />

            {/* dirty-set */}
            <rect
              x={DIRTY.x}
              y={DIRTY.y}
              width={DIRTY.w}
              height={DIRTY.h}
              fill="rgb(var(--foreground) / 0.06)"
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
            />
            <text
              x={DIRTY.x + DIRTY.w / 2}
              y={DIRTY.y + 13}
              textAnchor="middle"
              fontSize="9"
              fill="rgb(var(--foreground) / 0.85)"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              dirty-set
            </text>
            <text
              x={DIRTY.x + DIRTY.w / 2}
              y={DIRTY.y + 25}
              textAnchor="middle"
              fontSize="7.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
            >
              skip 194K
            </text>

            {/* arrow dirty → batch */}
            <line
              x1={DIRTY.x + DIRTY.w}
              y1={DIRTY.y + DIRTY.h / 2}
              x2={BATCH.x - 4}
              y2={BATCH.y + BATCH.h / 2}
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
            />
            <polyline
              points={`${BATCH.x - 8},${BATCH.y + BATCH.h / 2 - 3} ${BATCH.x - 4},${BATCH.y + BATCH.h / 2} ${BATCH.x - 8},${BATCH.y + BATCH.h / 2 + 3}`}
              fill="none"
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
            />

            {/* batch */}
            <rect
              x={BATCH.x}
              y={BATCH.y}
              width={BATCH.w}
              height={BATCH.h}
              fill="rgb(var(--foreground) / 0.06)"
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
            />
            <text
              x={BATCH.x + BATCH.w / 2}
              y={BATCH.y + 13}
              textAnchor="middle"
              fontSize="9"
              fill="rgb(var(--foreground) / 0.85)"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              batch
            </text>
            <text
              x={BATCH.x + BATCH.w / 2}
              y={BATCH.y + 25}
              textAnchor="middle"
              fontSize="7.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
            >
              50 / call
            </text>

            {/* arrow batch ↓ to cache stack */}
            <line
              x1={batchExitX}
              y1={batchExitY}
              x2={batchExitX}
              y2={CACHES[0].y - 22}
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
            />
            <polyline
              points={`${batchExitX - 3},${CACHES[0].y - 26} ${batchExitX},${CACHES[0].y - 22} ${batchExitX + 3},${CACHES[0].y - 26}`}
              fill="none"
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
            />
            <text
              x={batchExitX + 7}
              y={(batchExitY + CACHES[0].y - 22) / 2 + 3}
              fontSize="7.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              per-row read
            </text>
          </motion.g>

          {/* ═════════════════ CACHE STACK ═════════════════ */}
          {CACHES.map((c, ci) => {
            const cw = cacheWidth(c);
            const ch = cacheHeight(c);
            const cx = cacheX(c);
            return (
              <motion.g
                key={c.id}
                initial={false}
                animate={{ opacity: show(1) ? 1 : 0 }}
                transition={{
                  duration: 0.4,
                  ease,
                  delay: show(1) ? 0.15 + ci * 0.12 : 0,
                }}
              >
                {/* centered label + sub above the cache */}
                <text
                  x={STACK_CX}
                  y={c.y - 18}
                  textAnchor="middle"
                  fontSize="10"
                  fill="rgb(var(--foreground) / 0.9)"
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
                >
                  {c.label}
                </text>
                <text
                  x={STACK_CX}
                  y={c.y - 6}
                  textAnchor="middle"
                  fontSize="7.5"
                  fill="rgb(var(--muted))"
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
                >
                  {c.sub}
                </text>

                {/* enclosing storage rect — generous padding */}
                <rect
                  x={cx - 6}
                  y={c.y - 3}
                  width={cw + 12}
                  height={ch + 6}
                  fill="rgb(var(--foreground) / 0.025)"
                  stroke="rgb(var(--border))"
                  strokeWidth={0.8}
                />

                {/* baseline cells */}
                {Array.from({ length: c.cols * c.rows }).map((_, idx) => {
                  const r = cellRect(c, idx);
                  return (
                    <rect
                      key={`${c.id}-bg-${idx}`}
                      x={r.x}
                      y={r.y}
                      width={r.w}
                      height={r.h}
                      fill="rgb(var(--foreground))"
                      opacity={0.22}
                    />
                  );
                })}

                {/* hit-rate annotation to the right of the cache */}
                <text
                  x={cx + cw + 18}
                  y={c.y + ch / 2 - 2}
                  fontSize="13"
                  fill="rgb(var(--foreground))"
                  fontFamily="var(--font-mono)"
                >
                  {c.hitRate}
                </text>
                <text
                  x={cx + cw + 18}
                  y={c.y + ch / 2 + 12}
                  fontSize="7.5"
                  fill="rgb(var(--muted))"
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
                >
                  {c.hitNote}
                </text>

                {/* miss arrow + label to next cache */}
                {ci < CACHES.length - 1 &&
                  (() => {
                    const next = CACHES[ci + 1];
                    const ax = STACK_CX;
                    const y1 = c.y + ch + 4;
                    const y2 = next.y - 24;
                    return (
                      <g>
                        <line
                          x1={ax}
                          y1={y1}
                          x2={ax}
                          y2={y2}
                          stroke="rgb(var(--border))"
                          strokeWidth={0.9}
                          strokeDasharray="3 3"
                        />
                        <polyline
                          points={`${ax - 3},${y2 - 4} ${ax},${y2} ${ax + 3},${y2 - 4}`}
                          fill="none"
                          stroke="rgb(var(--border))"
                          strokeWidth={0.9}
                        />
                        <text
                          x={ax + 8}
                          y={(y1 + y2) / 2 + 3}
                          fontSize="7.5"
                          fill="rgb(var(--muted))"
                          fontFamily="var(--font-mono)"
                          style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
                        >
                          miss
                        </text>
                      </g>
                    );
                  })()}
              </motion.g>
            );
          })}

          {/* ═════════════════ REQUEST PROBES ═════════════════ */}
          {show(2) &&
            !reduced &&
            REQUESTS.map((req, i) => {
              const layout = layoutFor(req.dest);
              const target = cellCenter(layout, req.cellIdx);
              const localT = (t - req.triggerT) / TRAVEL_T;
              const litT = (t - (req.triggerT + TRAVEL_T)) / LIT_T;

              const dotVisible = localT >= 0 && localT <= 1;
              const litVisible = litT >= 0 && litT <= 1;
              if (!dotVisible && !litVisible) return null;

              return (
                <g key={`req-${i}`}>
                  {dotVisible &&
                    (() => {
                      const moveT = Math.max(0, Math.min(1, localT));
                      const x = batchExitX + (target.x - batchExitX) * moveT;
                      const y = batchExitY + (target.y - batchExitY) * moveT;
                      const op =
                        moveT < 0.1
                          ? (moveT / 0.1) * 0.9
                          : moveT > 0.92
                          ? ((1 - moveT) / 0.08) * 0.9
                          : 0.9;
                      return (
                        <circle
                          cx={x}
                          cy={y}
                          r={2.4}
                          fill="rgb(var(--foreground))"
                          opacity={Math.max(0, op)}
                        />
                      );
                    })()}
                  {litVisible &&
                    (() => {
                      const r = cellRect(layout, req.cellIdx);
                      const fade = 1 - litT;
                      const op = fade * 0.85;
                      return (
                        <rect
                          x={r.x}
                          y={r.y}
                          width={r.w}
                          height={r.h}
                          fill="rgb(var(--foreground))"
                          opacity={op}
                        />
                      );
                    })()}
                </g>
              );
            })}

          {/* Sample lit cells for reduced-motion users */}
          {reduced && (
            <g>
              {[0, 4, 7].map((idx) => {
                const r = cellRect(CACHES[0], idx);
                return (
                  <rect
                    key={`rm-m-${idx}`}
                    x={r.x}
                    y={r.y}
                    width={r.w}
                    height={r.h}
                    fill="rgb(var(--foreground))"
                    opacity={0.7}
                  />
                );
              })}
              {[5, 11].map((idx) => {
                const r = cellRect(CACHES[1], idx);
                return (
                  <rect
                    key={`rm-r-${idx}`}
                    x={r.x}
                    y={r.y}
                    width={r.w}
                    height={r.h}
                    fill="rgb(var(--foreground))"
                    opacity={0.7}
                  />
                );
              })}
              {[51].map((idx) => {
                const r = cellRect(CACHES[2], idx);
                return (
                  <rect
                    key={`rm-p-${idx}`}
                    x={r.x}
                    y={r.y}
                    width={r.w}
                    height={r.h}
                    fill="rgb(var(--foreground))"
                    opacity={0.7}
                  />
                );
              })}
            </g>
          )}

          {/* ═════════════════ PAYOFF (top right) ═════════════════ */}
          <motion.g
            initial={false}
            animate={{ opacity: show(1) ? 1 : 0 }}
            transition={{ duration: 0.5, ease, delay: show(1) ? 0.5 : 0 }}
          >
            <rect
              x={PAYOFF.x}
              y={PAYOFF.y}
              width={PAYOFF.w}
              height={PAYOFF.h}
              fill="rgb(var(--foreground) / 0.04)"
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
            />
            <text
              x={PAYOFF.x + 14}
              y={PAYOFF.y + 18}
              fontSize="9"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              nightly sync
            </text>
            <text
              x={PAYOFF.x + 14}
              y={PAYOFF.y + 48}
              fontSize="24"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
            >
              52 → 3 min
            </text>
            <text
              x={PAYOFF.x + 14}
              y={PAYOFF.y + 68}
              fontSize="11"
              fill="rgb(var(--foreground) / 0.75)"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.12em" }}
            >
              17× speedup
            </text>
          </motion.g>
        </svg>
      </div>
    </ChartFrame>
  );
}
