import { ChartFrame } from "./ChartFrame";

export type Anchor = "top" | "bottom" | "left" | "right";

export interface FlowNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title?: string;
  items?: string[];
  tone?: "default" | "muted" | "accent";
  badge?: string;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  labelOffset?: [number, number];
  dashed?: boolean;
  waypoints?: [number, number][];
  arrowAtStart?: boolean;
}

interface CutoffLine {
  y: number;
  label: string;
}

export interface SideText {
  x: number;
  y: number;
  text: string;
  anchor?: "start" | "middle" | "end";
}

interface FlowDiagramProps {
  caption: string;
  number?: string;
  meta?: string;
  viewBox: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  cutoff?: CutoffLine;
  sideText?: SideText[];
}

function parseAnchor(
  spec: string,
  nodes: FlowNode[]
): { x: number; y: number; node?: FlowNode; side?: Anchor } {
  if (spec.startsWith("free:")) {
    const [, coords] = spec.split(":");
    const [x, y] = coords.split(",").map((n) => parseFloat(n));
    return { x, y };
  }
  const [id, side = "bottom"] = spec.split(":") as [string, Anchor?];
  const node = nodes.find((n) => n.id === id);
  if (!node) throw new Error(`FlowDiagram: node "${id}" not found`);
  const cx = node.x + node.w / 2;
  const cy = node.y + node.h / 2;
  switch (side) {
    case "top":
      return { x: cx, y: node.y, node, side };
    case "bottom":
      return { x: cx, y: node.y + node.h, node, side };
    case "left":
      return { x: node.x, y: cy, node, side };
    case "right":
      return { x: node.x + node.w, y: cy, node, side };
  }
}

function buildPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  waypoints?: [number, number][]
): string {
  const pts: [number, number][] = [
    [start.x, start.y],
    ...(waypoints ?? []),
    [end.x, end.y],
  ];
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
}

function arrowHead(
  prev: [number, number],
  end: [number, number]
): { points: string } {
  const dx = end[0] - prev[0];
  const dy = end[1] - prev[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const size = 7;
  const baseX = end[0] - ux * size;
  const baseY = end[1] - uy * size;
  const perpX = -uy * (size * 0.55);
  const perpY = ux * (size * 0.55);
  return {
    points: [
      `${end[0]},${end[1]}`,
      `${baseX + perpX},${baseY + perpY}`,
      `${baseX - perpX},${baseY - perpY}`,
    ].join(" "),
  };
}

export function FlowDiagram({
  caption,
  number,
  meta,
  viewBox,
  nodes,
  edges,
  cutoff,
  sideText,
}: FlowDiagramProps) {
  return (
    <ChartFrame caption={caption} number={number} meta={meta}>
      <svg
        viewBox={viewBox}
        className="chart-svg w-full"
        role="img"
        aria-label={caption}
      >
        <defs>
          <pattern
            id="flow-scanlines"
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

        {cutoff && (
          <g>
            <line
              x1={0}
              x2={1000}
              y1={cutoff.y}
              y2={cutoff.y}
              stroke="rgb(var(--foreground))"
              strokeDasharray="4 6"
              strokeWidth="0.7"
              opacity="0.55"
            />
            <text
              x={970}
              y={cutoff.y - 6}
              textAnchor="end"
              fontSize="10"
              fill="rgb(var(--muted))"
              fontFamily="var(--font-mono)"
              style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
            >
              {cutoff.label}
            </text>
          </g>
        )}

        {sideText?.map((t, i) => (
          <text
            key={`side-${i}`}
            x={t.x}
            y={t.y}
            textAnchor={t.anchor ?? "start"}
            fontSize="10"
            fill="rgb(var(--muted))"
            fontFamily="var(--font-mono)"
            style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            {t.text}
          </text>
        ))}

        {edges.map((edge, i) => {
          const start = parseAnchor(edge.from, nodes);
          const end = parseAnchor(edge.to, nodes);
          const d = buildPath(start, end, edge.waypoints);
          const lastSegStart: [number, number] =
            edge.waypoints && edge.waypoints.length > 0
              ? edge.waypoints[edge.waypoints.length - 1]
              : [start.x, start.y];
          const head = arrowHead(lastSegStart, [end.x, end.y]);

          const labelPos = edge.label
            ? {
                x:
                  (start.x + end.x) / 2 +
                  (edge.labelOffset?.[0] ?? 0),
                y:
                  (start.y + end.y) / 2 +
                  (edge.labelOffset?.[1] ?? 0),
              }
            : null;

          return (
            <g key={`edge-${i}`}>
              <path
                d={d}
                fill="none"
                stroke="rgb(var(--foreground))"
                strokeWidth="1.1"
                strokeDasharray={edge.dashed ? "4 4" : "0"}
                opacity={edge.dashed ? 0.55 : 0.85}
              />
              <polygon
                points={head.points}
                fill="rgb(var(--foreground))"
                opacity={edge.dashed ? 0.55 : 0.9}
              />
              {labelPos && edge.label && (
                <g>
                  <rect
                    x={labelPos.x - edge.label.length * 3.2}
                    y={labelPos.y - 8}
                    width={edge.label.length * 6.4}
                    height={14}
                    fill="rgb(var(--background))"
                    opacity="0.92"
                  />
                  <text
                    x={labelPos.x}
                    y={labelPos.y + 2}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill="rgb(var(--muted))"
                    fontFamily="var(--font-mono)"
                    style={{
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                    }}
                  >
                    {edge.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {nodes.map((node) => {
          const tint =
            node.tone === "accent"
              ? "rgb(var(--foreground) / 0.07)"
              : node.tone === "muted"
              ? "rgb(var(--foreground) / 0.015)"
              : "rgb(var(--foreground) / 0.035)";
          const stroke =
            node.tone === "accent"
              ? "rgb(var(--foreground))"
              : "rgb(var(--border))";
          const strokeWidth = node.tone === "accent" ? 1.2 : 0.9;

          return (
            <g key={node.id}>
              <rect
                x={node.x}
                y={node.y}
                width={node.w}
                height={node.h}
                fill="url(#flow-scanlines)"
              />
              <rect
                x={node.x}
                y={node.y}
                width={node.w}
                height={node.h}
                fill={tint}
                stroke={stroke}
                strokeWidth={strokeWidth}
              />
              <polygon
                points={`${node.x + node.w - 8},${node.y} ${node.x + node.w},${node.y} ${node.x + node.w},${node.y + 8}`}
                fill="rgb(var(--foreground))"
                opacity="0.55"
              />
              {node.badge && (
                <text
                  x={node.x + 10}
                  y={node.y + 14}
                  fontSize="8.5"
                  fill="rgb(var(--muted))"
                  fontFamily="var(--font-mono)"
                  style={{
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                  }}
                >
                  {node.badge}
                </text>
              )}
              {node.title && (
                <text
                  x={node.x + 14}
                  y={node.y + (node.badge ? 32 : 22)}
                  fontSize="12"
                  fill="rgb(var(--foreground))"
                  fontFamily="var(--font-mono)"
                  fontWeight="500"
                  style={{ letterSpacing: "0.04em" }}
                >
                  {node.title}
                </text>
              )}
              {node.items?.map((item, idx) => (
                <text
                  key={`${node.id}-item-${idx}`}
                  x={node.x + 14}
                  y={
                    node.y +
                    (node.badge ? 32 : 22) +
                    (node.title ? 18 : 0) +
                    idx * 14
                  }
                  fontSize="10"
                  fill="rgb(var(--foreground) / 0.75)"
                  fontFamily="var(--font-mono)"
                  style={{ letterSpacing: "0.02em" }}
                >
                  {item}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </ChartFrame>
  );
}
