"use client";

import { motion } from "framer-motion";

export function About() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut", delay: 0.05 }}
      className="mb-10"
    >
      <p className="text-base text-foreground/90">
        I write dependable software for the web and embedded systems. Less drama, more delivery.
      </p>
    </motion.section>
  );
}
