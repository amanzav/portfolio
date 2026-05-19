import type { ReactNode } from "react";
import { Figure } from "./Figure";

interface ASCIIDiagramProps {
  caption: string;
  number?: string;
  children: ReactNode;
}

export function ASCIIDiagram({ caption, number, children }: ASCIIDiagramProps) {
  return (
    <Figure caption={caption} number={number} tone="ascii">
      <pre className="overflow-x-auto whitespace-pre font-mono text-[0.7rem] leading-5 text-foreground/85 md:text-[0.78rem] md:leading-6">
        {children}
      </pre>
    </Figure>
  );
}
