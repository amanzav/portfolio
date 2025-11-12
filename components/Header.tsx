"use client";

import { motion } from "framer-motion";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { SocialLinks } from "@/components/SocialLinks";

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex-shrink-0"
    >
      {/* Invisible Quarter Circle Theme Toggle - Top Right Corner */}
      <AnimatedThemeToggler 
        className="fixed top-0 right-0 w-24 h-24 cursor-pointer z-50"
        style={{
          clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
          opacity: 0
        }}
        aria-label="Toggle theme"
      />

      {/* Name and Social Links Row */}
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-3xl font-bold tracking-[-0.02em]">
          Aman Zaveri
        </h1>

        {/* Social Links - Top Right */}
        <SocialLinks />
      </div>

      {/* Title and Location */}
      <p className="text-base font-medium text-foreground/80 mb-0.5">
        Mechatronics Engineering at University of Waterloo
      </p>
      <p className="text-xs text-muted mb-1.5">Toronto, ON</p>
      <TypingAnimation
        words={[
          "Bullshitting my way through uni",
          "Click the top-right corner to toggle theme 🎨",
          "Probably debugging something right now",
          "Converting coffee to code since 2020",
          "Stack Overflow's #1 customer",
          "rm -rf my sleep schedule",
          "Ctrl+Z is my best friend",
          "Making LEDs blink at 3 AM",
          "git commit -m 'fixed stuff'",
          "404: Sleep not found",
        ]}
        typeSpeed={60}
        deleteSpeed={30}
        pauseDelay={3000}
        loop
        startOnView={false}
        className="text-sm text-muted"
      />
    </motion.header>
  );
}
