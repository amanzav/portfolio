"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { TypingAnimation } from "@/components/ui/typing-animation";
import { ChartFrame } from "@/components/blog/primitives/ChartFrame";

interface Filter {
  label: string;
  value: string;
}

interface SemanticSearchAnimationProps {
  caption: string;
  number?: string;
  meta?: string;
  query?: string;
  filters?: Filter[];
  residual?: { caption: string; weights: number[] };
  pipeline?: string[];
  corpus?: number;
  matches?: number;
  typeSpeed?: number;
}

const DEFAULT_QUERY =
  "ex-Stripe & ex-Square staff+ engineers in NYC who left in 2023, ideally fintech founders now";

const DEFAULT_FILTERS: Filter[] = [
  { label: "prior_company ∈", value: "{ Stripe, Square }" },
  { label: "seniority ≥", value: "Staff" },
  { label: "location", value: "New York, NY" },
  { label: "departure_year", value: "2023" },
];

const DEFAULT_RESIDUAL = {
  caption: '~ "fintech founder, building now"',
  weights: [0.9, 0.2, 0.6, 0.85, 0.15, 0.7, 0.4, 0.8],
};

const DEFAULT_PIPELINE = ["pgvector · HNSW", "ANN top-200", "rerank"];

const ease = [0.22, 1, 0.36, 1] as const;

export function SemanticSearchAnimation({
  caption,
  number,
  meta = "natural language → audience",
  query = DEFAULT_QUERY,
  filters = DEFAULT_FILTERS,
  residual = DEFAULT_RESIDUAL,
  pipeline = DEFAULT_PIPELINE,
  corpus = 2041883,
  matches = 312,
  typeSpeed = 26,
}: SemanticSearchAnimationProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();

  // phase: 0 typing · 1 rewrite/fork · 2 filters+residual · 3 pipeline · 4 result
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (reduced) {
      setPhase(4);
      return;
    }
    if (!inView) return;
    const typeDur = query.length * typeSpeed + 200;
    const timers = [
      setTimeout(() => setPhase(1), typeDur),
      setTimeout(() => setPhase(2), typeDur + 700),
      setTimeout(() => setPhase(3), typeDur + 1500),
      setTimeout(() => setPhase(4), typeDur + 2300),
    ];
    return () => timers.forEach(clearTimeout);
  }, [inView, reduced, query.length, typeSpeed]);

  const show = (p: number) => phase >= p;

  return (
    <ChartFrame caption={caption} number={number} meta={meta}>
      <div ref={ref} className="font-mono text-foreground">
        {/* input box */}
        <div className="border border-border bg-foreground/[0.02] px-3 py-2.5">
          <div className="mb-1.5 text-[0.55rem] uppercase tracking-[0.22em] text-muted">
            search · 2M alumni
          </div>
          <div className="min-h-[2.6em] text-[0.8rem] leading-relaxed text-foreground/90">
            {reduced ? (
              <span>{query}</span>
            ) : inView ? (
              <TypingAnimation
                className="leading-relaxed tracking-normal"
                typeSpeed={typeSpeed}
                cursorStyle="block"
                startOnView={false}
              >
                {query}
              </TypingAnimation>
            ) : null}
          </div>
        </div>

        {/* rewrite label + fork */}
        <motion.div
          className="mt-3 flex items-center gap-2 text-[0.55rem] uppercase tracking-[0.22em] text-muted"
          initial={false}
          animate={{ opacity: show(1) ? 1 : 0 }}
          transition={{ duration: 0.4, ease }}
        >
          <span className="h-px w-6 bg-border" />
          query-rewrite
          <span className="h-px flex-1 bg-border" />
        </motion.div>

        {/* two lanes: hard filters + residual vector */}
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* hard filters */}
          <div className="border border-border bg-foreground/[0.02] p-3">
            <div className="mb-2 text-[0.55rem] uppercase tracking-[0.22em] text-muted">
              hard filters · sql
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filters.map((f, i) => (
                <motion.span
                  key={f.label}
                  className="inline-flex items-center gap-1.5 border border-border px-2 py-1 text-[0.62rem]"
                  initial={false}
                  animate={{
                    opacity: show(2) ? 1 : 0,
                    y: show(2) ? 0 : 8,
                  }}
                  transition={{
                    duration: 0.4,
                    ease,
                    delay: reduced ? 0 : show(2) ? i * 0.09 : 0,
                  }}
                >
                  <span className="text-muted">{f.label}</span>
                  <span className="text-foreground/90">{f.value}</span>
                </motion.span>
              ))}
            </div>
          </div>

          {/* residual vector */}
          <div className="border border-border bg-foreground/[0.02] p-3">
            <div className="mb-2 text-[0.55rem] uppercase tracking-[0.22em] text-muted">
              residual vector · dim 1536
            </div>
            <div className="flex gap-1">
              {residual.weights.map((w, i) => (
                <motion.span
                  key={i}
                  className="h-5 w-3 border border-border"
                  style={{ background: `rgb(var(--foreground) / ${w})` }}
                  initial={false}
                  animate={{ opacity: show(2) ? 1 : 0 }}
                  transition={{
                    duration: 0.3,
                    ease,
                    delay: reduced ? 0 : show(2) ? 0.4 + i * 0.05 : 0,
                  }}
                />
              ))}
            </div>
            <div className="mt-2 text-[0.62rem] text-foreground/70">
              {residual.caption}
            </div>
          </div>
        </div>

        {/* retrieval pipeline */}
        <motion.div
          className="mt-3 flex flex-wrap items-center gap-2"
          initial={false}
          animate={{ opacity: show(3) ? 1 : 0 }}
          transition={{ duration: 0.4, ease }}
        >
          {pipeline.map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              {i > 0 && <span className="text-muted">→</span>}
              <span className="border border-border px-2 py-1 text-[0.6rem] uppercase tracking-[0.14em] text-foreground/80">
                {step}
              </span>
            </span>
          ))}
        </motion.div>

        {/* result */}
        <motion.div
          className="mt-3 flex items-baseline justify-between border border-foreground/40 bg-foreground/[0.05] px-3 py-2"
          initial={false}
          animate={{
            opacity: show(4) ? 1 : 0,
            y: show(4) ? 0 : 6,
          }}
          transition={{ duration: 0.45, ease }}
        >
          <span className="text-[0.55rem] uppercase tracking-[0.22em] text-muted">
            audience
          </span>
          <span className="text-[0.8rem] tracking-tight text-foreground">
            {corpus.toLocaleString()}{" "}
            <span className="text-muted">→</span> {matches} matches
          </span>
        </motion.div>
      </div>
    </ChartFrame>
  );
}
