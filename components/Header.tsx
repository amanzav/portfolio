"use client";

import { motion } from "framer-motion";
import { Github, Linkedin, Mail } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { TypingAnimation } from "@/components/ui/typing-animation";

const links = [
  {
    name: "GitHub",
    icon: Github,
    href: "https://github.com/Aman-Zaveri",
    ariaLabel: "GitHub Profile",
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    href: "https://linkedin.com/in/aman-zaveri",
    ariaLabel: "LinkedIn Profile",
  },
  {
    name: "Email",
    icon: Mail,
    href: "mailto:a3zaveri@uwaterloo.ca",
    ariaLabel: "Email",
  },
];

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (!mounted) return;
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="mb-8"
    >
      {/* Name and Social Links Row */}
      <div className="flex items-start justify-between mb-2">
        <h1
          onClick={toggleTheme}
          className="text-5xl font-bold tracking-[-0.02em] cursor-pointer select-none"
        >
          Aman Zaveri
        </h1>

        {/* Social Links - Top Right */}
        <div className="flex gap-6 items-center">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.ariaLabel}
                className="text-muted hover:text-foreground hover:scale-105 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
              >
                <Icon size={20} />
              </a>
            );
          })}
        </div>
      </div>

      {/* Title and Location */}
      <p className="text-xl font-medium text-foreground/80 mb-1">
        Mechatronics Engineering at University of Waterloo
      </p>
      <p className="text-sm text-muted mb-3">Toronto, ON</p>
      <TypingAnimation
        words={[
          "Bullshitting my way through uni",
          "Click my name to toggle theme 🎨",
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
