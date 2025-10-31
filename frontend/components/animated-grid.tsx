"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedGridProps {
  className?: string;
  rows?: number;
  cols?: number;
}

const AnimatedGridComponent: React.FC<AnimatedGridProps> = ({
  className,
  rows = 40,
  cols = 40,
}) => {
  const rowsArray = new Array(rows).fill(1);
  const colsArray = new Array(cols).fill(1);

  return (
    <div className={cn("fixed inset-0 pointer-events-none overflow-hidden", className)}>
      {rowsArray.map((_, i) => (
        <div key={i} className="flex">
          {colsArray.map((_, j) => (
            <motion.div
              key={`${i}-${j}`}
              className="w-8 h-8 border-[0.5px] border-gray-900/20"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.2, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: Math.random() * 10,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const AnimatedGrid = React.memo(AnimatedGridComponent);
