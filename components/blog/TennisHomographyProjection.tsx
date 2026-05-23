"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "./ChartFrame";

interface TennisHomographyProjectionProps {
  caption: string;
  number?: string;
  meta?: string;
}

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 320;

// Left tripod-view trapezoid (foreshortened). 4 court corners + service-box T.
// Numbers are hand-tuned so the trapezoid sits inside x=24..324, y=60..280.
const L = {
  // outer doubles court trapezoid (back narrower, near wider)
  blTL: { x: 80, y: 92 },   // back-left
  blTR: { x: 268, y: 92 },  // back-right
  blBR: { x: 312, y: 264 }, // near-right
  blBL: { x: 36, y: 264 },  // near-left
  // service-box corners (the four points used for RANSAC)
  svcTL: { x: 118, y: 138 }, // back service T-left
  svcTR: { x: 230, y: 138 }, // back service T-right
  svcBR: { x: 266, y: 220 }, // near service box right
  svcBL: { x: 82, y: 220 },  // near service box left
  // center net (horizontal in tripod view, mid-court)
  netL: { x: 60, y: 178 },
  netR: { x: 288, y: 178 },
};

// Right top-down rectangle. x=396..696, y=60..280. Net is vertical at center.
const R = {
  // outer doubles rectangle
  tl: { x: 420, y: 92 },
  tr: { x: 672, y: 92 },
  br: { x: 672, y: 264 },
  bl: { x: 420, y: 264 },
  // service-box corners (matching the four RANSAC pts above)
  svcTL: { x: 462, y: 138 },
  svcTR: { x: 630, y: 138 },
  svcBR: { x: 630, y: 220 },
  svcBL: { x: 462, y: 220 },
  // net (vertical center)
  netT: { x: 546, y: 92 },
  netB: { x: 546, y: 264 },
};

// Players + bounce: pixel positions on the left, mapped meters positions right.
const PLAYERS = [
  {
    id: "p1",
    from: { x: 174, y: 248 }, // near-side player on tripod
    to: { x: 510, y: 252 },   // mapped to top-down
  },
  {
    id: "p2",
    from: { x: 188, y: 108 }, // far-side player
    to: { x: 582, y: 108 },
  },
];
const BOUNCE = {
  from: { x: 220, y: 196 },
  to: { x: 600, y: 184 },
};

// 4 RANSAC corner pairs used by the dashed correspondence lines.
const CORNER_PAIRS = [
  { l: L.svcTL, r: R.svcTL },
  { l: L.svcTR, r: R.svcTR },
  { l: L.svcBR, r: R.svcBR },
  { l: L.svcBL, r: R.svcBL },
];

export function TennisHomographyProjection({
  caption,
  number,
  meta = "H ∈ ℝ³ˣ³ · ransac",
}: TennisHomographyProjectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // phase: 0 idle · 1 corner markers blink in · 2 H glyph + correspondences
  //        · 3 player + bounce markers appear on left and project across
  //        · 4 right panel border ticks up, coverage tick under p1
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
      at(1900, 2);
      at(3400, 3);
      at(5400, 4);
      timers.push(setTimeout(() => !cancelled && run(), 7800));
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
            Four service-box corners detected in a tripod-view tennis court
            (left) are used to solve a 3×3 homography H. Applying H projects
            every pixel — players, ball bounces — into a top-down court in
            meters (right). The mapping is refit per game to absorb tripod
            drift.
          </desc>
          <defs>
            <pattern
              id="thp-scanlines"
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
            04 · court homography
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
            pixels → meters
          </text>

          {/* ===== Panel labels (above each panel) ===== */}
          <text
            x={174}
            y={46}
            textAnchor="middle"
            fontSize="9"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            tripod view · pixels
          </text>
          <text
            x={546}
            y={46}
            textAnchor="middle"
            fontSize="9"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            top-down · meters
          </text>

          {/* ============================================================ */}
          {/* LEFT PANEL — tripod view trapezoid                            */}
          {/* ============================================================ */}
          <rect
            x={24}
            y={60}
            width={300}
            height={220}
            fill="url(#thp-scanlines)"
          />
          <rect
            x={24}
            y={60}
            width={300}
            height={220}
            fill="rgb(var(--foreground) / 0.02)"
            stroke="rgb(var(--border))"
            strokeWidth={0.8}
          />

          {/* trapezoid outer court */}
          <polygon
            points={`${L.blTL.x},${L.blTL.y} ${L.blTR.x},${L.blTR.y} ${L.blBR.x},${L.blBR.y} ${L.blBL.x},${L.blBL.y}`}
            fill="none"
            stroke="rgb(var(--border))"
            strokeWidth={0.9}
          />
          {/* service boxes inside trapezoid */}
          <polygon
            points={`${L.svcTL.x},${L.svcTL.y} ${L.svcTR.x},${L.svcTR.y} ${L.svcBR.x},${L.svcBR.y} ${L.svcBL.x},${L.svcBL.y}`}
            fill="none"
            stroke="rgb(var(--border))"
            strokeWidth={0.7}
            opacity={0.7}
          />
          {/* center service line down the middle of the service-box rectangle */}
          <line
            x1={(L.svcTL.x + L.svcTR.x) / 2}
            y1={L.svcTL.y}
            x2={(L.svcBL.x + L.svcBR.x) / 2}
            y2={L.svcBL.y}
            stroke="rgb(var(--border))"
            strokeWidth={0.5}
            opacity={0.55}
          />
          {/* net (mid-court horizontal in tripod view) */}
          <line
            x1={L.netL.x}
            y1={L.netL.y}
            x2={L.netR.x}
            y2={L.netR.y}
            stroke="rgb(var(--foreground))"
            strokeWidth={0.9}
            opacity={0.55}
          />

          {/* corner markers (the 4 RANSAC pts) — fade in sequentially */}
          {CORNER_PAIRS.map((p, i) => (
            <motion.g
              key={`l-corner-${i}`}
              initial={false}
              animate={{ opacity: show(1) ? 1 : 0 }}
              transition={{
                duration: 0.4,
                ease,
                delay: reduced ? 0 : show(1) ? 0.15 + i * 0.2 : 0,
              }}
            >
              <circle
                cx={p.l.x}
                cy={p.l.y}
                r={4.5}
                fill="none"
                stroke="rgb(var(--foreground))"
                strokeWidth={1}
              />
              <circle
                cx={p.l.x}
                cy={p.l.y}
                r={1.8}
                fill="rgb(var(--foreground))"
              />
            </motion.g>
          ))}

          {/* ============================================================ */}
          {/* RIGHT PANEL — top-down meters                                 */}
          {/* ============================================================ */}
          <rect
            x={396}
            y={60}
            width={300}
            height={220}
            fill="url(#thp-scanlines)"
          />
          <motion.rect
            x={396}
            y={60}
            width={300}
            height={220}
            fill="rgb(var(--foreground) / 0.02)"
            initial={false}
            animate={{
              stroke: show(4)
                ? "rgb(var(--foreground))"
                : "rgb(var(--border))",
              strokeOpacity: show(4) ? 0.9 : 1,
            }}
            transition={{ duration: 0.4, ease }}
            strokeWidth={show(4) ? 1.1 : 0.8}
          />

          {/* outer doubles rectangle */}
          <rect
            x={R.tl.x}
            y={R.tl.y}
            width={R.tr.x - R.tl.x}
            height={R.br.y - R.tr.y}
            fill="none"
            stroke="rgb(var(--border))"
            strokeWidth={0.9}
          />
          {/* service boxes */}
          <rect
            x={R.svcTL.x}
            y={R.svcTL.y}
            width={R.svcTR.x - R.svcTL.x}
            height={R.svcBL.y - R.svcTL.y}
            fill="none"
            stroke="rgb(var(--border))"
            strokeWidth={0.7}
            opacity={0.7}
          />
          {/* center service line */}
          <line
            x1={(R.svcTL.x + R.svcTR.x) / 2}
            y1={R.svcTL.y}
            x2={(R.svcBL.x + R.svcBR.x) / 2}
            y2={R.svcBL.y}
            stroke="rgb(var(--border))"
            strokeWidth={0.5}
            opacity={0.55}
          />
          {/* singles sideline (slightly inside the doubles outer) */}
          <line
            x1={R.tl.x + 18}
            y1={R.tl.y}
            x2={R.tl.x + 18}
            y2={R.br.y}
            stroke="rgb(var(--border))"
            strokeWidth={0.5}
            opacity={0.45}
          />
          <line
            x1={R.tr.x - 18}
            y1={R.tl.y}
            x2={R.tr.x - 18}
            y2={R.br.y}
            stroke="rgb(var(--border))"
            strokeWidth={0.5}
            opacity={0.45}
          />
          {/* net (vertical) */}
          <line
            x1={R.netT.x}
            y1={R.netT.y}
            x2={R.netB.x}
            y2={R.netB.y}
            stroke="rgb(var(--foreground))"
            strokeWidth={0.9}
            opacity={0.55}
          />

          {/* matching corner markers (appear with correspondences in phase 2) */}
          {CORNER_PAIRS.map((p, i) => (
            <motion.g
              key={`r-corner-${i}`}
              initial={false}
              animate={{ opacity: show(2) ? 1 : 0 }}
              transition={{
                duration: 0.4,
                ease,
                delay: reduced ? 0 : show(2) ? 0.2 + i * 0.12 : 0,
              }}
            >
              <circle
                cx={p.r.x}
                cy={p.r.y}
                r={4.5}
                fill="none"
                stroke="rgb(var(--foreground))"
                strokeWidth={1}
              />
              <circle
                cx={p.r.x}
                cy={p.r.y}
                r={1.8}
                fill="rgb(var(--foreground))"
              />
            </motion.g>
          ))}

          {/* dashed correspondence lines between matched corners — split into
              two halves with a clear gap across the middle H-glyph column so
              the labels (4 PTS / × H) stay legible */}
          {CORNER_PAIRS.map((p, i) => (
            <motion.g
              key={`corr-${i}`}
              initial={false}
              animate={{ opacity: show(2) ? 0.5 : 0 }}
              transition={{
                duration: 0.5,
                ease,
                delay: reduced ? 0 : show(2) ? 0.1 + i * 0.12 : 0,
              }}
            >
              {/* left half: corner → just past the left panel edge */}
              <line
                x1={p.l.x}
                y1={p.l.y}
                x2={332}
                y2={p.l.y}
                stroke="rgb(var(--foreground))"
                strokeWidth={0.6}
                strokeDasharray="2 3"
              />
              {/* right half: just past the right panel edge → corner */}
              <line
                x1={388}
                y1={p.r.y}
                x2={p.r.x}
                y2={p.r.y}
                stroke="rgb(var(--foreground))"
                strokeWidth={0.6}
                strokeDasharray="2 3"
              />
            </motion.g>
          ))}

          {/* ============================================================ */}
          {/* MIDDLE — H glyph + arrow                                      */}
          {/* ============================================================ */}
          <motion.g
            initial={false}
            animate={{ opacity: show(2) ? 1 : 0.18 }}
            transition={{ duration: 0.4, ease }}
          >
            <text
              x={360}
              y={160}
              textAnchor="middle"
              fontSize="7"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              4 pts
            </text>
            <motion.text
              x={360}
              y={180}
              textAnchor="middle"
              fontSize="14"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
              animate={
                phase === 2 && !reduced
                  ? { opacity: [0.4, 1, 0.85, 1] }
                  : { opacity: show(2) ? 1 : 0.4 }
              }
              transition={{ duration: 1.1, ease }}
            >
              × H
            </motion.text>
          </motion.g>

          {/* ============================================================ */}
          {/* PROJECTED PLAYERS + BOUNCE                                    */}
          {/* ============================================================ */}
          {PLAYERS.map((p, i) => {
            const cx = show(3) ? p.to.x : p.from.x;
            const cy = show(3) ? p.to.y : p.from.y;
            return (
              <motion.g
                key={p.id}
                initial={false}
                animate={{ opacity: show(2) ? 1 : 0 }}
                transition={{
                  duration: 0.35,
                  ease,
                  delay: reduced ? 0 : show(2) ? 0.4 + i * 0.1 : 0,
                }}
              >
                {/* faint projection tracer between from/to */}
                <motion.line
                  x1={p.from.x}
                  y1={p.from.y}
                  x2={p.to.x}
                  y2={p.to.y}
                  stroke="rgb(var(--foreground))"
                  strokeWidth={0.5}
                  strokeDasharray="1.5 3"
                  initial={false}
                  animate={{ opacity: show(3) ? 0.4 : 0 }}
                  transition={{ duration: 0.5, ease }}
                />
                <motion.circle
                  r={3.2}
                  fill="rgb(var(--foreground))"
                  initial={false}
                  animate={{ cx, cy }}
                  transition={{
                    duration: reduced ? 0 : 0.8,
                    ease,
                    delay: reduced ? 0 : show(3) ? 0.1 + i * 0.18 : 0,
                  }}
                />
              </motion.g>
            );
          })}

          {/* ball bounce */}
          <motion.g
            initial={false}
            animate={{ opacity: show(2) ? 1 : 0 }}
            transition={{ duration: 0.35, ease, delay: show(2) ? 0.6 : 0 }}
          >
            <motion.line
              x1={BOUNCE.from.x}
              y1={BOUNCE.from.y}
              x2={BOUNCE.to.x}
              y2={BOUNCE.to.y}
              stroke="rgb(var(--foreground))"
              strokeWidth={0.5}
              strokeDasharray="1.5 3"
              initial={false}
              animate={{ opacity: show(3) ? 0.4 : 0 }}
              transition={{ duration: 0.5, ease }}
            />
            <motion.circle
              r={2.2}
              fill="none"
              stroke="rgb(var(--foreground))"
              strokeWidth={1}
              initial={false}
              animate={{
                cx: show(3) ? BOUNCE.to.x : BOUNCE.from.x,
                cy: show(3) ? BOUNCE.to.y : BOUNCE.from.y,
              }}
              transition={{
                duration: reduced ? 0 : 0.8,
                ease,
                delay: show(3) ? 0.32 : 0,
              }}
            />
          </motion.g>

          {/* coverage tick under projected p1 (phase 4) */}
          <motion.line
            x1={PLAYERS[0].to.x - 8}
            y1={PLAYERS[0].to.y + 8}
            x2={PLAYERS[0].to.x + 8}
            y2={PLAYERS[0].to.y + 8}
            stroke="rgb(var(--foreground))"
            strokeWidth={0.8}
            initial={false}
            animate={{ opacity: show(4) ? 0.6 : 0 }}
            transition={{ duration: 0.4, ease }}
          />

          {/* ===== Bottom panel sub-labels ===== */}
          <text
            x={174}
            y={294}
            textAnchor="middle"
            fontSize="7.5"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            ±18 cm near · ±35 cm far
          </text>
          <text
            x={546}
            y={294}
            textAnchor="middle"
            fontSize="7.5"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            23.77 m × 10.97 m
          </text>

          {/* footer */}
          <text
            x={VB_W / 2}
            y={VB_H - 8}
            textAnchor="middle"
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            x' = H x · per-game re-fit
          </text>
        </svg>
      </div>
    </ChartFrame>
  );
}
