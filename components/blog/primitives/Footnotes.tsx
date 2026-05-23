import type { ReactNode } from "react";

export function FootnoteRef({ n }: { n: number }) {
  return (
    <sup className="ml-0.5">
      <a
        href={`#fn-${n}`}
        id={`fnref-${n}`}
        className="font-mono text-[0.65rem] text-foreground/60 underline decoration-foreground/20 underline-offset-2 transition-colors hover:text-foreground"
      >
        [{n}]
      </a>
    </sup>
  );
}

interface FootnotesProps {
  children: ReactNode;
}

export function Footnotes({ children }: FootnotesProps) {
  return (
    <section className="mt-16 border-t border-border pt-6">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted">
        / footnotes
      </p>
      <ol className="mt-4 space-y-3 text-sm leading-6 text-foreground/70">
        {children}
      </ol>
    </section>
  );
}

interface FnProps {
  n: number;
  children: ReactNode;
}

export function Fn({ n, children }: FnProps) {
  return (
    <li
      id={`fn-${n}`}
      className="grid grid-cols-[2rem_1fr] gap-2 text-[0.85rem] leading-6"
    >
      <span className="font-mono text-[0.7rem] text-muted">[{n}]</span>
      <span>
        {children}{" "}
        <a
          href={`#fnref-${n}`}
          className="font-mono text-[0.65rem] text-muted underline underline-offset-2 hover:text-foreground"
        >
          ↩
        </a>
      </span>
    </li>
  );
}
