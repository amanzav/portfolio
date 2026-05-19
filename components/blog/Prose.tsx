import type { ReactNode } from "react";

export function P({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

export function Lead({ children }: { children: ReactNode }) {
  return (
    <p className="text-[1.02rem] leading-8 text-foreground/85 md:text-[1.05rem]">
      {children}
    </p>
  );
}

export function Em({ children }: { children: ReactNode }) {
  return <em className="text-foreground/90">{children}</em>;
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong className="text-foreground">{children}</strong>;
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-sm border border-border/70 bg-foreground/[0.04] px-1 py-0.5 font-mono text-[0.82em] text-foreground/90">
      {children}
    </code>
  );
}

export function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-link"
    >
      {children}
    </a>
  );
}
