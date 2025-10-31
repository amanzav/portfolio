"use client";

import { motion } from "framer-motion";

export function HandwritingSignature() {
  return (
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight text-accent"
    >
      Aman
    </motion.h1>
  );
}
