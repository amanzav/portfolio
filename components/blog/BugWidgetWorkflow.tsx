"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { ChartFrame } from "./ChartFrame";

interface Step {
  label: string;
  sub: string;
}

interface BugWidgetWorkflowProps {
  caption: string;
  number?: string;
  meta?: string;
  report?: string;
  steps?: Step[];
}

const DEFAULT_REPORT = "csv export 500s on accounts >10k rows";

const DEFAULT_STEPS: Step[] = [
  { label: "triage", sub: "classify · route" },
  { label: "agent fix", sub: "claude writes patch" },
  { label: "qa", sub: "tests · checks" },
  { label: "review", sub: "engineer confirms" },
  { label: "merged", sub: "shipped" },
];

const ease = [0.22, 1, 0.36, 1] as const;
const VB_W = 720;
const VB_H = 396;

export function BugWidgetWorkflow({
  caption,
  number,
  meta = "report → triage → fix → qa → merge",
  report = DEFAULT_REPORT,
  steps = DEFAULT_STEPS,
}: BugWidgetWorkflowProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduced = useReducedMotion();

  // 0 idle · 1 modal · 2 typing · 3 enter · 4-8 workflow steps 0..4
  const [phase, setPhase] = useState(0);
  const [typed, setTyped] = useState(0);

  // looping phase machine
  useEffect(() => {
    if (reduced) {
      setPhase(8);
      setTyped(report.length);
      return;
    }
    if (!inView) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, p: number) =>
      timers.push(setTimeout(() => !cancelled && setPhase(p), ms));
    const run = () => {
      setPhase(0);
      setTyped(0);
      at(900, 1);
      at(1600, 2);
      at(3500, 3);
      at(4100, 4);
      at(5200, 5);
      at(6300, 6);
      at(7400, 7);
      at(8500, 8);
      timers.push(setTimeout(() => !cancelled && run(), 12000));
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced, report.length]);

  // type-in during phase 2
  useEffect(() => {
    if (reduced || phase !== 2) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(Math.min(i, report.length));
      if (i >= report.length) clearInterval(id);
    }, 50);
    return () => clearInterval(id);
  }, [phase, reduced, report.length]);

  const show = (p: number) => phase >= p;
  const currentStep = phase >= 4 ? phase - 4 : -1;
  const appDim = show(4);

  // node geometry
  const nodeW = 116;
  const nodeH = 84;
  const nodeY = 286;
  const nodeX = (i: number) => 30 + i * (nodeW + 20);

  const text = report.slice(0, typed);

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
            A user reports a bug through an in-app widget; it is triaged, an
            agent writes the fix, QA runs, an engineer confirms, and it merges.
          </desc>
          <defs>
            <pattern
              id="bug-scanlines"
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

          {/* ===== app mockup ===== */}
          <motion.g
            initial={false}
            animate={{ opacity: appDim ? 0.22 : 1 }}
            transition={{ duration: 0.6, ease }}
          >
            <rect
              x={30}
              y={20}
              width={660}
              height={216}
              fill="url(#bug-scanlines)"
            />
            <rect
              x={30}
              y={20}
              width={660}
              height={216}
              fill="rgb(var(--foreground) / 0.02)"
              stroke="rgb(var(--border))"
              strokeWidth={0.9}
            />
            {/* window chrome */}
            <line
              x1={30}
              x2={690}
              y1={48}
              y2={48}
              stroke="rgb(var(--border))"
              strokeWidth={0.8}
            />
            {[48, 62, 76].map((cx) => (
              <circle
                key={cx}
                cx={cx}
                cy={34}
                r={3}
                fill="rgb(var(--foreground) / 0.3)"
              />
            ))}
            <rect
              x={300}
              y={30}
              width={120}
              height={8}
              fill="rgb(var(--foreground) / 0.08)"
            />
            {/* sidebar */}
            <rect
              x={44}
              y={64}
              width={92}
              height={168}
              fill="rgb(var(--foreground) / 0.025)"
            />
            {[78, 98, 118, 138].map((y) => (
              <rect
                key={y}
                x={56}
                y={y}
                width={64}
                height={6}
                fill="rgb(var(--foreground) / 0.12)"
              />
            ))}
            {/* content rows */}
            {[72, 110, 148, 186].map((y) => (
              <g key={y}>
                <rect
                  x={156}
                  y={y}
                  width={510}
                  height={28}
                  fill="rgb(var(--foreground) / 0.02)"
                  stroke="rgb(var(--border))"
                  strokeWidth={0.6}
                />
                <rect
                  x={170}
                  y={y + 11}
                  width={180 + ((y * 7) % 200)}
                  height={6}
                  fill="rgb(var(--foreground) / 0.1)"
                />
              </g>
            ))}
          </motion.g>

          {/* ===== widget button (+) ===== */}
          <motion.g
            initial={false}
            animate={{
              opacity: appDim ? 0.22 : 1,
              scale: show(1) ? 0.85 : 1,
            }}
            transition={{ duration: 0.4, ease }}
            style={{ transformOrigin: "660px 204px" }}
          >
            <motion.circle
              cx={660}
              cy={204}
              r={17}
              fill="rgb(var(--foreground) / 0.06)"
              stroke="rgb(var(--foreground))"
              strokeWidth={1.1}
              animate={
                phase === 0 && !reduced
                  ? { opacity: [0.6, 1, 0.6] }
                  : { opacity: 1 }
              }
              transition={
                phase === 0
                  ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.3 }
              }
            />
            <motion.g
              initial={false}
              animate={{ rotate: show(1) ? 45 : 0 }}
              transition={{ duration: 0.4, ease }}
              style={{ transformOrigin: "660px 204px" }}
            >
              <line
                x1={652}
                x2={668}
                y1={204}
                y2={204}
                stroke="rgb(var(--foreground))"
                strokeWidth={1.6}
              />
              <line
                x1={660}
                x2={660}
                y1={196}
                y2={212}
                stroke="rgb(var(--foreground))"
                strokeWidth={1.6}
              />
            </motion.g>
          </motion.g>

          {/* ===== modal ===== */}
          <motion.g
            initial={false}
            animate={{
              opacity: show(1) && !show(4) ? 1 : 0,
              y: show(1) ? 0 : 8,
              scale: show(1) ? 1 : 0.95,
            }}
            transition={{ duration: 0.35, ease }}
            style={{ transformOrigin: "550px 200px" }}
          >
            <rect
              x={424}
              y={120}
              width={248}
              height={108}
              fill="rgb(var(--background))"
              stroke="rgb(var(--foreground) / 0.5)"
              strokeWidth={1.1}
            />
            <text
              x={438}
              y={142}
              fontSize="9"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              report a bug
            </text>
            <text
              x={656}
              y={142}
              fontSize="11"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              textAnchor="middle"
            >
              ×
            </text>
            {/* input */}
            <rect
              x={438}
              y={152}
              width={220}
              height={30}
              fill="rgb(var(--foreground) / 0.03)"
              stroke="rgb(var(--border))"
              strokeWidth={0.8}
            />
            <text
              x={446}
              y={171}
              fontSize="9"
              fill="rgb(var(--foreground) / 0.9)"
              fontFamily="var(--font-mono)"
            >
              {text}
              {phase === 2 && (
                <tspan className="animate-blink-cursor" fill="rgb(var(--foreground))">
                  ▌
                </tspan>
              )}
            </text>
            {/* enter hint / button */}
            <motion.rect
              x={596}
              y={196}
              width={62}
              height={22}
              fill={
                show(3)
                  ? "rgb(var(--foreground) / 0.85)"
                  : "rgb(var(--foreground) / 0.06)"
              }
              stroke="rgb(var(--foreground) / 0.5)"
              strokeWidth={0.8}
              animate={phase === 3 ? { scale: [1, 0.92, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{ transformOrigin: "627px 207px" }}
            />
            <text
              x={627}
              y={211}
              fontSize="8.5"
              textAnchor="middle"
              fill={
                show(3) ? "rgb(var(--background))" : "rgb(var(--foreground) / 0.7)"
              }
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              ↵ send
            </text>
          </motion.g>

          {/* ===== report chip travelling to workflow ===== */}
          <motion.g
            initial={false}
            animate={{
              opacity: phase === 3 || phase === 4 ? 1 : 0,
              x: show(4) ? nodeX(0) + nodeW / 2 - 550 : 0,
              y: show(4) ? nodeY - 220 : 10,
            }}
            transition={{ duration: 0.7, ease }}
          >
            <rect
              x={524}
              y={188}
              width={52}
              height={18}
              fill="rgb(var(--foreground) / 0.12)"
              stroke="rgb(var(--foreground) / 0.5)"
              strokeWidth={0.8}
            />
            <text
              x={550}
              y={200}
              fontSize="8"
              textAnchor="middle"
              fill="rgb(var(--foreground))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.1em" }}
            >
              bug #4827
            </text>
          </motion.g>

          {/* ===== workflow ===== */}
          <motion.text
            x={VB_W / 2}
            y={262}
            textAnchor="middle"
            fontSize="9"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
            initial={false}
            animate={{ opacity: show(4) ? 1 : 0 }}
            transition={{ duration: 0.4, ease }}
          >
            automated fix pipeline
          </motion.text>

          {/* connectors */}
          {steps.slice(0, -1).map((_, i) => {
            const done = currentStep > i;
            return (
              <motion.line
                key={`conn-${i}`}
                x1={nodeX(i) + nodeW}
                x2={nodeX(i + 1)}
                y1={nodeY + nodeH / 2}
                y2={nodeY + nodeH / 2}
                stroke="rgb(var(--foreground))"
                strokeWidth={1}
                initial={false}
                animate={{ opacity: show(4) ? (done ? 0.8 : 0.25) : 0 }}
                transition={{ duration: 0.4, ease }}
              />
            );
          })}

          {/* nodes */}
          {steps.map((step, i) => {
            const status =
              currentStep > i
                ? "done"
                : currentStep === i
                ? "active"
                : "pending";
            const isLast = i === steps.length - 1;
            const accent = status === "done" && isLast;
            const x = nodeX(i);
            const cxIcon = x + nodeW / 2;
            const cyIcon = nodeY + 60;
            return (
              <motion.g
                key={step.label}
                initial={false}
                animate={{ opacity: show(4) ? 1 : 0, y: show(4) ? 0 : 10 }}
                transition={{
                  duration: 0.4,
                  ease,
                  delay: reduced ? 0 : show(4) ? i * 0.06 : 0,
                }}
              >
                <rect
                  x={x}
                  y={nodeY}
                  width={nodeW}
                  height={nodeH}
                  fill="url(#bug-scanlines)"
                />
                <rect
                  x={x}
                  y={nodeY}
                  width={nodeW}
                  height={nodeH}
                  fill={
                    accent
                      ? "rgb(var(--foreground) / 0.08)"
                      : status === "active"
                      ? "rgb(var(--foreground) / 0.05)"
                      : "rgb(var(--foreground) / 0.02)"
                  }
                  stroke={
                    status === "pending"
                      ? "rgb(var(--border))"
                      : "rgb(var(--foreground))"
                  }
                  strokeWidth={status === "pending" ? 0.8 : 1.2}
                />
                <text
                  x={x + 10}
                  y={nodeY + 16}
                  fontSize="8"
                  fill="rgb(var(--muted))"
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.18em" }}
                >
                  {`0${i + 1}`}
                </text>
                <text
                  x={x + nodeW / 2}
                  y={nodeY + 32}
                  textAnchor="middle"
                  fontSize="11"
                  fill={
                    status === "pending"
                      ? "rgb(var(--foreground) / 0.5)"
                      : "rgb(var(--foreground))"
                  }
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.04em" }}
                >
                  {step.label}
                </text>
                <text
                  x={x + nodeW / 2}
                  y={nodeY + 45}
                  textAnchor="middle"
                  fontSize="7.5"
                  fill="rgb(var(--muted))"
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.04em" }}
                >
                  {step.sub}
                </text>

                {/* status icon */}
                {status === "pending" && (
                  <circle
                    cx={cxIcon}
                    cy={cyIcon}
                    r={6}
                    fill="none"
                    stroke="rgb(var(--foreground) / 0.3)"
                    strokeWidth={1}
                  />
                )}
                {status === "active" && (
                  <>
                    <circle
                      cx={cxIcon}
                      cy={cyIcon}
                      r={6}
                      fill="none"
                      stroke="rgb(var(--foreground) / 0.2)"
                      strokeWidth={1.4}
                    />
                    <path
                      d={`M ${cxIcon} ${cyIcon - 6} A 6 6 0 0 1 ${cxIcon + 6} ${cyIcon}`}
                      fill="none"
                      stroke="rgb(var(--foreground))"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from={`0 ${cxIcon} ${cyIcon}`}
                        to={`360 ${cxIcon} ${cyIcon}`}
                        dur="0.9s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </>
                )}
                {status === "done" && (
                  <polyline
                    points={`${cxIcon - 5},${cyIcon} ${cxIcon - 1.5},${
                      cyIcon + 4
                    } ${cxIcon + 5},${cyIcon - 4}`}
                    fill="none"
                    stroke="rgb(var(--foreground))"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>
    </ChartFrame>
  );
}
