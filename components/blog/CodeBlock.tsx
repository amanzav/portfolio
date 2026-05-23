import type { ReactNode } from "react";

interface CodeBlockProps {
  lang?: string;
  caption?: string;
  children: ReactNode;
}

export function CodeBlock({ lang, caption, children }: CodeBlockProps) {
  return (
    <div className="my-8">
      <div className="relative border border-border bg-background/85 pixel-corners">
        <div className="flex items-center justify-between border-b border-border bg-foreground/[0.02] px-4 py-2 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-muted">
          <span>{lang ?? "src"}</span>
          <span className="text-foreground/40">{"// "}excerpt</span>
        </div>
        <pre className="overflow-x-auto px-4 py-4 font-mono text-[0.78rem] leading-6 text-foreground/85 md:text-[0.82rem]">
          <code>{children}</code>
        </pre>
        <span className="blog-figure-corner" aria-hidden />
      </div>
      {caption && (
        <p className="mt-3 truncate text-center font-mono text-[0.58rem] uppercase tracking-[0.16em] text-muted">
          {caption}
        </p>
      )}
    </div>
  );
}
