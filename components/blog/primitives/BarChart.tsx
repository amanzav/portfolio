import { ChartFrame } from "./ChartFrame";

interface Bar {
  label: string;
  value: number;
  highlight?: boolean;
}

interface BarChartProps {
  caption: string;
  number?: string;
  meta?: string;
  bars: Bar[];
  yTicks: number[];
  yMax?: number;
  yFormat?: (v: number) => string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

const W = 720;
const H = 320;
const PAD_L = 64;
const PAD_R = 28;
const PAD_T = 32;
const PAD_B = 64;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

export function BarChart({
  caption,
  number,
  meta,
  bars,
  yTicks,
  yMax,
  yFormat = (v) => `${v}`,
  xAxisLabel,
  yAxisLabel,
}: BarChartProps) {
  const maxY = yMax ?? Math.max(...bars.map((b) => b.value), ...yTicks);
  const minY = Math.min(0, ...yTicks);
  const yRange = maxY - minY || 1;

  const n = bars.length;
  const slot = PLOT_W / n;
  const barW = Math.min(slot * 0.58, 56);

  const toY = (v: number) => PAD_T + PLOT_H - ((v - minY) / yRange) * PLOT_H;
  const slotX = (i: number) => PAD_L + slot * i + slot / 2;

  return (
    <ChartFrame caption={caption} number={number} meta={meta}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart-svg w-full"
        role="img"
        aria-label={caption}
      >
        <defs>
          <pattern
            id="bar-scanlines"
            width="2"
            height="3"
            patternUnits="userSpaceOnUse"
          >
            <rect width="2" height="3" fill="transparent" />
            <rect
              width="2"
              height="1"
              y="0"
              fill="rgb(var(--foreground))"
              opacity="0.04"
            />
          </pattern>
          <linearGradient id="bar-primary" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--foreground))" stopOpacity="0.95" />
            <stop offset="100%" stopColor="rgb(var(--foreground))" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="bar-highlight" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(255 92 92)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="rgb(115 221 255)" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        <rect
          x={PAD_L}
          y={PAD_T}
          width={PLOT_W}
          height={PLOT_H}
          fill="url(#bar-scanlines)"
        />

        {yTicks.map((t) => (
          <g key={`yt-${t}`}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={toY(t)}
              y2={toY(t)}
              stroke="rgb(var(--border))"
              strokeDasharray={t === 0 ? "0" : "2 5"}
              strokeWidth={t === 0 ? 1 : 0.6}
              opacity={t === 0 ? 0.7 : 0.4}
            />
            <text
              x={PAD_L - 10}
              y={toY(t) + 3}
              fontSize="10"
              textAnchor="end"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.08em" }}
            >
              {yFormat(t)}
            </text>
          </g>
        ))}

        {bars.map((bar, i) => {
          const x = slotX(i) - barW / 2;
          const y = toY(bar.value);
          const h = PAD_T + PLOT_H - y;
          const fill = bar.highlight ? "url(#bar-highlight)" : "url(#bar-primary)";
          return (
            <g key={`bar-${bar.label}`}>
              <rect
                x={x - 1.2}
                y={y}
                width={barW}
                height={h}
                fill="rgb(115 221 255)"
                opacity="0.22"
              />
              <rect
                x={x + 1.2}
                y={y}
                width={barW}
                height={h}
                fill="rgb(255 92 92)"
                opacity="0.18"
              />
              <rect x={x} y={y} width={barW} height={h} fill={fill} />
              <rect
                x={x}
                y={y}
                width={barW}
                height="2"
                fill="rgb(var(--foreground))"
                opacity={bar.highlight ? 0.85 : 0.55}
              />
              <text
                x={slotX(i)}
                y={y - 6}
                fontSize="10"
                textAnchor="middle"
                fill={
                  bar.highlight
                    ? "rgb(var(--foreground))"
                    : "rgb(var(--foreground) / 0.85)"
                }
                fontFamily="var(--font-mono)"
                style={{ letterSpacing: "0.08em" }}
              >
                {yFormat(bar.value)}
              </text>
              <text
                x={slotX(i)}
                y={PAD_T + PLOT_H + 16}
                fontSize="9.5"
                textAnchor="middle"
                fill="rgb(var(--muted))"
                fontFamily="var(--font-mono)"
                style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
              >
                {bar.label}
              </text>
            </g>
          );
        })}

        {xAxisLabel && (
          <text
            x={PAD_L + PLOT_W / 2}
            y={PAD_T + PLOT_H + 42}
            fontSize="9.5"
            textAnchor="middle"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            {xAxisLabel}
          </text>
        )}
        {yAxisLabel && (
          <text
            x={20}
            y={PAD_T + PLOT_H / 2}
            fontSize="9.5"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            transform={`rotate(-90, 20, ${PAD_T + PLOT_H / 2})`}
            textAnchor="middle"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            {yAxisLabel}
          </text>
        )}

        <rect
          x={PAD_L}
          y={PAD_T}
          width={PLOT_W}
          height={PLOT_H}
          fill="none"
          stroke="rgb(var(--border))"
          strokeWidth="0.6"
          opacity="0.7"
        />
      </svg>
    </ChartFrame>
  );
}
