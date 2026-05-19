import type { ReactNode } from "react";

interface TLDRProps {
  children: ReactNode;
}

export function TLDR({ children }: TLDRProps) {
  return (
    <aside className="mt-10 border border-border bg-foreground/[0.02] p-5 pixel-corners md:p-6">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-foreground/60">
        tl;dr — operator brief
      </p>
      <ul className="mt-4 space-y-2 text-sm leading-7 text-foreground/80 md:text-[0.92rem]">
        {children}
      </ul>
    </aside>
  );
}

export function TLDRItem({ children }: { children: ReactNode }) {
  return (
    <li className="grid grid-cols-[1.2rem_1fr] items-baseline gap-1">
      <span className="font-mono text-[0.7rem] text-muted">›</span>
      <span>{children}</span>
    </li>
  );
}
