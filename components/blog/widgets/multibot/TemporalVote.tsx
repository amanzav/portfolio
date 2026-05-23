"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "@/components/blog/primitives/ChartFrame";

interface MultibotTemporalVoteProps {
  caption: string;
  number?: string;
  meta?: string;
  trackA?: number[];
  trackB?: number[];
  threshold?: number;
  commitMin?: number;
}

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 280;

const CELL_W = 56;
const CELL_H = 56;
const CELL_GAP = 12;
// Cell x positions (5 cells, 4 gaps inside x=120..540 band)
const CELL_XS = [166, 234, 302, 370, 438]; // centers: 194, 262, 330, 398, 466
const CELL_CENTERS = CELL_XS.map((x) => x + CELL_W / 2);

const TRACK_A_Y = 100;
const TRACK_B_Y = 196;

const VERDICT = {
  x: 580,
  w: 116,
  h: 56,
  aY: 90,
  bY: 186,
};

export function MultibotTemporalVote({
  caption,
  number,
  meta = "3 of last 5 @ conf ≥ 0.45",
  trackA = [0.62, 0.31, 0.71, 0.58, 0.22],
  trackB = [0.51, 0.18, 0.22, 0.49, 0.14],
  threshold = 0.45,
  commitMin = 3,
}: MultibotTemporalVoteProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // phase 1 idle · 2 track A streams · 3 track B streams · 4 verdicts · 5 footer pulse
  const [phase, setPhase] = useState(1);

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
      at(400, 2);
      at(2600, 3);
      at(4800, 4);
      at(5800, 5);
      timers.push(setTimeout(() => !cancelled && run(), 7800));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced]);

  const aHits = useMemo(
    () => trackA.filter((c) => c >= threshold).length,
    [trackA, threshold]
  );
  const bHits = useMemo(
    () => trackB.filter((c) => c >= threshold).length,
    [trackB, threshold]
  );

  const aCommit = aHits >= commitMin;
  const bCommit = bHits >= commitMin;

  // Per-cell visible threshold across phases
  const showCellA = (i: number) => phase >= 2;
  const showCellB = (i: number) => phase >= 3;

  // Stagger delays per cell (after the phase activates)
  const cellDelay = (i: number) => (reduced ? 0 : i * 0.32);

  // Mini-bar fill height = conf * 40 (max)
  const BAR_H = 40;
  const BAR_W = 4;
  const barFill = (conf: number) => conf * BAR_H;
  const THRESHOLD_TICK_Y_OFFSET = BAR_H - threshold * BAR_H; // y offset from top of bar

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
            Per-track temporal vote. For each tracked detection, the last
            five frames are tallied. A track commits to a real detection only
            if at least three of the last five frames cleared confidence
            0.45. Track A (a pedestrian) hits the bar, three of five.
            Track B (a textured wall) does not, two of five, and is rejected.
          </desc>
          <defs>
            <pattern
              id="mb-vote-scanlines"
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
            06 · per-track temporal vote
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
            commit if ≥{commitMin} of last 5 @ conf ≥ {threshold.toFixed(2)}
          </text>

          {/* ===== Frame index labels ===== */}
          {CELL_CENTERS.map((cx, i) => (
            <text
              key={`fi-${i}`}
              x={cx}
              y={78}
              textAnchor="middle"
              fontSize="7"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              f{i + 1}
            </text>
          ))}

          {/* mini scale labels on the left of the cells */}
          <text
            x={108}
            y={102}
            fontSize="7"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            conf
          </text>
          <text
            x={108}
            y={130}
            fontSize="7"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.14em" }}
          >
            {threshold.toFixed(2)} →
          </text>

          {/* ===== Track A label ===== */}
          <text
            x={24}
            y={88}
            fontSize="9"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            TRACK A · pedestrian
          </text>

          {/* ===== Track A cells ===== */}
          {trackA.map((conf, i) => {
            const x = CELL_XS[i];
            const y = TRACK_A_Y;
            const hit = conf >= threshold;
            const barX = x + CELL_W - 10;
            const barY = y + (CELL_H - BAR_H) / 2;
            const fillH = barFill(conf);
            return (
              <g key={`a-${i}`}>
                {/* cell border */}
                <rect
                  x={x}
                  y={y}
                  width={CELL_W}
                  height={CELL_H}
                  fill="url(#mb-vote-scanlines)"
                />
                <rect
                  x={x}
                  y={y}
                  width={CELL_W}
                  height={CELL_H}
                  fill="rgb(var(--foreground) / 0.025)"
                  stroke="rgb(var(--border))"
                  strokeWidth={0.8}
                />
                {/* conf number above cell — fades in */}
                <motion.text
                  x={x + CELL_W / 2 - 6}
                  y={y + 22}
                  textAnchor="middle"
                  fontSize="10"
                  fill={
                    hit
                      ? "rgb(var(--foreground))"
                      : "rgb(var(--foreground) / 0.55)"
                  }
                  fontFamily="var(--font-mono)"
                  initial={false}
                  animate={{ opacity: showCellA(i) ? 1 : 0, y: showCellA(i) ? y + 22 : y + 26 }}
                  transition={{ duration: 0.4, ease, delay: showCellA(i) ? cellDelay(i) : 0 }}
                >
                  {conf.toFixed(2)}
                </motion.text>
                {/* mini bar track */}
                <rect
                  x={barX}
                  y={barY}
                  width={BAR_W}
                  height={BAR_H}
                  fill="rgb(var(--foreground) / 0.05)"
                  stroke="rgb(var(--border))"
                  strokeWidth={0.5}
                />
                {/* threshold tick on the bar */}
                <line
                  x1={barX - 2}
                  x2={barX + BAR_W + 2}
                  y1={barY + THRESHOLD_TICK_Y_OFFSET}
                  y2={barY + THRESHOLD_TICK_Y_OFFSET}
                  stroke="rgb(var(--foreground) / 0.5)"
                  strokeWidth={0.8}
                  strokeDasharray="2 1.5"
                />
                {/* mini bar fill, grows from bottom */}
                <motion.rect
                  x={barX}
                  width={BAR_W}
                  fill={
                    hit
                      ? "rgb(var(--foreground))"
                      : "rgb(var(--foreground) / 0.45)"
                  }
                  initial={false}
                  animate={{
                    y: showCellA(i) ? barY + (BAR_H - fillH) : barY + BAR_H,
                    height: showCellA(i) ? fillH : 0,
                  }}
                  transition={{ duration: 0.45, ease, delay: showCellA(i) ? cellDelay(i) : 0 }}
                />
                {/* hit/miss pill below cell */}
                <motion.g
                  initial={false}
                  animate={{ opacity: showCellA(i) ? 1 : 0 }}
                  transition={{ duration: 0.3, ease, delay: showCellA(i) ? cellDelay(i) + 0.18 : 0 }}
                >
                  <rect
                    x={x + CELL_W / 2 - 16}
                    y={y + CELL_H + 6}
                    width={32}
                    height={12}
                    fill={hit ? "rgb(var(--foreground) / 0.1)" : "transparent"}
                    stroke={hit ? "rgb(var(--foreground))" : "rgb(var(--border))"}
                    strokeWidth={0.7}
                  />
                  <text
                    x={x + CELL_W / 2}
                    y={y + CELL_H + 14.5}
                    textAnchor="middle"
                    fontSize="7"
                    fill={hit ? "rgb(var(--foreground))" : "rgb(var(--muted))"}
                    fontFamily="var(--font-mono)"
                    style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
                  >
                    {hit ? "hit" : "miss"}
                  </text>
                </motion.g>
              </g>
            );
          })}

          {/* ===== Track B label ===== */}
          <text
            x={24}
            y={184}
            fontSize="9"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            TRACK B · wall texture
          </text>

          {/* ===== Track B cells ===== */}
          {trackB.map((conf, i) => {
            const x = CELL_XS[i];
            const y = TRACK_B_Y;
            const hit = conf >= threshold;
            const barX = x + CELL_W - 10;
            const barY = y + (CELL_H - BAR_H) / 2;
            const fillH = barFill(conf);
            return (
              <g key={`b-${i}`}>
                <rect
                  x={x}
                  y={y}
                  width={CELL_W}
                  height={CELL_H}
                  fill="url(#mb-vote-scanlines)"
                />
                <rect
                  x={x}
                  y={y}
                  width={CELL_W}
                  height={CELL_H}
                  fill="rgb(var(--foreground) / 0.02)"
                  stroke="rgb(var(--border))"
                  strokeWidth={0.8}
                />
                <motion.text
                  x={x + CELL_W / 2 - 6}
                  y={y + 22}
                  textAnchor="middle"
                  fontSize="10"
                  fill={
                    hit
                      ? "rgb(var(--foreground))"
                      : "rgb(var(--foreground) / 0.55)"
                  }
                  fontFamily="var(--font-mono)"
                  initial={false}
                  animate={{ opacity: showCellB(i) ? 1 : 0, y: showCellB(i) ? y + 22 : y + 26 }}
                  transition={{ duration: 0.4, ease, delay: showCellB(i) ? cellDelay(i) : 0 }}
                >
                  {conf.toFixed(2)}
                </motion.text>
                <rect
                  x={barX}
                  y={barY}
                  width={BAR_W}
                  height={BAR_H}
                  fill="rgb(var(--foreground) / 0.05)"
                  stroke="rgb(var(--border))"
                  strokeWidth={0.5}
                />
                <line
                  x1={barX - 2}
                  x2={barX + BAR_W + 2}
                  y1={barY + THRESHOLD_TICK_Y_OFFSET}
                  y2={barY + THRESHOLD_TICK_Y_OFFSET}
                  stroke="rgb(var(--foreground) / 0.5)"
                  strokeWidth={0.8}
                  strokeDasharray="2 1.5"
                />
                <motion.rect
                  x={barX}
                  width={BAR_W}
                  fill={
                    hit
                      ? "rgb(var(--foreground))"
                      : "rgb(var(--foreground) / 0.45)"
                  }
                  initial={false}
                  animate={{
                    y: showCellB(i) ? barY + (BAR_H - fillH) : barY + BAR_H,
                    height: showCellB(i) ? fillH : 0,
                  }}
                  transition={{ duration: 0.45, ease, delay: showCellB(i) ? cellDelay(i) : 0 }}
                />
                <motion.g
                  initial={false}
                  animate={{ opacity: showCellB(i) ? 1 : 0 }}
                  transition={{ duration: 0.3, ease, delay: showCellB(i) ? cellDelay(i) + 0.18 : 0 }}
                >
                  <rect
                    x={x + CELL_W / 2 - 16}
                    y={y + CELL_H + 6}
                    width={32}
                    height={12}
                    fill={hit ? "rgb(var(--foreground) / 0.1)" : "transparent"}
                    stroke={hit ? "rgb(var(--foreground))" : "rgb(var(--border))"}
                    strokeWidth={0.7}
                  />
                  <text
                    x={x + CELL_W / 2}
                    y={y + CELL_H + 14.5}
                    textAnchor="middle"
                    fontSize="7"
                    fill={hit ? "rgb(var(--foreground))" : "rgb(var(--muted))"}
                    fontFamily="var(--font-mono)"
                    style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
                  >
                    {hit ? "hit" : "miss"}
                  </text>
                </motion.g>
              </g>
            );
          })}

          {/* ===== Verdict box · A ===== */}
          <motion.g
            initial={false}
            animate={{
              opacity: phase >= 4 ? 1 : 0,
              scale: phase === 4 ? [1, 1.04, 1] : 1,
            }}
            transition={{ duration: 0.5, ease }}
            style={{ transformOrigin: `${VERDICT.x + VERDICT.w / 2}px ${VERDICT.aY + VERDICT.h / 2}px` }}
          >
            <rect
              x={VERDICT.x}
              y={VERDICT.aY}
              width={VERDICT.w}
              height={VERDICT.h}
              fill="rgb(var(--foreground) / 0.08)"
              stroke="rgb(var(--foreground))"
              strokeWidth={1.2}
            />
            <text
              x={VERDICT.x + VERDICT.w / 2}
              y={VERDICT.aY + 24}
              textAnchor="middle"
              fontSize="11"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              {aCommit ? "commit" : "reject"}
            </text>
            <text
              x={VERDICT.x + VERDICT.w / 2}
              y={VERDICT.aY + 42}
              textAnchor="middle"
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              {aHits} / {trackA.length} hits
            </text>
          </motion.g>

          {/* ===== Verdict box · B (faded, dashed) ===== */}
          <motion.g
            initial={false}
            animate={{
              opacity: phase >= 4 ? 0.7 : 0,
              scale: phase === 4 ? [1, 1.02, 1] : 1,
            }}
            transition={{ duration: 0.5, ease, delay: 0.15 }}
            style={{ transformOrigin: `${VERDICT.x + VERDICT.w / 2}px ${VERDICT.bY + VERDICT.h / 2}px` }}
          >
            <rect
              x={VERDICT.x}
              y={VERDICT.bY}
              width={VERDICT.w}
              height={VERDICT.h}
              fill="transparent"
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
              strokeDasharray="3 3"
            />
            <text
              x={VERDICT.x + VERDICT.w / 2}
              y={VERDICT.bY + 24}
              textAnchor="middle"
              fontSize="11"
              fill="rgb(var(--foreground) / 0.6)"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              {bCommit ? "commit" : "reject"}
            </text>
            <text
              x={VERDICT.x + VERDICT.w / 2}
              y={VERDICT.bY + 42}
              textAnchor="middle"
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              {bHits} / {trackB.length} hits
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
            animate={{ opacity: phase >= 5 ? 1 : 0.35 }}
            transition={{ duration: 0.5, ease }}
          >
            frame-by-frame: 67% safe · temporal vote: 94% safe
          </motion.text>
        </svg>
      </div>
    </ChartFrame>
  );
}
