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
      <div className="border border-border bg-foreground/[0.015] px-5 py-5 pixel-corners overflow-hidden">
        <div
          className="blog-equation-block max-w-full [&_.katex-display]:!my-0 [&_.katex-display]:overflow-hidden [&_.katex]:text-sm sm:[&_.katex]:text-base"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      {label && (
        <div className="mt-2 text-center font-mono text-[0.6rem] uppercase tracking-[0.22em] text-muted">
          ({label})
        </div>
      )}
    </div>
  );
}
