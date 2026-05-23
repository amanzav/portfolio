"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "@/components/blog/primitives/ChartFrame";

interface Hypothesis {
  summary: string;
  excerptId: string;
}

interface RigCrashIndexerProps {
  caption: string;
  number?: string;
  meta?: string;
  /** Accepted for API compatibility; the simplified chart does not render the
   *  slash-command UI any more — the story is told by the packet boundary. */
  query?: string;
  hypotheses?: Hypothesis[];
}

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 300;

const DEFAULT_HYPOTHESES: Hypothesis[] = [
  { summary: "RF chamber attn step misread", excerptId: "#3814" },
  { summary: "thermal creep past PA limit", excerptId: "#3902" },
];

// deterministic PRNG so SSR + client agree on dot offsets
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

// ── Layout (viewBox 720 × 300) ───────────────────────────────────────────────
// Three columns left → right. Heavy whitespace between them so labels never
// fight for the same pixels.
//
//   col A — Kafka firehose bar              (x  24 .. 160)
//   col B — consumer + three stores         (x 180 .. 444)
//   col C — LLM + cited hypotheses          (x 480 .. 696)
//
// The dashed "constrained packet" wrapper sits inside col B, hugging only the
// digest + excerpts stores. A single beam crosses the gap from the packet to
// the LLM. That's the entire story.

const KAFKA = { x: 60, y: 56, w: 14, h: 184 };

const CONSUMER = { x: 180, y: 78, w: 110, h: 44 };

const STORE_X = 320;
const STORE_W = 120;
const STORE_H = 36;
const STORES = [
  { id: "s3", label: "s3 parquet", sub: "raw blobs", y: 70 },
  { id: "digest", label: "session digest", sub: "summarised", y: 128 },
  { id: "excerpts", label: "log excerpts", sub: "top-k retrievable", y: 186 },
] as const;

// Wrap stores 1 + 2 (digest + excerpts) with 4 px margin.
const PACKET = {
  x: STORE_X - 4,
  y: STORES[1].y - 4,
  w: STORE_W + 8,
  h: STORES[2].y + STORE_H - STORES[1].y + 8,
};

const LLM = { x: 520, y: 70, w: 160, h: 56 };
const RESP = { x: 480, y: 152, w: 216, h: 84 };

export function RigCrashIndexer({
  caption,
  number,
  meta = "8M events/day · constrained packet",
  // query intentionally unused; retained for caller compatibility
  query: _query,
  hypotheses = DEFAULT_HYPOTHESES,
}: RigCrashIndexerProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // Phases:
  //   0 — firehose only
  //   1 — consumer + stores light up, traffic flows to all three
  //   2 — packet wrapper draws around digest+excerpts; beam to LLM lights;
  //       single packet-dot travels; response card appears with citations
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (reduced) {
      setPhase(2);
      return;
    }
    if (!inView) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, p: number) =>
      timers.push(setTimeout(() => !cancelled && setPhase(p), ms));
    const run = () => {
      setPhase(0);
      at(500, 1);
      at(2400, 2);
      timers.push(setTimeout(() => !cancelled && run(), 7000));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced]);

  const firehoseDots = useMemo(() => {
    const rnd = mulberry32(17);
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      offset: rnd(),
      jitter: (rnd() - 0.5) * 4,
    }));
  }, []);

  const show = (p: number) => phase >= p;

  const storeRect = (i: number) => ({
    x: STORE_X,
    y: STORES[i].y,
    w: STORE_W,
    h: STORE_H,
  });

  // Anchors for the packet → LLM beam
  const packetRightX = PACKET.x + PACKET.w;
  const packetMidY = PACKET.y + PACKET.h / 2;
  const llmLeftX = LLM.x;
  const llmCx = LLM.x + LLM.w / 2;
  const llmCy = LLM.y + LLM.h / 2;

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
            A Kafka topic streams roughly eight million rig-events per day. A
            streaming consumer groups them by session and writes to three
            stores: raw blobs to S3, a per-session digest, and a log-excerpts
            index. Only the digest plus top-k excerpts — drawn as a dashed
            constrained packet — are sent to the LLM, which returns cited
            hypotheses. The raw firehose never reaches the model.
          </desc>
          <defs>
            <pattern
              id="rci-scanlines"
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

          {/* ── Column headers (y = 22) ────────────────────────────────── */}
          <text
            x={24}
            y={22}
            fontSize="8"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            stream
          </text>
          <text
            x={180}
            y={22}
            fontSize="8"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            indexer · stores
          </text>
          <text
            x={480}
            y={22}
            fontSize="8"
            fill="rgb(var(--foreground))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            constrained packet → llm
          </text>

          {/* sub-headers (y = 38) */}
          <text
            x={24}
            y={38}
            fontSize="7"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            rig.events · ~8m/day
          </text>
          <text
            x={180}
            y={38}
            fontSize="7"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            group by session_id
          </text>
          <text
            x={480}
            y={38}
            fontSize="7"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            digest + top-k excerpts
          </text>

          {/* ══════════ KAFKA FIREHOSE ══════════ */}
          <rect
            x={KAFKA.x}
            y={KAFKA.y}
            width={KAFKA.w}
            height={KAFKA.h}
            fill="url(#rci-scanlines)"
          />
          <rect
            x={KAFKA.x}
            y={KAFKA.y}
            width={KAFKA.w}
            height={KAFKA.h}
            fill="rgb(var(--foreground) / 0.03)"
            stroke="rgb(var(--border))"
            strokeWidth={0.9}
          />

          {firehoseDots.map((d) => (
            <circle
              key={d.id}
              cx={KAFKA.x + KAFKA.w / 2 + d.jitter}
              cy={KAFKA.y}
              r={1.6}
              fill="rgb(var(--foreground))"
              opacity={0.45}
            >
              {!reduced && (
                <animate
                  attributeName="cy"
                  from={KAFKA.y - 8}
                  to={KAFKA.y + KAFKA.h + 8}
                  dur="3.6s"
                  begin={`${-d.offset * 3.6}s`}
                  repeatCount="indefinite"
                />
              )}
            </circle>
          ))}

          {/* "stays put" badge under the bar — reinforces the headline */}
          <text
            x={KAFKA.x + KAFKA.w / 2}
            y={KAFKA.y + KAFKA.h + 18}
            textAnchor="middle"
            fontSize="7"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            stays put
          </text>

          {/* tap line from firehose into consumer (chevron at consumer left) */}
          <motion.line
            x1={KAFKA.x + KAFKA.w}
            x2={CONSUMER.x}
            y1={CONSUMER.y + CONSUMER.h / 2}
            y2={CONSUMER.y + CONSUMER.h / 2}
            stroke="rgb(var(--border))"
            strokeWidth={0.9}
            initial={false}
            animate={{ opacity: show(1) ? 0.85 : 0.25 }}
            transition={{ duration: 0.4, ease }}
          />
          <motion.polyline
            points={`${CONSUMER.x - 6},${CONSUMER.y + CONSUMER.h / 2 - 3} ${CONSUMER.x},${CONSUMER.y + CONSUMER.h / 2} ${CONSUMER.x - 6},${CONSUMER.y + CONSUMER.h / 2 + 3}`}
            fill="none"
            stroke="rgb(var(--border))"
            strokeWidth={0.9}
            initial={false}
            animate={{ opacity: show(1) ? 0.85 : 0.25 }}
            transition={{ duration: 0.4, ease }}
          />

          {/* ══════════ STREAMING CONSUMER ══════════ */}
          <motion.g
            initial={false}
            animate={{ opacity: show(1) ? 1 : 0.3, y: show(1) ? 0 : 4 }}
            transition={{ duration: 0.45, ease }}
          >
            <rect
              x={CONSUMER.x}
              y={CONSUMER.y}
              width={CONSUMER.w}
              height={CONSUMER.h}
              fill="url(#rci-scanlines)"
            />
            <rect
              x={CONSUMER.x}
              y={CONSUMER.y}
              width={CONSUMER.w}
              height={CONSUMER.h}
              fill="rgb(var(--foreground) / 0.04)"
              stroke="rgb(var(--foreground))"
              strokeWidth={1}
            />
            <text
              x={CONSUMER.x + 10}
              y={CONSUMER.y + 16}
              fontSize="7.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              consumer
            </text>
            <text
              x={CONSUMER.x + 10}
              y={CONSUMER.y + 32}
              fontSize="10"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
            >
              window()
            </text>
          </motion.g>

          {/* ══════════ THREE STORES ══════════ */}
          {STORES.map((s, i) => {
            const r = storeRect(i);
            const inPacket = i === 1 || i === 2;
            const dimmed = show(2) && !inPacket;
            const highlighted = show(2) && inPacket;
            return (
              <motion.g
                key={s.id}
                initial={false}
                animate={{
                  opacity: show(1) ? (dimmed ? 0.4 : 1) : 0,
                  y: show(1) ? 0 : 6,
                }}
                transition={{
                  duration: 0.45,
                  ease,
                  delay: reduced ? 0 : show(1) ? 0.1 + i * 0.1 : 0,
                }}
              >
                {/* connecting line from consumer to this store, drawn first
                    so the store rect covers any nub */}
                <line
                  x1={CONSUMER.x + CONSUMER.w}
                  y1={CONSUMER.y + CONSUMER.h / 2}
                  x2={r.x}
                  y2={r.y + r.h / 2}
                  stroke="rgb(var(--border))"
                  strokeWidth={0.6}
                  opacity={0.55}
                />
                <rect
                  x={r.x}
                  y={r.y}
                  width={r.w}
                  height={r.h}
                  fill="url(#rci-scanlines)"
                />
                <rect
                  x={r.x}
                  y={r.y}
                  width={r.w}
                  height={r.h}
                  fill={
                    highlighted
                      ? "rgb(var(--foreground) / 0.08)"
                      : "rgb(var(--foreground) / 0.035)"
                  }
                  stroke={
                    highlighted
                      ? "rgb(var(--foreground))"
                      : "rgb(var(--border))"
                  }
                  strokeWidth={highlighted ? 1.2 : 0.9}
                />
                <text
                  x={r.x + 10}
                  y={r.y + 16}
                  fontSize="10"
                  fill="rgb(var(--foreground))"
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.04em" }}
                >
                  {s.label}
                </text>
                <text
                  x={r.x + 10}
                  y={r.y + 28}
                  fontSize="7"
                  fill="rgb(var(--muted))"
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
                >
                  {s.sub}
                </text>
              </motion.g>
            );
          })}

          {/* ══════════ CONSTRAINED PACKET WRAPPER ══════════ */}
          <motion.rect
            x={PACKET.x}
            y={PACKET.y}
            width={PACKET.w}
            height={PACKET.h}
            fill="none"
            stroke="rgb(var(--foreground) / 0.85)"
            strokeWidth={1.2}
            strokeDasharray="4 3"
            initial={false}
            animate={{ opacity: show(2) ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          />

          {/* ══════════ RETRIEVAL BEAM (packet → LLM) ══════════ */}
          <motion.line
            x1={packetRightX}
            x2={llmLeftX}
            y1={packetMidY}
            y2={llmCy}
            stroke="rgb(var(--foreground))"
            strokeWidth={1}
            initial={false}
            animate={{ opacity: show(2) ? 0.85 : 0 }}
            transition={{ duration: 0.35, ease }}
          />

          {/* traveling packet dot */}
          <motion.circle
            r={3.4}
            fill="rgb(var(--foreground))"
            initial={false}
            animate={
              phase === 2
                ? {
                    cx: [packetRightX, llmLeftX],
                    cy: [packetMidY, llmCy],
                    opacity: [0, 0.95, 0],
                  }
                : { cx: packetRightX, cy: packetMidY, opacity: 0 }
            }
            transition={{ duration: 1.1, ease, delay: 0.2 }}
          />

          {/* ══════════ LLM BOX ══════════ */}
          <motion.g
            initial={false}
            animate={{
              opacity: show(2) ? 1 : 0.25,
              scale: phase === 2 ? [1, 1.04, 1] : 1,
            }}
            transition={{ duration: 0.5, ease, delay: phase === 2 ? 1.0 : 0 }}
            style={{ transformOrigin: `${llmCx}px ${llmCy}px` }}
          >
            <rect
              x={LLM.x}
              y={LLM.y}
              width={LLM.w}
              height={LLM.h}
              fill="url(#rci-scanlines)"
            />
            <rect
              x={LLM.x}
              y={LLM.y}
              width={LLM.w}
              height={LLM.h}
              fill="rgb(var(--foreground) / 0.05)"
              stroke="rgb(var(--foreground))"
              strokeWidth={1.1}
            />
            <text
              x={LLM.x + LLM.w / 2}
              y={LLM.y + 22}
              textAnchor="middle"
              fontSize="9"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
            >
              llm
            </text>
            <text
              x={LLM.x + LLM.w / 2}
              y={LLM.y + 40}
              textAnchor="middle"
              fontSize="11"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
            >
              schema-gated
            </text>
          </motion.g>

          {/* ══════════ RESPONSE / CITED HYPOTHESES CARD ══════════ */}
          <motion.g
            initial={false}
            animate={{
              opacity: show(2) ? 1 : 0,
              y: show(2) ? 0 : -6,
            }}
            transition={{ duration: 0.5, ease, delay: show(2) ? 1.3 : 0 }}
          >
            <rect
              x={RESP.x}
              y={RESP.y}
              width={RESP.w}
              height={RESP.h}
              fill="rgb(var(--background))"
              stroke="rgb(var(--foreground) / 0.5)"
              strokeWidth={1}
            />
            <text
              x={RESP.x + 12}
              y={RESP.y + 16}
              fontSize="7.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              hypotheses · cited
            </text>
            {hypotheses.slice(0, 2).map((h, i) => {
              const rowY = RESP.y + 40 + i * 24;
              const chipX = RESP.x + RESP.w - 60;
              const chipY = rowY - 10;
              const truncated =
                h.summary.length > 24
                  ? `${h.summary.slice(0, 24)}…`
                  : h.summary;
              return (
                <g key={`hyp-${i}`}>
                  <text
                    x={RESP.x + 12}
                    y={rowY}
                    fontSize="8.5"
                    fill="rgb(var(--foreground) / 0.9)"
                    fontFamily="var(--font-mono)"
                  >
                    {truncated}
                  </text>
                  <rect
                    x={chipX}
                    y={chipY}
                    width={48}
                    height={14}
                    fill="rgb(var(--foreground) / 0.08)"
                    stroke="rgb(var(--foreground) / 0.5)"
                    strokeWidth={0.7}
                  />
                  <text
                    x={chipX + 24}
                    y={rowY}
                    textAnchor="middle"
                    fontSize="7.5"
                    fill="rgb(var(--foreground))"
                    fontFamily="var(--font-mono)"
                    style={{ letterSpacing: "0.1em" }}
                  >
                    {h.excerptId}
                  </text>
                </g>
              );
            })}
          </motion.g>
        </svg>
      </div>
    </ChartFrame>
  );
}
