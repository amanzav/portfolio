"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "@/components/blog/primitives/ChartFrame";

interface SourceSpec {
  label: string;
  manifest: string;
}

interface LeadRankerPipelineProps {
  caption: string;
  number?: string;
  meta?: string;
  // kept for backwards compatibility with existing call sites — unused
  sources?: SourceSpec[];
  dailyEventCount?: number;
  thresholds?: { high: number; low: number };
  seed?: number;
}

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 280;

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

export function LeadRankerPipeline({
  caption,
  number,
  meta = "scrape → score → bucket",
  dailyEventCount = 25,
  thresholds = { high: 0.7, low: 0.3 },
  seed = 7,
}: LeadRankerPipelineProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // phase: 0 idle · 1 scraper pulse · 2 dots stream → xgb
  //        · 3 dots fan out into buckets · 4 tallies tick up
  const [phase, setPhase] = useState(0);
  const [tallyHigh, setTallyHigh] = useState(0);
  const [tallyMid, setTallyMid] = useState(0);
  const [tallyLow, setTallyLow] = useState(0);

  // ===== Layout anchors =====
  const SCRAPER = { x: 24, y: 92, w: 148, h: 80 };
  const XGB = { x: 232, y: 92, w: 132, h: 80 };

  // Bucket panel on the right
  const BUCKET_X = 408;
  const BUCKET_W = 288;
  const BUCKET_H = 52;
  const BUCKET_GAP = 12;
  const BUCKET_Y_HIGH = 56;
  const BUCKET_Y_MID = BUCKET_Y_HIGH + BUCKET_H + BUCKET_GAP; // 120
  const BUCKET_Y_LOW = BUCKET_Y_MID + BUCKET_H + BUCKET_GAP; // 184
  const bucketMidY = (y: number) => y + BUCKET_H / 2;

  // deterministic dot scores
  const dots = useMemo(() => {
    const rnd = mulberry32(seed);
    return Array.from({ length: dailyEventCount }, (_, i) => {
      const raw = rnd();
      const score = Math.max(0, Math.min(1, 0.5 + (raw - 0.5) * 1.55));
      const wob = (rnd() - 0.5) * 16;
      return { i, score, wob };
    });
  }, [dailyEventCount, seed]);

  const highCount = useMemo(
    () => dots.filter((d) => d.score >= thresholds.high).length,
    [dots, thresholds.high]
  );
  const lowCount = useMemo(
    () => dots.filter((d) => d.score <= thresholds.low).length,
    [dots, thresholds.low]
  );
  const midCount = dots.length - highCount - lowCount;

  // looping phase machine
  useEffect(() => {
    if (reduced) {
      setPhase(4);
      setTallyHigh(highCount);
      setTallyMid(midCount);
      setTallyLow(lowCount);
      return;
    }
    if (!inView) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, p: number) =>
      timers.push(setTimeout(() => !cancelled && setPhase(p), ms));
    const run = () => {
      setPhase(0);
      setTallyHigh(0);
      setTallyMid(0);
      setTallyLow(0);
      at(200, 1);
      at(1100, 2);
      at(2400, 3);
      at(3400, 4);
      timers.push(setTimeout(() => !cancelled && run(), 8000));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced, highCount, midCount, lowCount]);

  // tally counter
  useEffect(() => {
    if (reduced) return;
    if (phase < 4) {
      setTallyHigh(0);
      setTallyMid(0);
      setTallyLow(0);
      return;
    }
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setTallyHigh(Math.round(highCount * eased));
      setTallyMid(Math.round(midCount * eased));
      setTallyLow(Math.round(lowCount * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reduced, highCount, midCount, lowCount]);

  const show = (p: number) => phase >= p;

  // Dot position by phase
  const dotPosition = (d: (typeof dots)[number]) => {
    const scraperExit = {
      x: SCRAPER.x + SCRAPER.w,
      y: SCRAPER.y + SCRAPER.h / 2,
    };
    const xgbMid = { x: XGB.x + XGB.w / 2, y: XGB.y + XGB.h / 2 };
    const xgbExit = { x: XGB.x + XGB.w, y: XGB.y + XGB.h / 2 };

    // target bucket position
    const targetY =
      d.score >= thresholds.high
        ? bucketMidY(BUCKET_Y_HIGH)
        : d.score <= thresholds.low
        ? bucketMidY(BUCKET_Y_LOW)
        : bucketMidY(BUCKET_Y_MID);

    if (show(3)) {
      // fanned out into buckets; line up in a small grid inside each bucket,
      // tucked between the sub-label and the count chip
      const bucketIdx =
        d.score >= thresholds.high ? 0 : d.score <= thresholds.low ? 2 : 1;
      const inBucket = dots
        .filter((x) =>
          bucketIdx === 0
            ? x.score >= thresholds.high
            : bucketIdx === 2
            ? x.score <= thresholds.low
            : x.score > thresholds.low && x.score < thresholds.high
        )
        .findIndex((x) => x.i === d.i);
      const COLS = 8;
      const col = inBucket % COLS;
      const row = Math.floor(inBucket / COLS);
      // grid sits in zone x = 528..592 (well clear of count chip ending ~640)
      return {
        x: BUCKET_X + 122 + col * 8,
        y: targetY - 5 + row * 8,
      };
    }
    if (show(2)) {
      // streaming through xgb toward target bucket y
      const t = ((d.i % 10) / 9) * 0.7 + 0.15;
      const startX = scraperExit.x;
      const endX = xgbExit.x + 12;
      return {
        x: startX + (endX - startX) * t,
        y:
          xgbMid.y +
          d.wob * (1 - t) * 0.5 +
          (targetY - xgbMid.y) * Math.max(0, t - 0.4),
      };
    }
    return { x: scraperExit.x - 4, y: scraperExit.y };
  };

  const dotOpacity = (d: (typeof dots)[number]) => {
    if (!show(2)) return 0;
    if (!show(3)) return 0.85;
    if (d.score >= thresholds.high) return 0.95;
    if (d.score <= thresholds.low) return 0.32;
    return 0.65;
  };

  // Bucket descriptor data
  const buckets = [
    {
      y: BUCKET_Y_HIGH,
      label: "same-day outreach",
      sub: `score ≥ ${thresholds.high.toFixed(1)}`,
      count: tallyHigh,
      total: highCount,
      strong: true,
    },
    {
      y: BUCKET_Y_MID,
      label: "triage queue",
      sub: `${thresholds.low.toFixed(1)} – ${thresholds.high.toFixed(1)}`,
      count: tallyMid,
      total: midCount,
      strong: false,
    },
    {
      y: BUCKET_Y_LOW,
      label: "ignored",
      sub: `score ≤ ${thresholds.low.toFixed(1)}`,
      count: tallyLow,
      total: lowCount,
      strong: false,
      faded: true,
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
            A 6 am Playwright scraper pulls about {dailyEventCount} events per
            day. An XGBoost classifier scores each event between 0 and 1, and
            sales acts on the top bucket first — same-day outreach, triage,
            or ignored.
          </desc>
          <defs>
            <pattern
              id="lrp-scanlines"
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
            y={28}
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            06:00 · scraper run
          </text>
          <text
            x={VB_W - 24}
            y={28}
            textAnchor="end"
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            ~{dailyEventCount} events / day
          </text>

          {/* ===== Scraper node ===== */}
          <motion.g
            initial={false}
            animate={{ opacity: show(1) ? 1 : 0.25 }}
            transition={{ duration: 0.4, ease }}
          >
            <rect
              x={SCRAPER.x}
              y={SCRAPER.y}
              width={SCRAPER.w}
              height={SCRAPER.h}
              fill="url(#lrp-scanlines)"
            />
            <motion.rect
              x={SCRAPER.x}
              y={SCRAPER.y}
              width={SCRAPER.w}
              height={SCRAPER.h}
              fill="rgb(var(--foreground) / 0.05)"
              stroke="rgb(var(--foreground))"
              strokeWidth={1}
              animate={
                phase === 1 && !reduced
                  ? { opacity: [1, 0.55, 1] }
                  : { opacity: 1 }
              }
              transition={{ duration: 0.7, ease }}
            />
            <text
              x={SCRAPER.x + 12}
              y={SCRAPER.y + 18}
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              playwright
            </text>
            <text
              x={SCRAPER.x + SCRAPER.w / 2}
              y={SCRAPER.y + 44}
              textAnchor="middle"
              fontSize="13"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
            >
              scraper
            </text>
            <text
              x={SCRAPER.x + SCRAPER.w / 2}
              y={SCRAPER.y + 62}
              textAnchor="middle"
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              4 sources
            </text>
          </motion.g>

          {/* ===== XGBoost node ===== */}
          <motion.g
            initial={false}
            animate={{ opacity: show(2) ? 1 : 0.25 }}
            transition={{ duration: 0.4, ease }}
          >
            <rect
              x={XGB.x}
              y={XGB.y}
              width={XGB.w}
              height={XGB.h}
              fill="url(#lrp-scanlines)"
            />
            <motion.rect
              x={XGB.x}
              y={XGB.y}
              width={XGB.w}
              height={XGB.h}
              fill="rgb(var(--foreground) / 0.05)"
              stroke="rgb(var(--foreground))"
              strokeWidth={1}
              animate={
                phase === 2 && !reduced
                  ? { opacity: [1, 0.6, 1] }
                  : { opacity: 1 }
              }
              transition={{ duration: 0.7, ease }}
            />
            <text
              x={XGB.x + 12}
              y={XGB.y + 18}
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              classifier
            </text>
            <text
              x={XGB.x + XGB.w / 2}
              y={XGB.y + 44}
              textAnchor="middle"
              fontSize="13"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
            >
              xgboost
            </text>
            <text
              x={XGB.x + XGB.w / 2}
              y={XGB.y + 62}
              textAnchor="middle"
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              score 0 → 1
            </text>
          </motion.g>

          {/* connector scraper → xgb */}
          <line
            x1={SCRAPER.x + SCRAPER.w}
            y1={SCRAPER.y + SCRAPER.h / 2}
            x2={XGB.x}
            y2={XGB.y + XGB.h / 2}
            stroke="rgb(var(--border))"
            strokeWidth={0.9}
          />

          {/* fan-out from xgb to the 3 buckets, drawn faintly */}
          {[BUCKET_Y_HIGH, BUCKET_Y_MID, BUCKET_Y_LOW].map((by, idx) => (
            <line
              key={`fan-${idx}`}
              x1={XGB.x + XGB.w}
              y1={XGB.y + XGB.h / 2}
              x2={BUCKET_X}
              y2={bucketMidY(by)}
              stroke="rgb(var(--border))"
              strokeWidth={0.7}
              opacity={0.6}
            />
          ))}

          {/* ===== 3 bucket rows ===== */}
          {buckets.map((b, idx) => (
            <motion.g
              key={`bucket-${idx}`}
              initial={false}
              animate={{ opacity: show(1) ? 1 : 0 }}
              transition={{
                duration: 0.5,
                ease,
                delay: reduced ? 0 : 0.1 + idx * 0.07,
              }}
            >
              <rect
                x={BUCKET_X}
                y={b.y}
                width={BUCKET_W}
                height={BUCKET_H}
                fill="url(#lrp-scanlines)"
              />
              <motion.rect
                x={BUCKET_X}
                y={b.y}
                width={BUCKET_W}
                height={BUCKET_H}
                fill={
                  b.strong
                    ? "rgb(var(--foreground) / 0.06)"
                    : "rgb(var(--foreground) / 0.025)"
                }
                initial={false}
                animate={{
                  stroke:
                    show(3) && b.strong
                      ? "rgb(var(--foreground))"
                      : "rgb(var(--border))",
                }}
                transition={{ duration: 0.3, ease }}
                strokeWidth={show(3) && b.strong ? 1.3 : 0.9}
              />
              {/* label */}
              <text
                x={BUCKET_X + 14}
                y={b.y + 20}
                fontSize="9"
                fill={
                  b.faded
                    ? "rgb(var(--foreground) / 0.55)"
                    : "rgb(var(--foreground))"
                }
                fontFamily="var(--font-mono)"
                style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
              >
                {b.label}
              </text>
              {/* sub */}
              <text
                x={BUCKET_X + 14}
                y={b.y + 36}
                fontSize="8"
                fill="rgb(var(--muted))"
                fontFamily="var(--font-mono)"
                style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
              >
                {b.sub}
              </text>
              {/* count chip - right side, far enough from where dots sit */}
              <text
                x={BUCKET_X + BUCKET_W - 14}
                y={b.y + 32}
                textAnchor="end"
                fontSize="16"
                fill={
                  b.faded
                    ? "rgb(var(--foreground) / 0.55)"
                    : "rgb(var(--foreground))"
                }
                fontFamily="var(--font-mono)"
              >
                {b.count}
              </text>
            </motion.g>
          ))}

          {/* ===== dots ===== */}
          {dots.map((d) => {
            const pos = dotPosition(d);
            return (
              <motion.circle
                key={`dot-${d.i}`}
                r={2.2}
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
                    ? (d.i % 8) * 0.04
                    : show(2)
                    ? (d.i % 10) * 0.04
                    : 0,
                }}
              />
            );
          })}

          {/* ===== Footer ===== */}
          <text
            x={VB_W / 2}
            y={VB_H - 14}
            textAnchor="middle"
            fontSize="8"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            noise in · ranked out · sales sorts on score every morning
          </text>
        </svg>
      </div>
    </ChartFrame>
  );
}
