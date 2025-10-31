"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface TypewriterEffectProps {
  text: string;
  className?: string;
  duration?: number;
}

export function TypewriterEffect({ 
  text, 
  className = "",
  duration = 2
}: TypewriterEffectProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const displayText = useTransform(rounded, (latest) =>
    text.slice(0, latest)
  );

  useEffect(() => {
    const controls = animate(count, text.length, {
      type: "tween",
      duration: duration,
      ease: "easeInOut",
    });
    return controls.stop;
  }, [count, text.length, duration]);

  return (
    <motion.span className={className}>
      {displayText}
    </motion.span>
  );
}
