import type { ReactNode } from "react";

interface ChartFrameProps {
  caption: string;
  number?: string;
  meta?: string;
  children: ReactNode;
}

export function ChartFrame({ caption, number, meta, children }: ChartFrameProps) {
  return (
    <figure className="my-10">
      <div className="relative border border-border bg-background/85 pixel-corners">
        <div className="flex items-center justify-between border-b border-border bg-foreground/[0.02] px-4 py-2 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-muted">
          <span className="flex items-center gap-2">
            <span className="chart-rec-dot" aria-hidden />
            <span>{number ? `fig ${number} — chart` : "chart"}</span>
          </span>
          {meta && <span className="text-foreground/40">{meta}</span>}
        </div>
        <div className="px-3 py-4 md:px-5 md:py-5">{children}</div>
        <span className="blog-figure-corner" aria-hidden />
      </div>
      <figcaption className="mt-3 flex items-baseline gap-3 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted">
        {number && <span className="text-foreground/60">fig {number}</span>}
        <span>{caption}</span>
      </figcaption>
    </figure>
  );
}
