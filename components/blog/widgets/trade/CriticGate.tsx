"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "@/components/blog/primitives/ChartFrame";

interface TradeCriticGateProps {
  caption: string;
  number?: string;
  meta?: string;
  rejectedPct?: number;
  revisedPct?: number;
  acceptedPct?: number;
  preHitRate?: number;
  postHitRate?: number;
  seed?: number;
}

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 280;

// deterministic PRNG so SSR and client agree on dot jitter
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

// ── Layout ───────────────────────────────────────────────────────────────
// LEFT pool of 100 dots in a 10 × 10 grid    x = 24..156
// MIDDLE critic box                          x = 196..360, y = 120..200
// RIGHT three outcome bins                   x = 400..696
const POOL = { x: 24, y: 56, w: 132, h: 180, cols: 10, rows: 10 };
const CRITIC = { x: 196, y: 120, w: 164, h: 80 };
const BIN_X = 400;
const BIN_W = 296;
const BIN_H = 50;
const BIN_REJ_Y = 70;
const BIN_REV_Y = 130;
const BIN_ACC_Y = 190;

export function TradeCriticGate({
  caption,
  number,
  meta = "n=100 · −38% rejected · +7pp hit rate",
  rejectedPct = 38,
  revisedPct = 15,
  acceptedPct = 47,
  preHitRate = 51,
  postHitRate = 58,
  seed = 13,
}: TradeCriticGateProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // phase: 0 idle (pool full, bins empty) · 1 critic lights · 2 dots stream
  //        through critic · 3 dots fan to bins, counters tick ·
  //        4 ACCEPTED bin strokes thicken; REJ/REV dim · 5 bottom strip
  const [phase, setPhase] = useState(0);
  const [tallyRej, setTallyRej] = useState(0);
  const [tallyRev, setTallyRev] = useState(0);
  const [tallyAcc, setTallyAcc] = useState(0);

  // 100 deterministic dots, each with an outcome pre-assigned by threshold
  const dots = useMemo(() => {
    const rnd = mulberry32(seed);
    return Array.from({ length: 100 }, (_, i) => {
      const col = i % POOL.cols;
      const row = Math.floor(i / POOL.cols);
      const px = POOL.x + 8 + col * 12;
      const py = POOL.y + 8 + row * 16;
      const outcome: "rej" | "rev" | "acc" =
        i < rejectedPct
          ? "rej"
          : i < rejectedPct + revisedPct
          ? "rev"
          : "acc";
      const jitter = (rnd() - 0.5) * 3;
      return { i, px, py, outcome, jitter };
    });
  }, [seed, rejectedPct, revisedPct]);

  // Target dot positions inside each bin — packed right-of-label, well clear
  // of the big counter number on the far right.
  const binTargetFor = (i: number, outcome: "rej" | "rev" | "acc") => {
    const sameOutcome = dots.filter((d) => d.outcome === outcome);
    const idx = sameOutcome.findIndex((d) => d.i === i);
    const COLS = 16;
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const baseY =
      outcome === "rej" ? BIN_REJ_Y : outcome === "rev" ? BIN_REV_Y : BIN_ACC_Y;
    return {
      x: BIN_X + 122 + col * 8,
      y: baseY + 18 + row * 7,
    };
  };

  useEffect(() => {
    if (reduced) {
      setPhase(5);
      setTallyRej(rejectedPct);
      setTallyRev(revisedPct);
      setTallyAcc(acceptedPct);
      return;
    }
    if (!inView) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, p: number) =>
      timers.push(setTimeout(() => !cancelled && setPhase(p), ms));
    const run = () => {
      setPhase(0);
      setTallyRej(0);
      setTallyRev(0);
      setTallyAcc(0);
      at(350, 1);
      at(900, 2);
      at(2200, 3);
      at(3400, 4);
      at(4100, 5);
      timers.push(setTimeout(() => !cancelled && run(), 8000));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced, rejectedPct, revisedPct, acceptedPct]);

  // Counters tick during phase 3
  useEffect(() => {
    if (reduced) return;
    if (phase < 3) {
      setTallyRej(0);
      setTallyRev(0);
      setTallyAcc(0);
      return;
    }
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setTallyRej(Math.round(rejectedPct * eased));
      setTallyRev(Math.round(revisedPct * eased));
      setTallyAcc(Math.round(acceptedPct * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reduced, rejectedPct, revisedPct, acceptedPct]);

  const show = (p: number) => phase >= p;

  const criticCx = CRITIC.x + CRITIC.w / 2;
  const criticCy = CRITIC.y + CRITIC.h / 2;
  const criticLeftX = CRITIC.x;
  const criticRightX = CRITIC.x + CRITIC.w;

  // Dot position given phase
  const dotPosition = (d: (typeof dots)[number]) => {
    if (show(3)) return binTargetFor(d.i, d.outcome);
    if (show(2)) {
      // streaming pool → critic center; stagger keeps it readable
      return {
        x: criticCx + d.jitter * 0.5,
        y: criticCy + d.jitter,
      };
    }
    return { x: d.px, y: d.py };
  };

  const dotOpacity = (d: (typeof dots)[number]) => {
    if (!show(3)) return 0.7;
    if (show(4)) {
      if (d.outcome === "rej") return 0.35;
      if (d.outcome === "rev") return 0.55;
      return 0.95;
    }
    return 0.8;
  };

  const bins = [
    {
      key: "rej",
      y: BIN_REJ_Y,
      label: "rejected",
      count: tallyRej,
      total: rejectedPct,
      strong: false,
    },
    {
      key: "rev",
      y: BIN_REV_Y,
      label: "revised",
      count: tallyRev,
      total: revisedPct,
      strong: false,
    },
    {
      key: "acc",
      y: BIN_ACC_Y,
      label: "accepted",
      count: tallyAcc,
      total: acceptedPct,
      strong: true,
    },
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
            A 100-thesis batch streamed through the adversary critic. The
            critic rejects {rejectedPct}, sends {revisedPct} back for revision,
            and accepts {acceptedPct}. The downstream hit rate lifts from{" "}
            {preHitRate}% to {postHitRate}%, a smaller accepted set but
            materially better.
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

          {/* ── Column headers ──────────────────────────────────── */}
          <text
            x={24}
            y={22}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            100 theses · pre-critic
          </text>
          <text
            x={196}
            y={22}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            critic verdict
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
            downstream pool
          </text>

          {/* ── Pool outline ───────────────────────────────────── */}
          <rect
            x={POOL.x}
            y={POOL.y}
            width={POOL.w}
            height={POOL.h}
            fill="url(#tcg-scanlines)"
          />
          <rect
            x={POOL.x}
            y={POOL.y}
            width={POOL.w}
            height={POOL.h}
            fill="rgb(var(--foreground) / 0.025)"
            stroke="rgb(var(--border))"
            strokeWidth={0.8}
          />

          {/* connector pool → critic */}
          <line
            x1={POOL.x + POOL.w}
            x2={criticLeftX}
            y1={POOL.y + POOL.h / 2}
            y2={criticCy}
            stroke="rgb(var(--border))"
            strokeWidth={0.7}
            opacity={0.55}
          />

          {/* ── Critic box ─────────────────────────────────────── */}
          <motion.g
            initial={false}
            animate={{ opacity: show(1) ? 1 : 0.3 }}
            transition={{ duration: 0.45, ease }}
          >
            <rect
              x={CRITIC.x}
              y={CRITIC.y}
              width={CRITIC.w}
              height={CRITIC.h}
              fill="url(#tcg-scanlines)"
            />
            <motion.rect
              x={CRITIC.x}
              y={CRITIC.y}
              width={CRITIC.w}
              height={CRITIC.h}
              fill="rgb(var(--foreground) / 0.05)"
              stroke="rgb(var(--foreground))"
              strokeWidth={1.1}
              animate={
                phase === 2 && !reduced
                  ? { opacity: [1, 0.55, 1] }
                  : { opacity: 1 }
              }
              transition={{ duration: 0.7, ease, repeat: phase === 2 ? 1 : 0 }}
            />
            <text
              x={criticCx}
              y={CRITIC.y + 22}
              textAnchor="middle"
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
            >
              adversary
            </text>
            <text
              x={criticCx}
              y={CRITIC.y + 42}
              textAnchor="middle"
              fontSize="13"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
            >
              critic
            </text>
            <text
              x={criticCx}
              y={CRITIC.y + 60}
              textAnchor="middle"
              fontSize="7.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              claude · higher T
            </text>
          </motion.g>

          {/* connectors critic → each bin */}
          {[BIN_REJ_Y, BIN_REV_Y, BIN_ACC_Y].map((by, idx) => (
            <line
              key={`fan-${idx}`}
              x1={criticRightX}
              y1={criticCy}
              x2={BIN_X}
              y2={by + BIN_H / 2}
              stroke="rgb(var(--border))"
              strokeWidth={0.6}
              opacity={0.5}
            />
          ))}

          {/* ── Outcome bins ───────────────────────────────────── */}
          {bins.map((b, idx) => {
            const dimmed = show(4) && b.key !== "acc";
            const highlighted = show(4) && b.key === "acc";
            const labelColor =
              b.key === "rej"
                ? "rgb(var(--foreground) / 0.55)"
                : b.key === "rev"
                ? "rgb(var(--foreground) / 0.75)"
                : "rgb(var(--foreground))";
            const countColor = dimmed
              ? "rgb(var(--foreground) / 0.55)"
              : "rgb(var(--foreground))";
            return (
              <motion.g
                key={b.key}
                initial={false}
                animate={{
                  opacity: show(1) ? (dimmed ? 0.5 : 1) : 0,
                }}
                transition={{
                  duration: 0.45,
                  ease,
                  delay: reduced ? 0 : 0.1 + idx * 0.07,
                }}
              >
                <rect
                  x={BIN_X}
                  y={b.y}
                  width={BIN_W}
                  height={BIN_H}
                  fill="url(#tcg-scanlines)"
                />
                <motion.rect
                  x={BIN_X}
                  y={b.y}
                  width={BIN_W}
                  height={BIN_H}
                  fill={
                    highlighted
                      ? "rgb(var(--foreground) / 0.08)"
                      : "rgb(var(--foreground) / 0.03)"
                  }
                  stroke={
                    highlighted
                      ? "rgb(var(--foreground))"
                      : "rgb(var(--border))"
                  }
                  strokeWidth={highlighted ? 1.4 : 0.9}
                  initial={false}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, ease }}
                />
                <text
                  x={BIN_X + 14}
                  y={b.y + 22}
                  fontSize="10"
                  fill={labelColor}
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
                >
                  {b.label}
                </text>
                <text
                  x={BIN_X + 14}
                  y={b.y + 38}
                  fontSize="14"
                  fill={countColor}
                  fontFamily="var(--font-mono)"
                >
                  {b.count}
                </text>
              </motion.g>
            );
          })}

          {/* ── Dots ───────────────────────────────────────────── */}
          {dots.map((d) => {
            const pos = dotPosition(d);
            return (
              <motion.circle
                key={`dot-${d.i}`}
                r={1.6}
                fill="rgb(var(--foreground))"
                initial={false}
                animate={{
                  cx: pos.x,
                  cy: pos.y,
                  opacity: dotOpacity(d),
                }}
                transition={{
                  duration: reduced ? 0 : 0.7,
                  ease,
                  delay: reduced
                    ? 0
                    : show(3)
                    ? (d.i % 12) * 0.04
                    : show(2)
                    ? (d.i % 12) * 0.04
                    : 0,
                }}
              />
            );
          })}

          {/* ── Bottom payoff strip ───────────────────────────── */}
          <motion.g
            initial={false}
            animate={{ opacity: show(5) ? 1 : 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <text
              x={24}
              y={262}
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
            >
              hit rate
            </text>
            <text
              x={120}
              y={266}
              fontSize="15"
              fill="rgb(var(--foreground) / 0.6)"
              fontFamily="var(--font-mono)"
            >
              {preHitRate}%
            </text>
            <text
              x={200}
              y={266}
              fontSize="14"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
            >
              →
            </text>
            <text
              x={246}
              y={266}
              fontSize="15"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
            >
              {postHitRate}%
            </text>
            <rect
              x={320}
              y={250}
              width={68}
              height={20}
              fill="rgb(var(--foreground) / 0.08)"
              stroke="rgb(var(--foreground))"
              strokeWidth={0.9}
            />
            <text
              x={354}
              y={264}
              textAnchor="middle"
              fontSize="9"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              +{postHitRate - preHitRate}pp
            </text>
            <text
              x={696}
              y={266}
              textAnchor="end"
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              smaller set · better signal
            </text>
          </motion.g>
        </svg>
      </div>
    </ChartFrame>
  );
}
