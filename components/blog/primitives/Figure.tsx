import type { ReactNode } from "react";

interface FigureProps {
  caption: string;
  number?: string;
  children: ReactNode;
  tone?: "default" | "ascii";
}

export function Figure({ caption, number, children, tone = "default" }: FigureProps) {
  return (
    <figure className="my-10">
      <div
        className={`relative border border-border bg-background/80 ${
          tone === "ascii" ? "blog-ascii-frame" : ""
        } pixel-corners`}
      >
        <div className="px-5 py-5 md:px-7 md:py-6">{children}</div>
        <span className="blog-figure-corner" aria-hidden />
      </div>
      <figcaption className="mt-3 flex items-baseline gap-3 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted">
        {number && <span className="text-foreground/60">fig {number}</span>}
        <span>{caption}</span>
      </figcaption>
    </figure>
  );
}
