import type { ReactNode } from "react";

interface SectionProps {
  number?: string;
  label?: string;
  title: string;
  children: ReactNode;
}

export function Section({ number, label, title, children }: SectionProps) {
  return (
    <section className="mt-14 first:mt-0">
      <div className="mb-4 flex items-baseline gap-3 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted">
        {number && <span className="text-foreground/70">{number}</span>}
        {label && <span>{label}</span>}
      </div>
      <h2 className="text-xl font-medium tracking-[-0.03em] text-foreground md:text-2xl">
        {title}
      </h2>
      <div className="mt-5 space-y-5 text-[0.95rem] leading-7 text-foreground/80">
        {children}
      </div>
    </section>
  );
}
