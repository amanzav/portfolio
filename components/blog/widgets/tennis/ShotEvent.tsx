"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "@/components/blog/primitives/ChartFrame";

interface TennisShotEventProps {
  caption: string;
  number?: string;
  meta?: string;
}

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 300;

// ─────────────────────────────────────────────────────────────────────────────
// Geometry
//   Player at (120, 210). 1.2 m proximity ≈ r=50 in this viewBox.
//   Ball contact at (170, 200).
//   Incoming ball trace: smooth bezier from upper-right (620, 120) → (170, 200).
//   Outgoing ball trace: bezier from (170, 200) → (620, 100).
// ─────────────────────────────────────────────────────────────────────────────
const PLAYER = { x: 120, y: 210 };
const CONTACT = { x: 170, y: 200 };
const PROX_R = 50;

const INCOMING_PATH = `M620,120 C460,150 300,220 ${CONTACT.x},${CONTACT.y}`;
const OUTGOING_PATH = `M${CONTACT.x},${CONTACT.y} C320,170 480,130 620,100`;

// Status chip (bottom-right, clear of trajectories which live in y=100..200)
const CHIP = { x: 520, y: 210, w: 160, h: 56 };

export function TennisShotEvent({
  caption,
  number,
  meta = "θ > 110° · d < 1.2 m",
}: TennisShotEventProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // phase: 0 idle · 1 incoming trace · 2 proximity + contact crosshair
  //        · 3 outgoing trace · 4 status chip lights up
  const [phase, setPhase] = useState(0);

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
      at(300, 1);
      at(1500, 2);
      at(2400, 3);
      at(3600, 4);
      timers.push(setTimeout(() => !cancelled && run(), 6200));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced]);

  const show = (p: number) => phase >= p;

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
            A shot event is detected at the frame where the ball's direction
            reverses by more than 110 degrees and the ball is within 1.2 meters
            of a player. The incoming ball arcs into the contact point, then
            exits in nearly the opposite direction; the proximity circle
            qualifies the player gating condition.
          </desc>
          <defs>
            <pattern
              id="tse-scanlines"
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
            05 · shot event
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
            direction reversal + proximity
          </text>

          {/* ===== Panel background ===== */}
          <rect
            x={24}
            y={48}
            width={VB_W - 48}
            height={228}
            fill="url(#tse-scanlines)"
          />
          <rect
            x={24}
            y={48}
            width={VB_W - 48}
            height={228}
            fill="rgb(var(--foreground) / 0.02)"
            stroke="rgb(var(--border))"
            strokeWidth={0.8}
          />

          {/* ===== Player (small stick figure: head + body) ===== */}
          <g>
            <circle
              cx={PLAYER.x}
              cy={PLAYER.y - 12}
              r={4}
              fill="none"
              stroke="rgb(var(--foreground))"
              strokeWidth={1}
            />
            <rect
              x={PLAYER.x - 5}
              y={PLAYER.y - 8}
              width={10}
              height={14}
              fill="rgb(var(--foreground) / 0.05)"
              stroke="rgb(var(--foreground))"
              strokeWidth={1}
            />
            <line
              x1={PLAYER.x}
              y1={PLAYER.y + 6}
              x2={PLAYER.x - 4}
              y2={PLAYER.y + 18}
              stroke="rgb(var(--foreground))"
              strokeWidth={1}
            />
            <line
              x1={PLAYER.x}
              y1={PLAYER.y + 6}
              x2={PLAYER.x + 4}
              y2={PLAYER.y + 18}
              stroke="rgb(var(--foreground))"
              strokeWidth={1}
            />
          </g>
          <text
            x={PLAYER.x}
            y={240}
            textAnchor="middle"
            fontSize="7"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            player
          </text>

          {/* ===== Proximity circle (1.2 m) ===== */}
          <motion.circle
            cx={PLAYER.x}
            cy={PLAYER.y}
            r={PROX_R}
            fill="none"
            stroke="rgb(var(--foreground))"
            strokeWidth={0.7}
            strokeDasharray="2 3"
            initial={false}
            animate={{ opacity: show(2) ? 0.7 : 0 }}
            transition={{ duration: 0.5, ease }}
          />
          <motion.text
            x={PLAYER.x}
            y={PLAYER.y - PROX_R - 2}
            textAnchor="middle"
            fontSize="7"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            initial={false}
            animate={{ opacity: show(2) ? 1 : 0 }}
            transition={{ duration: 0.5, ease }}
          >
            1.2 m
          </motion.text>

          {/* ===== Incoming ball trajectory ===== */}
          <motion.path
            d={INCOMING_PATH}
            fill="none"
            stroke="rgb(var(--foreground))"
            strokeWidth={1}
            strokeDasharray="3 4"
            initial={false}
            animate={{ pathLength: show(1) ? 1 : 0, opacity: show(1) ? 0.85 : 0 }}
            transition={{ duration: reduced ? 0 : 1.0, ease }}
          />

          {/* ===== Contact crosshair ===== */}
          <motion.g
            initial={false}
            animate={{ opacity: show(2) ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          >
            <motion.line
              x1={CONTACT.x - 6}
              y1={CONTACT.y}
              x2={CONTACT.x + 6}
              y2={CONTACT.y}
              stroke="rgb(var(--foreground))"
              strokeWidth={1}
              animate={
                phase === 4 && !reduced
                  ? { opacity: [1, 0.5, 1] }
                  : { opacity: 1 }
              }
              transition={{ duration: 1.0, repeat: phase === 4 ? Infinity : 0 }}
            />
            <motion.line
              x1={CONTACT.x}
              y1={CONTACT.y - 6}
              x2={CONTACT.x}
              y2={CONTACT.y + 6}
              stroke="rgb(var(--foreground))"
              strokeWidth={1}
              animate={
                phase === 4 && !reduced
                  ? { opacity: [1, 0.5, 1] }
                  : { opacity: 1 }
              }
              transition={{ duration: 1.0, repeat: phase === 4 ? Infinity : 0 }}
            />
            <circle
              cx={CONTACT.x}
              cy={CONTACT.y}
              r={3}
              fill="rgb(var(--background))"
              stroke="rgb(var(--foreground))"
              strokeWidth={1}
            />
          </motion.g>

          {/* ===== Outgoing ball trajectory ===== */}
          <motion.path
            d={OUTGOING_PATH}
            fill="none"
            stroke="rgb(var(--foreground))"
            strokeWidth={1}
            strokeDasharray="3 4"
            initial={false}
            animate={{ pathLength: show(3) ? 1 : 0, opacity: show(3) ? 0.9 : 0 }}
            transition={{ duration: reduced ? 0 : 1.0, ease }}
          />

          {/* ===== Trajectory labels (right side, near where curves exit panel) ===== */}
          {/* Outgoing label — sits above the outgoing curve's tip (620, 100) */}
          <motion.g
            initial={false}
            animate={{ opacity: show(3) ? 1 : 0 }}
            transition={{ duration: 0.4, ease, delay: show(3) ? 0.6 : 0 }}
          >
            <text
              x={628}
              y={84}
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.16em", textTransform: "uppercase" }}
            >
              v_after
            </text>
            <text
              x={628}
              y={95}
              fontSize="6.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
              opacity={0.7}
            >
              outgoing
            </text>
          </motion.g>
          {/* Incoming label — sits below the incoming curve's tip (620, 120) */}
          <motion.g
            initial={false}
            animate={{ opacity: show(1) ? 1 : 0 }}
            transition={{ duration: 0.4, ease, delay: show(1) ? 0.6 : 0 }}
          >
            <text
              x={628}
              y={132}
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.16em", textTransform: "uppercase" }}
            >
              v_before
            </text>
            <text
              x={628}
              y={143}
              fontSize="6.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
              opacity={0.7}
            >
              incoming
            </text>
          </motion.g>

          {/* ===== Status chip ===== */}
          <motion.g
            initial={false}
            animate={{ opacity: show(4) ? 1 : 0.18, y: show(4) ? 0 : -2 }}
            transition={{ duration: 0.5, ease }}
          >
            <rect
              x={CHIP.x}
              y={CHIP.y}
              width={CHIP.w}
              height={CHIP.h}
              fill="rgb(var(--foreground) / 0.05)"
              stroke="rgb(var(--foreground))"
              strokeWidth={show(4) ? 1.1 : 0.7}
            />
            <text
              x={CHIP.x + 14}
              y={CHIP.y + 18}
              fontSize="9"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              shot detected
            </text>
            <motion.text
              x={CHIP.x + 14}
              y={CHIP.y + 34}
              fontSize="7.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em" }}
              initial={false}
              animate={{ opacity: show(4) ? 1 : 0 }}
              transition={{ duration: 0.4, ease, delay: show(4) ? 0.15 : 0 }}
            >
              angle &gt; 110°  ✓
            </motion.text>
            <motion.text
              x={CHIP.x + 14}
              y={CHIP.y + 48}
              fontSize="7.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em" }}
              initial={false}
              animate={{ opacity: show(4) ? 1 : 0 }}
              transition={{ duration: 0.4, ease, delay: show(4) ? 0.3 : 0 }}
            >
              dist &lt; 1.2 m  ✓
            </motion.text>
          </motion.g>
        </svg>
      </div>
    </ChartFrame>
  );
}
