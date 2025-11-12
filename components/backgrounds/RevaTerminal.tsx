"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/components/ui/terminal";

export function RevaTerminal() {
  const [key, setKey] = useState(0);
  const preRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset the terminal every 8 seconds to loop the animation
    const interval = setInterval(() => {
      setKey((prev) => prev + 1);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when content changes
    const observer = new MutationObserver(() => {
      const preElement = preRef.current?.querySelector("pre");
      if (preElement) {
        preElement.scrollTop = preElement.scrollHeight;
      }
    });

    if (preRef.current) {
      observer.observe(preRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => observer.disconnect();
  }, [key]);

  return (
    <div ref={preRef}>
      <Terminal
        key={key}
        className="absolute -top-3 left-3 w-[300px] max-h-[150px] opacity-80 scale-[0.75] origin-top-right !bg-transparent !border-foreground/30 !overflow-hidden [&>div:first-child]:!bg-transparent [&>div:first-child]:!border-transparent [&>pre]:max-h-[120px] [&>pre]:overflow-y-hidden [&>pre]:overflow-x-hidden [&>pre]:scroll-smooth pointer-events-none"
      >
      <TypingAnimation duration={40}>&gt; reva analyze job-match</TypingAnimation>

      <AnimatedSpan className="text-blue-400">
        → Initializing LangChain pipeline...
      </AnimatedSpan>

      <AnimatedSpan className="text-white">
        ✓ Loaded embedding model
      </AnimatedSpan>

      <AnimatedSpan className="text-white">
        ✓ Connected to vector store
      </AnimatedSpan>

      <AnimatedSpan className="text-white">
        ✓ Processing resume data
      </AnimatedSpan>

      <AnimatedSpan className="text-blue-400">
        ⚡ Analyzing 247 job postings...
      </AnimatedSpan>

      <AnimatedSpan className="text-white">
        ✓ Generated similarity scores
      </AnimatedSpan>

      <AnimatedSpan className="text-blue-400">
        📊 Top match: 94% similarity
      </AnimatedSpan>

      <TypingAnimation className="text-white" duration={50}>
        Analysis complete. 12 high-confidence matches found.
      </TypingAnimation>
    </Terminal>
    </div>
  );
}
