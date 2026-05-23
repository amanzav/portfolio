"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "@/components/blog/primitives/ChartFrame";

interface TriageRoutingAnimationProps {
  caption: string;
  number?: string;
  meta?: string;
  rigCount?: number;
  eventsPerHour?: number;
  reviewTimeBefore?: string;
  reviewTimeAfter?: string;
  laneMix?: { crash: number; leak: number; threading: number; other: number };
}

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 320;

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

// rig grid geometry
const RIG_X0 = 24;
const RIG_Y0 = 80;
const RIG_COLS = 10;
const RIG_ROWS = 3;
const RIG_W = 10;
const RIG_H = 12;
const RIG_GAP_X = 5;
const RIG_GAP_Y = 6;
const RIG_W_TOTAL = RIG_COLS * RIG_W + (RIG_COLS - 1) * RIG_GAP_X; // 145
const RIG_H_TOTAL = RIG_ROWS * RIG_H + (RIG_ROWS - 1) * RIG_GAP_Y; // 48

// kafka spine
const KAFKA_X = 200;
const KAFKA_Y_TOP = 80;
const KAFKA_Y_BOT = 200;

// classifier box
const CLASS_X = 270;
const CLASS_W = 120;
const CLASS_Y = 110;
const CLASS_H = 50;
const CLASS_MID_Y = CLASS_Y + CLASS_H / 2; // 135

// lanes
const LANE_X = 430;
const LANE_W = 230;
const LANE_H = 26;
const LANE_GAP = 8;
const LANE_Y0 = 80;
const LANES = [
  { key: "crash", label: "crash team", letter: "C" },
  { key: "leak", label: "leak team", letter: "L" },
  { key: "threading", label: "threading team", letter: "T" },
  { key: "other", label: "other / triaged", letter: "O" },
] as const;
const laneTop = (i: number) => LANE_Y0 + i * (LANE_H + LANE_GAP);
const laneMid = (i: number) => laneTop(i) + LANE_H / 2;

// stat panel
const STAT_X = 24;
const STAT_Y = 222;
const STAT_W = VB_W - 48; // 672
const STAT_H = 78;

// parse "6h 20m" → minutes
function parseHM(s: string): number {
  const m = s.match(/(\d+)h\s*(\d+)m/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}
function fmtHM(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min - h * 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

interface Dot {
  rigIdx: number;
  rx: number;
  ry: number;
  laneIdx: number;
  letter: "C" | "L" | "T" | "O";
  emitAt: number; // 0..1 within loop window
}

export function TriageRoutingAnimation({
  caption,
  number,
  meta = "14k events/hr · 230 rigs",
  rigCount = 230,
  eventsPerHour = 14000,
  reviewTimeBefore = "6h 20m",
  reviewTimeAfter = "3h 25m",
  laneMix = { crash: 38, threading: 24, leak: 18, other: 20 },
}: TriageRoutingAnimationProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // simplified phases
  // 0 idle (empty pipeline)
  // 1 rigs + kafka + classifier + lanes appear
  // 2 dots flow rig → kafka → classifier → lane (counts fill)
  // 3 stat-panel counter eases from 6h20m down to 3h25m
  const [phase, setPhase] = useState(0);
  const FINAL = 3;

  // continuous tick 0..1 for dot flow
  const [t, setT] = useState(0);
  const [count, setCount] = useState(parseHM(reviewTimeBefore));

  useEffect(() => {
    if (reduced) {
      setPhase(FINAL);
      setT(1);
      setCount(parseHM(reviewTimeAfter));
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
      setCount(parseHM(reviewTimeBefore));
      at(300, 1);
      at(900, 2);
      at(4200, 3);
      timers.push(setTimeout(() => !cancelled && run(), 8200));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced, reviewTimeBefore, reviewTimeAfter]);

  // drive `t` while in flow phase (2 and beyond — keep dots flowing)
  useEffect(() => {
    if (reduced) return;
    if (phase < 2) return;
    const start = performance.now();
    const dur = 3000;
    let raf = 0;
    const tick = (now: number) => {
      const tt = Math.min(1, (now - start) / dur);
      setT(tt);
      if (tt < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reduced]);

  // ease the review-time counter on phase 3
  useEffect(() => {
    if (reduced) return;
    if (phase < 3) return;
    const from = parseHM(reviewTimeBefore);
    const to = parseHM(reviewTimeAfter);
    const start = performance.now();
    const dur = 1200;
    let raf = 0;
    const tick = (now: number) => {
      const tt = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - tt, 3);
      setCount(from + (to - from) * eased);
      if (tt < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reduced, reviewTimeBefore, reviewTimeAfter]);

  const show = (p: number) => phase >= p;

  // rigs (positions only, no flow)
  const rigs = useMemo(() => {
    const items: Array<{ idx: number; x: number; y: number }> = [];
    for (let r = 0; r < RIG_ROWS; r++) {
      for (let c = 0; c < RIG_COLS; c++) {
        const idx = r * RIG_COLS + c;
        items.push({
          idx,
          x: RIG_X0 + c * (RIG_W + RIG_GAP_X) + RIG_W / 2,
          y: RIG_Y0 + r * (RIG_H + RIG_GAP_Y) + RIG_H / 2,
        });
      }
    }
    return items;
  }, []);

  // flow dots: a small representative stream, deterministic
  const dots = useMemo<Dot[]>(() => {
    const rnd = mulberry32(11);
    const total =
      laneMix.crash + laneMix.leak + laneMix.threading + laneMix.other;
    const N = 7; // few enough not to crowd
    const out: Dot[] = [];
    for (let i = 0; i < N; i++) {
      const rigIdx = Math.floor(rnd() * rigs.length);
      const u = rnd() * total;
      let letter: "C" | "L" | "T" | "O" = "C";
      let laneIdx = 0;
      let cum = laneMix.crash;
      if (u >= cum) {
        cum += laneMix.leak;
        if (u < cum) {
          letter = "L";
          laneIdx = 1;
        } else {
          cum += laneMix.threading;
          if (u < cum) {
            letter = "T";
            laneIdx = 2;
          } else {
            letter = "O";
            laneIdx = 3;
          }
        }
      }
      const r = rigs[rigIdx];
      out.push({
        rigIdx,
        rx: r.x,
        ry: r.y,
        laneIdx,
        letter,
        emitAt: i / N, // evenly spaced
      });
    }
    return out;
  }, [rigs, laneMix]);

  // count dots that have already arrived at each lane (cumulative across loops)
  const arrived = useMemo(() => {
    const a = [0, 0, 0, 0];
    if (!show(2)) return a;
    for (const d of dots) {
      // dot active during tt in [emitAt, emitAt+0.35]
      const tt = (t - d.emitAt) / 0.35;
      if (tt >= 1) a[d.laneIdx] += 1;
    }
    // scale up to give a steady-state filled look
    return a.map((n) => n);
  }, [dots, t, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // dot position along its 4-segment path
  function dotPos(d: Dot): { x: number; y: number; visible: boolean } {
    if (reduced) {
      // freeze a representative steady-state: dot sitting just left of its lane
      return { x: LANE_X - 10, y: laneMid(d.laneIdx), visible: true };
    }
    if (!show(2)) return { x: d.rx, y: d.ry, visible: false };
    const tt = (t - d.emitAt) / 0.35;
    if (tt <= 0 || tt >= 1) return { x: d.rx, y: d.ry, visible: false };
    // 4 segments:
    //   0.00-0.25  rig    → (KAFKA_X, ry)
    //   0.25-0.50  kafka  → (KAFKA_X, CLASS_MID_Y)
    //   0.50-0.75  enter  → (CLASS_X + CLASS_W, CLASS_MID_Y)  [through classifier]
    //   0.75-1.00  exit   → (LANE_X + 14, laneMid)
    let x = d.rx;
    let y = d.ry;
    if (tt < 0.25) {
      const u = tt / 0.25;
      x = d.rx + (KAFKA_X - d.rx) * u;
      y = d.ry;
    } else if (tt < 0.5) {
      const u = (tt - 0.25) / 0.25;
      x = KAFKA_X;
      y = d.ry + (CLASS_MID_Y - d.ry) * u;
    } else if (tt < 0.75) {
      const u = (tt - 0.5) / 0.25;
      x = KAFKA_X + (CLASS_X + CLASS_W - KAFKA_X) * u;
      y = CLASS_MID_Y;
    } else {
      const u = (tt - 0.75) / 0.25;
      const targetX = LANE_X + 14;
      const targetY = laneMid(d.laneIdx);
      x = CLASS_X + CLASS_W + (targetX - (CLASS_X + CLASS_W)) * u;
      y = CLASS_MID_Y + (targetY - CLASS_MID_Y) * u;
    }
    return { x, y, visible: true };
  }

  // rig pulse for ambient liveness
  function rigPulse(r: { idx: number }): number {
    if (!show(1)) return 0;
    if (reduced) return 0.55;
    const off = (r.idx % 9) / 9;
    const wave = ((t + off) % 0.5) / 0.5;
    return 0.3 + wave * 0.5;
  }

  // percent drop for badge
  const pctDrop = useMemo(() => {
    const from = parseHM(reviewTimeBefore);
    const to = parseHM(reviewTimeAfter);
    return Math.round(((from - to) / from) * 100);
  }, [reviewTimeBefore, reviewTimeAfter]);

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
            A fleet of {rigCount} hardware-in-the-loop rigs publishes roughly{" "}
            {eventsPerHour.toLocaleString()} test events per hour through Kafka.
            A classifier tags each failure as crash, leak, threading, or other,
            then routes it to the responsible team&apos;s inbox. Median PR
            review time drops from {reviewTimeBefore} to {reviewTimeAfter}.
          </desc>

          <defs>
            <pattern
              id="triage-scan"
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

          {/* ===== top headers ===== */}
          <text
            x={24}
            y={28}
            fontSize="9"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            pipeline
          </text>
          <text
            x={24}
            y={48}
            fontSize="13"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            auto-route
          </text>
          <text
            x={VB_W - 24}
            y={28}
            textAnchor="end"
            fontSize="9"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            throughput
          </text>
          <text
            x={VB_W - 24}
            y={48}
            textAnchor="end"
            fontSize="13"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            {`${(eventsPerHour / 1000).toFixed(0)}k / hr`}
          </text>

          {/* ===== section captions ===== */}
          <text
            x={RIG_X0}
            y={72}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            rig fleet
          </text>
          <text
            x={KAFKA_X + 8}
            y={72}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            kafka
          </text>
          <text
            x={CLASS_X}
            y={72}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            classifier
          </text>
          <text
            x={LANE_X}
            y={72}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            owner inboxes
          </text>

          {/* ===== rig fleet ===== */}
          {rigs.map((r) => (
            <rect
              key={r.idx}
              x={r.x - RIG_W / 2}
              y={r.y - RIG_H / 2}
              width={RIG_W}
              height={RIG_H}
              fill="rgb(var(--foreground))"
              opacity={rigPulse(r)}
            />
          ))}
          <text
            x={RIG_X0}
            y={RIG_Y0 + RIG_H_TOTAL + 16}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            {`${rigCount} rigs · ${(eventsPerHour / 1000).toFixed(0)}k / hr`}
          </text>

          {/* ===== kafka spine ===== */}
          <motion.g
            initial={false}
            animate={{ opacity: show(1) ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          >
            <line
              x1={KAFKA_X}
              x2={KAFKA_X}
              y1={KAFKA_Y_TOP}
              y2={KAFKA_Y_BOT}
              stroke="rgb(var(--foreground))"
              strokeWidth={1.2}
              opacity={0.6}
              strokeDasharray="3 3"
            />
          </motion.g>

          {/* ===== classifier box ===== */}
          <motion.g
            initial={false}
            animate={{ opacity: show(1) ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          >
            <rect
              x={CLASS_X}
              y={CLASS_Y}
              width={CLASS_W}
              height={CLASS_H}
              fill="url(#triage-scan)"
            />
            <rect
              x={CLASS_X}
              y={CLASS_Y}
              width={CLASS_W}
              height={CLASS_H}
              fill="rgb(var(--foreground) / 0.04)"
              stroke="rgb(var(--foreground))"
              strokeWidth={1}
            />
            <text
              x={CLASS_X + CLASS_W / 2}
              y={CLASS_Y + 20}
              textAnchor="middle"
              fontSize="11"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.04em" }}
            >
              classify(...)
            </text>
            <text
              x={CLASS_X + CLASS_W / 2}
              y={CLASS_Y + 38}
              textAnchor="middle"
              fontSize="7.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              tag · route
            </text>
          </motion.g>

          {/* ===== owner lanes ===== */}
          {LANES.map((lane, i) => {
            const top = laneTop(i);
            const mid = laneMid(i);
            const n = arrived[i];
            return (
              <motion.g
                key={lane.key}
                initial={false}
                animate={{ opacity: show(1) ? 1 : 0 }}
                transition={{
                  duration: 0.4,
                  ease,
                  delay: show(1) && !reduced ? i * 0.05 : 0,
                }}
              >
                {/* lane row background */}
                <rect
                  x={LANE_X}
                  y={top}
                  width={LANE_W}
                  height={LANE_H}
                  fill="url(#triage-scan)"
                />
                <rect
                  x={LANE_X}
                  y={top}
                  width={LANE_W}
                  height={LANE_H}
                  fill="rgb(var(--foreground) / 0.03)"
                  stroke="rgb(var(--border))"
                  strokeWidth={0.8}
                />
                {/* letter chip */}
                <rect
                  x={LANE_X + 6}
                  y={top + 5}
                  width={16}
                  height={16}
                  fill="rgb(var(--foreground) / 0.08)"
                  stroke="rgb(var(--foreground))"
                  strokeWidth={0.9}
                />
                <text
                  x={LANE_X + 14}
                  y={mid + 3}
                  textAnchor="middle"
                  fontSize="9"
                  fill="rgb(var(--foreground))"
                  fontFamily="var(--font-mono)"
                  style={{ fontWeight: 700 }}
                >
                  {lane.letter}
                </text>
                {/* lane name */}
                <text
                  x={LANE_X + 32}
                  y={mid + 3}
                  fontSize="9"
                  fill="rgb(var(--foreground))"
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.06em" }}
                >
                  {lane.label}
                </text>
                {/* count on right */}
                <text
                  x={LANE_X + LANE_W - 10}
                  y={mid + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="rgb(var(--foreground))"
                  fontFamily="var(--font-mono)"
                >
                  {n.toString().padStart(2, "0")}
                </text>
              </motion.g>
            );
          })}

          {/* ===== flow dots ===== */}
          {dots.map((d, i) => {
            const pos = dotPos(d);
            if (!pos.visible) return null;
            return (
              <g key={`dot-${i}`}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={3}
                  fill="rgb(var(--foreground))"
                  opacity={0.92}
                />
              </g>
            );
          })}

          {/* ===== stat panel ===== */}
          <g>
            <rect
              x={STAT_X}
              y={STAT_Y}
              width={STAT_W}
              height={STAT_H}
              fill="url(#triage-scan)"
            />
            <rect
              x={STAT_X}
              y={STAT_Y}
              width={STAT_W}
              height={STAT_H}
              fill="rgb(var(--foreground) / 0.04)"
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
            />
            <text
              x={STAT_X + 16}
              y={STAT_Y + 20}
              fontSize="9"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
            >
              median pr review time
            </text>
            <text
              x={STAT_X + 16}
              y={STAT_Y + 56}
              fontSize="24"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.04em" }}
            >
              {`${reviewTimeBefore} → ${fmtHM(count)}`}
            </text>
            <text
              x={STAT_X + 16}
              y={STAT_Y + 72}
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              before → after · classifier on
            </text>
            {/* delta badge */}
            <motion.g
              initial={false}
              animate={{ opacity: show(3) ? 1 : 0 }}
              transition={{ duration: 0.4, ease }}
            >
              <rect
                x={STAT_X + STAT_W - 100}
                y={STAT_Y + 26}
                width={84}
                height={32}
                fill="rgb(var(--foreground) / 0.08)"
                stroke="rgb(var(--foreground))"
                strokeWidth={1}
              />
              <text
                x={STAT_X + STAT_W - 58}
                y={STAT_Y + 48}
                textAnchor="middle"
                fontSize="18"
                fill="rgb(var(--foreground))"
                fontFamily="var(--font-mono)"
                style={{ letterSpacing: "0.06em" }}
              >
                {`−${pctDrop}%`}
              </text>
            </motion.g>
          </g>
        </svg>
      </div>
    </ChartFrame>
  );
}
