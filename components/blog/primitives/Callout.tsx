import type { ReactNode } from "react";

interface CalloutProps {
  label?: string;
  children: ReactNode;
}

export function Callout({ label = "note", children }: CalloutProps) {
  return (
    <aside className="my-8 border-l-2 border-foreground/40 bg-foreground/[0.025] py-4 pl-5 pr-4">
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-muted">
        {"// "}
        {label}
      </p>
      <div className="mt-2 text-[0.92rem] leading-7 text-foreground/85">
        {children}
      </div>
    </aside>
  );
}
