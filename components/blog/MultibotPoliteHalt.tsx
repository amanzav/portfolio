"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "./ChartFrame";

interface MultibotPoliteHaltProps {
  caption: string;
  number?: string;
  meta?: string;
  etaA?: number;
  etaB?: number;
}

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 300;

// Intersection geometry
const C = { x: 360, y: 168 };
const ROAD_H = { x0: 180, x1: 540, y0: 160, y1: 184 };
const ROAD_V = { y0: 70, y1: 260, x0: 348, x1: 372 };
const CONFLICT = { x: 342, y: 150, w: 36, h: 36 };

// Bot start positions
const A_START = { x: 200, y: 172 };
const B_START = { x: 360, y: 244 };

// Approach hold positions (just outside conflict zone)
const A_APPROACH_X = CONFLICT.x - 12; // 330
const A_BACKOFF_X = A_APPROACH_X - 8; // 322
const B_APPROACH_Y = CONFLICT.y + CONFLICT.h + 12; // 198
const B_BACKOFF_Y = B_APPROACH_Y + 8; // 206

// Exit positions
const A_EXIT_X = 540;
const B_EXIT_Y = 70;

// Yield position for B in eta phase (~16px south of conflict zone)
const B_YIELD_Y = CONFLICT.y + CONFLICT.h + 16; // 202

export function MultibotPoliteHalt({
  caption,
  number,
  meta = "with vs without eta_intersection",
  etaA = 2.1,
  etaB = 3.4,
}: MultibotPoliteHaltProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // phase: 1 idle · 2 no-eta encounter · 3 mode swap · 4 with-eta · 5 exit
  const [phase, setPhase] = useState(1);
  // verdict cycle tick for no-eta mode (drives the crossfade)
  const [verdictTick, setVerdictTick] = useState(0);

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
      setPhase(1);
      setVerdictTick(0);
      at(400, 2);   // no-eta encounter starts
      at(4800, 3);  // mode swap
      at(5800, 4);  // with-eta resolution
      at(7800, 5);  // exit
      timers.push(setTimeout(() => !cancelled && run(), 10500));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced]);

  // verdict cycling during no-eta encounter
  useEffect(() => {
    if (reduced) return;
    if (phase !== 2) return;
    const id = setInterval(() => setVerdictTick((t) => t + 1), 900);
    return () => clearInterval(id);
  }, [phase, reduced]);

  const noEtaMode = phase <= 2;
  const withEtaMode = phase >= 3;

  // Bot A position by phase
  const botA = (() => {
    if (phase === 1) return { cx: A_START.x, cy: A_START.y };
    if (phase === 2) {
      // back-and-forth keyframes — react-motion will loop via repeat
      return {
        cx: [A_START.x, A_APPROACH_X, A_BACKOFF_X, A_APPROACH_X, A_BACKOFF_X, A_APPROACH_X],
        cy: A_START.y,
      };
    }
    if (phase === 3) return { cx: A_START.x, cy: A_START.y };
    if (phase === 4) return { cx: C.x + 4, cy: A_START.y };
    // phase 5 — A clears east
    return { cx: A_EXIT_X - 8, cy: A_START.y };
  })();

  const botB = (() => {
    if (phase === 1) return { cx: B_START.x, cy: B_START.y };
    if (phase === 2) {
      return {
        cx: B_START.x,
        cy: [B_START.y, B_APPROACH_Y, B_BACKOFF_Y, B_APPROACH_Y, B_BACKOFF_Y, B_APPROACH_Y],
      };
    }
    if (phase === 3) return { cx: B_START.x, cy: B_START.y };
    if (phase === 4) return { cx: B_START.x, cy: B_YIELD_Y };
    // phase 5 — B crosses through
    return { cx: B_START.x, cy: B_EXIT_Y + 8 };
  })();

  // Verdict text for the strip
  const verdictText = (() => {
    if (noEtaMode) {
      const items = ["A yields", "B yields", "A yields", "B yields"];
      return items[verdictTick % items.length];
    }
    if (phase === 4) return "A goes (earlier eta) · B yields";
    if (phase === 5) return "B crossing · A clear";
    return "—";
  })();

  const footerText = noEtaMode
    ? "both detect · both yield · nothing moves"
    : "temporal ordering breaks symmetry";

  const modeBadge = withEtaMode ? "with eta" : "no eta";
  const etaAText = withEtaMode ? `eta=${etaA.toFixed(1)}s` : "eta=—";
  const etaBText = withEtaMode ? `eta=${etaB.toFixed(1)}s` : "eta=—";

  // Chip dimensions
  const CHIP_A = { x: 24, y: 46, w: 180, h: 44 };
  const CHIP_B = { x: VB_W - 204, y: 46, w: 180, h: 44 };

  // Stop signs
  const stops = [
    { x: 196, y: 172 },
    { x: 524, y: 172 },
    { x: 360, y: 86 },
    { x: 360, y: 244 },
  ];

  // Phase 2 vs others — different transitions
  const botTransition = (isPhase2: boolean) =>
    isPhase2
      ? { duration: 3.2, ease, times: [0, 0.2, 0.35, 0.55, 0.7, 1] }
      : { duration: 0.9, ease };

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
            Two bots approach an unsignalised four-way stop. Without
            eta_intersection both detect each other and both back off,
            cycling A yields then B yields then A yields — the polite-halt
            standoff. Broadcasting ETA breaks the symmetry: the bot with the
            earlier ETA goes, the other holds, and the intersection clears.
          </desc>
          <defs>
            <pattern
              id="mb-polite-scanlines"
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
            01 · intersection encounter
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
            loop: no-eta ↻ eta
          </text>

          {/* mode badge centered */}
          <motion.g
            initial={false}
            animate={{ opacity: 1 }}
            key={`mode-${withEtaMode ? "with" : "no"}`}
          >
            <text
              x={360}
              y={22}
              textAnchor="middle"
              fontSize="9"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              {modeBadge}
            </text>
          </motion.g>

          {/* ===== Bot A intent chip (top-left) ===== */}
          <g>
            <rect
              x={CHIP_A.x}
              y={CHIP_A.y}
              width={CHIP_A.w}
              height={CHIP_A.h}
              fill="url(#mb-polite-scanlines)"
            />
            <rect
              x={CHIP_A.x}
              y={CHIP_A.y}
              width={CHIP_A.w}
              height={CHIP_A.h}
              fill="rgb(var(--foreground) / 0.04)"
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
            />
            <text
              x={CHIP_A.x + 14}
              y={CHIP_A.y + 16}
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              BOT A · approaching
            </text>
            <text
              x={CHIP_A.x + 14}
              y={CHIP_A.y + 32}
              fontSize="9"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.06em" }}
            >
              {etaAText}
            </text>
          </g>

          {/* ===== Bot B intent chip (top-right) ===== */}
          <g>
            <rect
              x={CHIP_B.x}
              y={CHIP_B.y}
              width={CHIP_B.w}
              height={CHIP_B.h}
              fill="url(#mb-polite-scanlines)"
            />
            <rect
              x={CHIP_B.x}
              y={CHIP_B.y}
              width={CHIP_B.w}
              height={CHIP_B.h}
              fill="rgb(var(--foreground) / 0.04)"
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
            />
            <text
              x={CHIP_B.x + 14}
              y={CHIP_B.y + 16}
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              BOT B · approaching
            </text>
            <text
              x={CHIP_B.x + 14}
              y={CHIP_B.y + 32}
              fontSize="9"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.06em" }}
            >
              {etaBText}
            </text>
          </g>

          {/* ===== Roads ===== */}
          {/* horizontal road */}
          <rect
            x={ROAD_H.x0}
            y={ROAD_H.y0}
            width={ROAD_H.x1 - ROAD_H.x0}
            height={ROAD_H.y1 - ROAD_H.y0}
            fill="rgb(var(--foreground) / 0.03)"
            stroke="rgb(var(--border))"
            strokeWidth={0.7}
          />
          {/* vertical road */}
          <rect
            x={ROAD_V.x0}
            y={ROAD_V.y0}
            width={ROAD_V.x1 - ROAD_V.x0}
            height={ROAD_V.y1 - ROAD_V.y0}
            fill="rgb(var(--foreground) / 0.03)"
            stroke="rgb(var(--border))"
            strokeWidth={0.7}
          />

          {/* ===== Conflict zone (dashed) ===== */}
          <rect
            x={CONFLICT.x}
            y={CONFLICT.y}
            width={CONFLICT.w}
            height={CONFLICT.h}
            fill="none"
            stroke="rgb(var(--foreground) / 0.55)"
            strokeWidth={0.9}
            strokeDasharray="3 3"
          />
          <text
            x={360}
            y={142}
            textAnchor="middle"
            fontSize="7"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            intersection X1
          </text>

          {/* ===== Stop signs ===== */}
          {stops.map((s, i) => (
            <g key={`stop-${i}`}>
              <rect
                x={s.x - 5}
                y={s.y - 5}
                width={10}
                height={10}
                fill="rgb(var(--background))"
                stroke="rgb(var(--muted))"
                strokeWidth={0.8}
              />
              <text
                x={s.x}
                y={s.y + 2.5}
                textAnchor="middle"
                fontSize="7"
                fill="rgb(var(--muted))"
                fontFamily="var(--font-mono)"
              >
                S
              </text>
            </g>
          ))}

          {/* ===== Bot A (circle + letter as one group via translate) ===== */}
          <motion.g
            initial={false}
            animate={{ x: botA.cx, y: botA.cy }}
            transition={botTransition(phase === 2)}
          >
            <circle r={7} fill="rgb(var(--foreground))" />
            <text
              fontSize="7"
              fill="rgb(var(--background))"
              fontFamily="var(--font-mono)"
              textAnchor="middle"
              y={2.5}
              style={{ pointerEvents: "none" }}
            >
              A
            </text>
          </motion.g>

          {/* ===== Bot B ===== */}
          <motion.g
            initial={false}
            animate={{ x: botB.cx, y: botB.cy }}
            transition={botTransition(phase === 2)}
          >
            <circle r={7} fill="rgb(var(--foreground))" />
            <text
              fontSize="7"
              fill="rgb(var(--background))"
              fontFamily="var(--font-mono)"
              textAnchor="middle"
              y={2.5}
              style={{ pointerEvents: "none" }}
            >
              B
            </text>
          </motion.g>

          {/* ===== Verdict strip (y=270) ===== */}
          <motion.text
            key={`verdict-${phase}-${verdictTick}`}
            x={VB_W / 2}
            y={272}
            textAnchor="middle"
            fontSize="9"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease }}
            style={{ letterSpacing: "0.12em" }}
          >
            {verdictText}
          </motion.text>

          {/* ===== Footer ===== */}
          <text
            x={VB_W / 2}
            y={VB_H - 10}
            textAnchor="middle"
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            {footerText}
          </text>
        </svg>
      </div>
    </ChartFrame>
  );
}
