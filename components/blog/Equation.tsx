import katex from "katex";

interface EquationProps {
  tex: string;
  label?: string;
  display?: boolean;
}

export function Equation({ tex, label, display = true }: EquationProps) {
  const html = katex.renderToString(tex, {
    throwOnError: false,
    displayMode: display,
    output: "html",
  });

  if (!display) {
    return (
      <span
        className="blog-equation-inline"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className="my-8">
      <div className="relative border border-border bg-foreground/[0.015] px-5 py-5 pixel-corners">
        <div
          className="blog-equation-block overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {label && (
          <span className="absolute right-4 top-3 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-muted">
            ({label})
          </span>
        )}
      </div>
    </div>
  );
}
