import { ChartFrame } from "./ChartFrame";

interface Series {
  label: string;
  values: number[];
  tone?: "primary" | "muted";
  dashed?: boolean;
}

interface LineChartProps {
  caption: string;
  number?: string;
  meta?: string;
  series: Series[];
  xLabels: string[];
  yTicks: number[];
  yFormat?: (v: number) => string;
  yMin?: number;
  yMax?: number;
  annotation?: { x: number; label: string };
}

const W = 720;
const H = 300;
const PAD_L = 56;
const PAD_R = 18;
const PAD_T = 28;
const PAD_B = 44;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

export function LineChart({
  caption,
  number,
  meta,
  series,
  xLabels,
  yTicks,
  yFormat = (v) => `${v}`,
  yMin,
  yMax,
  annotation,
}: LineChartProps) {
  const allValues = series.flatMap((s) => s.values);
  const minY = yMin ?? Math.min(...allValues, ...yTicks);
  const maxY = yMax ?? Math.max(...allValues, ...yTicks);
  const yRange = maxY - minY || 1;

  const xCount = Math.max(...series.map((s) => s.values.length));
  const xStep = PLOT_W / Math.max(xCount - 1, 1);

  const toX = (i: number) => PAD_L + i * xStep;
  const toY = (v: number) => PAD_T + PLOT_H - ((v - minY) / yRange) * PLOT_H;

  const points = (vals: number[]) =>
    vals.map((v, i) => `${toX(i).toFixed(2)},${toY(v).toFixed(2)}`).join(" ");

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
            id="chart-scanlines"
            width="2"
            height="3"
            patternUnits="userSpaceOnUse"
          >
            <rect width="2" height="3" fill="transparent" />
            <rect width="2" height="1" y="0" fill="rgb(var(--foreground))" opacity="0.035" />
          </pattern>
          <linearGradient id="chart-fade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--foreground))" stopOpacity="0.18" />
            <stop offset="100%" stopColor="rgb(var(--foreground))" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect
          x={PAD_L}
          y={PAD_T}
          width={PLOT_W}
          height={PLOT_H}
          fill="url(#chart-scanlines)"
        />

        {yTicks.map((t) => (
          <g key={`y-${t}`}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={toY(t)}
              y2={toY(t)}
              stroke="rgb(var(--border))"
              strokeDasharray={t === 0 ? "0" : "2 5"}
              strokeWidth={t === 0 ? 1 : 0.6}
              opacity={t === 0 ? 0.7 : 0.45}
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

        {xLabels.map((lbl, i) => (
          <g key={`x-${i}`}>
            <line
              x1={toX(i)}
              x2={toX(i)}
              y1={PAD_T + PLOT_H}
              y2={PAD_T + PLOT_H + 4}
              stroke="rgb(var(--muted))"
              opacity="0.45"
            />
            <text
              x={toX(i)}
              y={PAD_T + PLOT_H + 18}
              fontSize="9.5"
              textAnchor="middle"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
            >
              {lbl}
            </text>
          </g>
        ))}

        {series.map((s) => {
          const isPrimary = s.tone !== "muted";
          const stroke = isPrimary
            ? "rgb(var(--foreground))"
            : "rgb(var(--muted))";
          return (
            <g key={s.label}>
              {isPrimary && (
                <>
                  <polyline
                    points={points(s.values)}
                    fill="none"
                    stroke="rgb(115 221 255)"
                    strokeWidth="1.4"
                    opacity="0.55"
                    transform="translate(-1.2, 0)"
                  />
                  <polyline
                    points={points(s.values)}
                    fill="none"
                    stroke="rgb(255 92 92)"
                    strokeWidth="1.4"
                    opacity="0.5"
                    transform="translate(1.2, 0)"
                  />
                </>
              )}
              <polyline
                points={points(s.values)}
                fill="none"
                stroke={stroke}
                strokeWidth={isPrimary ? 1.8 : 1.2}
                strokeDasharray={s.dashed ? "4 4" : "0"}
                opacity={isPrimary ? 1 : 0.65}
              />
              {s.values.map((v, i) =>
                isPrimary ? (
                  <circle
                    key={`pt-${s.label}-${i}`}
                    cx={toX(i)}
                    cy={toY(v)}
                    r="2.2"
                    fill="rgb(var(--background))"
                    stroke="rgb(var(--foreground))"
                    strokeWidth="1.2"
                  />
                ) : null
              )}
            </g>
          );
        })}

        {annotation && (
          <g>
            <line
              x1={toX(annotation.x)}
              x2={toX(annotation.x)}
              y1={PAD_T}
              y2={PAD_T + PLOT_H}
              stroke="rgb(var(--foreground))"
              strokeDasharray="2 3"
              opacity="0.4"
            />
            <text
              x={toX(annotation.x) + 6}
              y={PAD_T + 12}
              fontSize="9.5"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              {annotation.label}
            </text>
          </g>
        )}

        <g
          fontFamily="var(--font-mono)"
          fontSize="9.5"
          style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
        >
          {series.map((s, idx) => {
            const isPrimary = s.tone !== "muted";
            const x = PAD_L + 6 + idx * 130;
            return (
              <g key={`legend-${s.label}`}>
                <line
                  x1={x}
                  x2={x + 18}
                  y1={PAD_T - 12}
                  y2={PAD_T - 12}
                  stroke={isPrimary ? "rgb(var(--foreground))" : "rgb(var(--muted))"}
                  strokeWidth={isPrimary ? 1.8 : 1.2}
                  strokeDasharray={s.dashed ? "4 4" : "0"}
                />
                <text
                  x={x + 24}
                  y={PAD_T - 9}
                  fill={
                    isPrimary
                      ? "rgb(var(--foreground))"
                      : "rgb(var(--muted))"
                  }
                >
                  {s.label}
                </text>
              </g>
            );
          })}
        </g>

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
