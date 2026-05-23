"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "./ChartFrame";

interface Source {
  label: string;
  manifest: string;
}

interface ContextFactoryProps {
  caption: string;
  number?: string;
  meta?: string;
  sources?: Source[];
  steps?: string[];
  bundleLabel?: string;
  throughput?: { from: number; to: number; multiplier: string };
}

const DEFAULT_SOURCES: Source[] = [
  { label: "notion", manifest: "4 docs" },
  { label: "granola", manifest: "2 transcripts" },
  { label: "prior prs", manifest: "7 diffs" },
  { label: "repo", manifest: "9 files" },
];

const DEFAULT_STEPS = ["triage", "branch", "scaffold", "review", "pr desc", "tests"];

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 760;
const VB_H = 340;

export function ContextFactory({
  caption,
  number,
  meta = "14 → 31 closed / cycle · 2.2×",
  sources = DEFAULT_SOURCES,
  steps = DEFAULT_STEPS,
  bundleLabel = "smallest relevant slice",
  throughput = { from: 14, to: 31, multiplier: "2.2×" },
}: ContextFactoryProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();

  // phase: 1 sources · 2 plumbing+bundle · 3 handoff · 4 conveyor+counter
  const [phase, setPhase] = useState(0);
  const [count, setCount] = useState(throughput.from);

  useEffect(() => {
    if (reduced) {
      setPhase(4);
      setCount(throughput.to);
      return;
    }
    if (!inView) return;
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2800),
      setTimeout(() => setPhase(4), 4000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [inView, reduced, throughput.to]);

  useEffect(() => {
    if (phase < 4 || reduced) return;
    const start = performance.now();
    const dur = 1100;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(
        Math.round(throughput.from + (throughput.to - throughput.from) * eased)
      );
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reduced, throughput.from, throughput.to]);

  const show = (p: number) => phase >= p;

  const srcY = (i: number) => 56 + i * 62;
  const stepY = (i: number) => 50 + i * 42;
  const bundleY = 90;
  const bundleH = 160;

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
            Context from Notion, Granola, prior PRs and the repo is fetched and
            fused into one minimal slice, handed to Claude at each dev step;
            throughput rises from {throughput.from} to {throughput.to} closed
            tickets per cycle.
          </desc>
          <defs>
            <pattern
              id="factory-scanlines"
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

          {/* plumbing paths source → bundle */}
          {sources.map((s, i) => (
            <motion.path
              key={`path-${s.label}`}
              d={`M 150 ${srcY(i) + 18} C 200 ${srcY(i) + 18}, 200 ${
                bundleY + bundleH / 2
              }, 250 ${bundleY + bundleH / 2}`}
              fill="none"
              stroke="rgb(var(--foreground))"
              strokeWidth={0.9}
              opacity={0.5}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: show(2) ? 1 : 0 }}
              transition={{
                duration: reduced ? 0 : 0.7,
                ease,
                delay: reduced ? 0 : show(2) ? i * 0.1 : 0,
              }}
            />
          ))}

          {/* handoff connector bundle → steps */}
          <motion.path
            d={`M 380 ${bundleY + bundleH / 2} L 440 ${bundleY + bundleH / 2}`}
            fill="none"
            stroke="rgb(var(--foreground))"
            strokeWidth={0.9}
            opacity={0.5}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: show(3) ? 1 : 0 }}
            transition={{ duration: reduced ? 0 : 0.4, ease }}
          />

          {/* source chips */}
          {sources.map((s, i) => (
            <motion.g
              key={s.label}
              initial={false}
              animate={{ opacity: show(1) ? 1 : 0, x: show(1) ? 0 : -8 }}
              transition={{
                duration: 0.4,
                ease,
                delay: reduced ? 0 : show(1) ? i * 0.1 : 0,
              }}
            >
              <rect
                x={24}
                y={srcY(i)}
                width={120}
                height={36}
                fill="url(#factory-scanlines)"
              />
              <rect
                x={24}
                y={srcY(i)}
                width={120}
                height={36}
                fill="rgb(var(--foreground) / 0.035)"
                stroke="rgb(var(--border))"
                strokeWidth={0.9}
              />
              <text
                x={34}
                y={srcY(i) + 15}
                fontSize="8.5"
                fill="rgb(var(--muted))"
                fontFamily="var(--font-mono)"
                style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
              >
                {s.label}
              </text>
              <text
                x={34}
                y={srcY(i) + 28}
                fontSize="9.5"
                fill="rgb(var(--foreground) / 0.75)"
                fontFamily="var(--font-mono)"
              >
                {s.manifest}
              </text>
            </motion.g>
          ))}

          {/* context bundle */}
          <motion.g
            initial={false}
            animate={{ opacity: show(2) ? 1 : 0.25 }}
            transition={{ duration: 0.5, ease }}
          >
            <rect
              x={250}
              y={bundleY}
              width={130}
              height={bundleH}
              fill="url(#factory-scanlines)"
            />
            <motion.rect
              x={250}
              y={bundleY}
              width={130}
              height={bundleH}
              fill="rgb(var(--foreground) / 0.05)"
              initial={false}
              animate={{
                stroke: show(2)
                  ? "rgb(var(--foreground))"
                  : "rgb(var(--border))",
              }}
              transition={{ duration: 0.6, ease }}
              strokeWidth={1.1}
            />
            <text
              x={262}
              y={bundleY + 20}
              fontSize="8.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              context slice
            </text>
            {sources.map((s, i) => (
              <motion.text
                key={`mani-${s.label}`}
                x={262}
                y={bundleY + 44 + i * 18}
                fontSize="9.5"
                fill="rgb(var(--foreground) / 0.8)"
                fontFamily="var(--font-mono)"
                initial={false}
                animate={{ opacity: show(2) ? 1 : 0.2 }}
                transition={{
                  duration: 0.4,
                  ease,
                  delay: reduced ? 0 : show(2) ? 0.3 + i * 0.1 : 0,
                }}
              >
                {`${s.label} · ${s.manifest}`}
              </motion.text>
            ))}
            <text
              x={262}
              y={bundleY + bundleH - 12}
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              {bundleLabel}
            </text>
          </motion.g>

          {/* claude dev steps */}
          {steps.map((step, i) => (
            <motion.g
              key={step}
              initial={false}
              animate={{ opacity: show(3) ? 1 : 0, y: show(3) ? 0 : 6 }}
              transition={{
                duration: 0.35,
                ease,
                delay: reduced ? 0 : show(3) ? i * 0.08 : 0,
              }}
            >
              <rect
                x={440}
                y={stepY(i)}
                width={150}
                height={30}
                fill="rgb(var(--foreground) / 0.025)"
                stroke="rgb(var(--border))"
                strokeWidth={0.8}
              />
              <text
                x={452}
                y={stepY(i) + 19}
                fontSize="8"
                fill="rgb(var(--foreground) / 0.7)"
                fontFamily="var(--font-mono)"
                style={{ letterSpacing: "0.14em" }}
              >
                [c]
              </text>
              <text
                x={478}
                y={stepY(i) + 19}
                fontSize="10"
                fill="rgb(var(--foreground))"
                fontFamily="var(--font-mono)"
                style={{ letterSpacing: "0.04em" }}
              >
                {step}
              </text>
            </motion.g>
          ))}

          {/* conveyor tickets */}
          {[0, 1, 2].map((t) => (
            <motion.rect
              key={`ticket-${t}`}
              y={312}
              width={9}
              height={9}
              fill="rgb(var(--foreground))"
              initial={false}
              animate={
                show(4)
                  ? { x: [90, 690], opacity: [0, 1, 1, 0.3] }
                  : { x: 90, opacity: 0 }
              }
              transition={{
                duration: reduced ? 0 : 0.9,
                ease,
                delay: reduced ? 0 : t * 0.3,
              }}
            />
          ))}

          {/* output counter */}
          <motion.g
            initial={false}
            animate={{ opacity: show(1) ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          >
            <text
              x={690}
              y={150}
              textAnchor="middle"
              fontSize="34"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.02em" }}
            >
              {count}
            </text>
            <text
              x={690}
              y={170}
              textAnchor="middle"
              fontSize="8"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              closed / cycle
            </text>
            <motion.text
              x={690}
              y={196}
              textAnchor="middle"
              fontSize="12"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em" }}
              initial={false}
              animate={{ opacity: count >= throughput.to ? 1 : 0 }}
              transition={{ duration: 0.4, ease }}
            >
              {throughput.multiplier}
            </motion.text>
          </motion.g>
        </svg>
      </div>
    </ChartFrame>
  );
}
