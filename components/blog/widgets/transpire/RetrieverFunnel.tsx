"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { ChartFrame } from "@/components/blog/primitives/ChartFrame";

interface RetrieverFunnelProps {
  caption: string;
  number?: string;
  meta?: string;
  poolCount?: number;
  topK?: number;
  shortlistCount?: number;
  seed?: number;
  showCode?: boolean;
  codeCaption?: string;
}

const ease = [0.22, 1, 0.36, 1] as const;

const CODE = [
  "def score_candidates(job, pool):",
  "    job_vec = bi_encoder.encode_job(job)            # (d,)",
  "    cand_vecs = bi_encoder.encode_candidates(pool)  # (N, d)",
  "    coarse = cand_vecs @ job_vec                    # (N,)",
  "    top200 = pool[np.argpartition(-coarse, 200)[:200]]",
  "    fine = cross_encoder.score_pairs(job, top200)   # (200,)",
  "    return top200[np.argsort(-fine)]",
];

// phase → highlighted code line indices (0-based)
const CODE_HL: Record<number, number[]> = {
  1: [2], // pool appears → encode candidates
  2: [1, 3], // embed/score → encode job + coarse dot product
  3: [4], // cut to top 200 → argpartition
  4: [5], // cross-encoder → score_pairs
  5: [6], // re-rank → argsort / return
};

// deterministic PRNG so SSR and client markup match
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

const VB_W = 720;
const VB_H = 320;

export function RetrieverFunnel({
  caption,
  number,
  meta = "12M pairs · top-200 cut",
  poolCount = 72,
  topK = 200,
  shortlistCount = 7,
  seed = 7,
  showCode = false,
  codeCaption = "Two-stage scoring, highlighted as the diagram runs",
}: RetrieverFunnelProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // phase: 0 idle · 1 pool · 2 embed/sort · 3 cull · 4 bars · 5 reorder+accent
  const [phase, setPhase] = useState(0);

  // looping phase machine
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
      at(300, 1);
      at(1100, 2);
      at(2300, 3);
      at(3400, 4);
      at(4300, 5);
      timers.push(setTimeout(() => !cancelled && run(), 8000));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced]);

  const dots = useMemo(() => {
    const rnd = mulberry32(seed);
    const survivorCutoff = 0.82;
    return Array.from({ length: poolCount }, () => {
      const score = rnd();
      return {
        scatterX: 150 + rnd() * 210,
        scatterY: 44 + rnd() * 232,
        axisX: 180 + score * 230,
        axisY: 160 + (rnd() - 0.5) * 70,
        score,
        survivor: score >= survivorCutoff,
      };
    });
  }, [poolCount, seed]);

  const bars = useMemo(() => {
    const rnd = mulberry32(seed + 99);
    const items = Array.from({ length: shortlistCount }, (_, i) => ({
      id: i,
      score: 0.35 + rnd() * 0.6,
      initialSlot: 0,
    }));
    const shuffled = [...items.map((b) => b.id)].sort(() => rnd() - 0.5);
    shuffled.forEach((id, slot) => {
      items[id].initialSlot = slot;
    });
    const finalRank = new Map<number, number>();
    [...items]
      .sort((a, b) => b.score - a.score)
      .forEach((b, rank) => finalRank.set(b.id, rank));
    return items.map((b) => ({ ...b, finalRank: finalRank.get(b.id)! }));
  }, [shortlistCount, seed]);

  const slotY = (slot: number) => 64 + slot * 28;
  const show = (p: number) => phase >= p;
  const activeLines = reduced ? [] : CODE_HL[phase] ?? [];

  return (
    <>
      <ChartFrame caption={caption} number={number} meta={meta}>
        <div ref={ref}>
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="chart-svg w-full"
            role="img"
            aria-label={caption}
          >
            <desc>
              Two-stage retriever: a bi-encoder scores the full candidate pool
              and keeps the top {topK}; a cross-encoder re-ranks those into a
              final shortlist.
            </desc>
            <defs>
              <pattern
                id="retriever-scanlines"
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

            {/* JOB node */}
            <g>
              <rect
                x={20}
                y={132}
                width={96}
                height={56}
                fill="url(#retriever-scanlines)"
              />
              <rect
                x={20}
                y={132}
                width={96}
                height={56}
                fill="rgb(var(--foreground) / 0.035)"
                stroke="rgb(var(--border))"
                strokeWidth={0.9}
              />
              <text
                x={30}
                y={150}
                fontSize="8.5"
                fill="rgb(var(--muted))"
                fontFamily="var(--font-mono)"
                style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
              >
                input
              </text>
              <text
                x={30}
                y={167}
                fontSize="11"
                fill="rgb(var(--foreground))"
                fontFamily="var(--font-mono)"
              >
                job desc
              </text>
            </g>

            {/* embedding axis */}
            <motion.line
              x1={170}
              x2={420}
              y1={160}
              y2={160}
              stroke="rgb(var(--border))"
              strokeWidth={0.7}
              strokeDasharray="2 5"
              initial={false}
              animate={{ opacity: show(2) ? 0.6 : 0 }}
              transition={{ duration: 0.5, ease }}
            />

            {/* job → axis pulse */}
            <motion.line
              x1={116}
              x2={180}
              y1={160}
              y2={160}
              stroke="rgb(var(--foreground))"
              strokeWidth={1}
              initial={false}
              animate={{ opacity: show(2) ? [0, 0.7, 0.25] : 0 }}
              transition={{ duration: 0.8, ease }}
            />

            {/* cutoff line */}
            <motion.g
              initial={false}
              animate={{ opacity: show(3) && !show(4) ? 1 : show(3) ? 0.4 : 0 }}
              transition={{ duration: 0.5, ease }}
            >
              <line
                x1={372}
                x2={372}
                y1={60}
                y2={270}
                stroke="rgb(var(--foreground))"
                strokeDasharray="4 6"
                strokeWidth={0.8}
                opacity={0.6}
              />
              <text
                x={372}
                y={52}
                textAnchor="middle"
                fontSize="9"
                fill="rgb(var(--muted))"
                fontFamily="var(--font-mono)"
                style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
              >
                top {topK}
              </text>
            </motion.g>

            {/* candidate dots */}
            {dots.map((d, i) => {
              const atAxis = show(2);
              const culled = show(3) && !d.survivor;
              const cx = atAxis ? d.axisX : d.scatterX;
              const cy = atAxis ? d.axisY : d.scatterY;
              const opacity = culled
                ? 0
                : show(3) && d.survivor
                ? 0.9
                : show(2)
                ? 0.55
                : show(1)
                ? 0.4
                : 0;
              return (
                <motion.circle
                  key={i}
                  r={2.2}
                  fill="rgb(var(--foreground))"
                  initial={false}
                  animate={{
                    cx,
                    cy: culled ? cy + 28 : cy,
                    opacity,
                  }}
                  transition={{
                    duration: reduced ? 0 : 0.9,
                    ease,
                    delay: reduced ? 0 : atAxis && !show(3) ? (i % 12) * 0.02 : 0,
                  }}
                />
              );
            })}

            {/* shortlist bars */}
            {bars.map((b) => {
              const len = 36 + b.score * 130;
              const y = slotY(show(5) ? b.finalRank : b.initialSlot);
              const isTop = b.finalRank === 0;
              const accent = show(5) && isTop;
              return (
                <motion.g
                  key={b.id}
                  initial={false}
                  animate={{
                    opacity: show(4) ? 1 : 0,
                    y: y - slotY(b.initialSlot),
                  }}
                  transition={{ duration: reduced ? 0 : 0.6, ease }}
                >
                  <rect
                    x={520}
                    y={slotY(b.initialSlot)}
                    width={len}
                    height={14}
                    fill={
                      accent
                        ? "rgb(var(--foreground) / 0.85)"
                        : "rgb(var(--foreground) / 0.4)"
                    }
                  />
                  <rect
                    x={520}
                    y={slotY(b.initialSlot)}
                    width={len}
                    height={2}
                    fill="rgb(var(--foreground))"
                    opacity={accent ? 0.9 : 0.5}
                  />
                  {accent && (
                    <text
                      x={520 + len + 6}
                      y={slotY(b.initialSlot) + 11}
                      fontSize="8.5"
                      fill="rgb(var(--foreground))"
                      fontFamily="var(--font-mono)"
                      style={{
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                      }}
                    >
                      pick
                    </text>
                  )}
                </motion.g>
              );
            })}

            {/* stage labels */}
            <motion.text
              x={250}
              y={300}
              textAnchor="middle"
              fontSize="9"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
              initial={false}
              animate={{ opacity: show(2) ? 1 : 0 }}
              transition={{ duration: 0.5, ease }}
            >
              stage 1 · bi-encoder · scores the pool
            </motion.text>
            <motion.text
              x={590}
              y={300}
              textAnchor="middle"
              fontSize="9"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
              initial={false}
              animate={{ opacity: show(4) ? 1 : 0 }}
              transition={{ duration: 0.5, ease }}
            >
              stage 2 · cross-encoder · re-ranks
            </motion.text>
          </svg>
        </div>
      </ChartFrame>

      {showCode && (
        <div className="-mt-4 mb-10">
          <div className="relative border border-border bg-background/85 pixel-corners">
            <div className="flex items-center justify-between border-b border-border bg-foreground/[0.02] px-4 py-2 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-muted">
              <span>python</span>
              <span className="text-foreground/40">{"// "}synced to diagram</span>
            </div>
            <pre className="overflow-x-auto py-4 font-mono text-[0.78rem] leading-6 text-foreground/85 md:text-[0.82rem]">
              <code>
                {CODE.map((line, i) => (
                  <div
                    key={i}
                    className={cn(
                      "border-l-2 px-4 transition-colors duration-300",
                      activeLines.includes(i)
                        ? "border-foreground/70 bg-foreground/[0.09] text-foreground"
                        : "border-transparent"
                    )}
                  >
                    <span className="whitespace-pre">{line || " "}</span>
                  </div>
                ))}
              </code>
            </pre>
            <span className="blog-figure-corner" aria-hidden />
          </div>
          <p className="mt-3 truncate text-center font-mono text-[0.58rem] uppercase tracking-[0.16em] text-muted">
            {codeCaption}
          </p>
        </div>
      )}
    </>
  );
}
