"use client";

import { useEffect, useState } from "react";
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/components/ui/terminal";

const commands = [
  {
    command: "> reva analyze job-match",
    output: [
      { text: "→ Initializing LangChain pipeline...", className: "text-blue-400" },
      { text: "✓ Loaded embedding model", className: "text-foreground" },
      { text: "✓ Connected to vector store", className: "text-foreground" },
      { text: "📊 Top match: 94% similarity", className: "text-blue-400" },
    ],
  },
  {
    command: "> reva generate resume",
    output: [
      { text: "→ Loading AI template engine...", className: "text-blue-400" },
      { text: "✓ Parsed work history", className: "text-foreground" },
      { text: "✓ Generated tailored content", className: "text-foreground" },
      { text: "✅ Resume exported to PDF", className: "text-green-400" },
    ],
  },
  {
    command: "> reva optimize profile",
    output: [
      { text: "→ Analyzing LinkedIn profile...", className: "text-blue-400" },
      { text: "✓ Identified 12 keywords", className: "text-foreground" },
      { text: "✓ Suggested skill endorsements", className: "text-foreground" },
      { text: "⚡ Profile score: 87/100", className: "text-blue-400" },
    ],
  },
];

export function RevaTerminal() {
  const [commandIndex, setCommandIndex] = useState(0);

  useEffect(() => {
    // Cycle through commands every 4 seconds
    const interval = setInterval(() => {
      setCommandIndex((prev) => (prev + 1) % commands.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const currentCommand = commands[commandIndex];

  return (
    <div>
      <Terminal
        key={commandIndex}
        className="absolute sm:-top-3 -top-4 lg:-right-1 md:-right-10 sm:-right-16 -right-32 w-[300px] max-h-[200px] opacity-80 scale-[0.75] origin-top-right !bg-transparent !border-foreground/30 !overflow-hidden [&>div:first-child]:!bg-transparent [&>div:first-child]:!border-transparent [&>pre]:max-h-[120px] [&>pre]:overflow-hidden pointer-events-none"
      >
        <TypingAnimation duration={30}>{currentCommand.command}</TypingAnimation>

        {currentCommand.output.map((line, idx) => (
          <AnimatedSpan key={idx} className={line.className}>
            {line.text}
          </AnimatedSpan>
        ))}
      </Terminal>
    </div>
  );
}
