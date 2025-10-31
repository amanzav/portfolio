"use client";

import { motion } from "framer-motion";
import { ArrowDown, Github, Linkedin, Mail, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HandwritingSignature } from "@/components/handwriting-signature";
import { Globe } from "@/components/globe";

export function Hero() {
  const scrollToExperience = () => {
    document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 md:px-12 lg:px-24 overflow-hidden">
      {/* Globe in background - smaller and more subtle */}
      <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
        <div className="w-[400px] h-[400px] md:w-[500px] md:h-[500px]">
          <Globe />
        </div>
      </div>

      <div className="max-w-4xl w-full text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Name - smaller */}
          <HandwritingSignature />

          {/* CTA Buttons - compact with text */}
          <div className="flex gap-3 pt-4 justify-center">
            <Button
              asChild
              size="sm"
              className="bg-accent text-black hover:bg-accent/90 transition-colors text-xs"
            >
              <a href="/resume.pdf" download>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Resume
              </a>
            </Button>

            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-white/10 hover:border-accent hover:text-accent transition-colors text-xs"
            >
              <a href="mailto:amanzaveri@example.com">
                <Mail className="mr-1.5 h-3.5 w-3.5" />
                Contact
              </a>
            </Button>
          </div>

          {/* Social Links - smaller */}
          <div className="flex gap-5 pt-6 justify-center">
            {[
              { href: "https://github.com/amanzav", Icon: Github, label: "GitHub" },
              { href: "https://linkedin.com/in/amanzaveri", Icon: Linkedin, label: "LinkedIn" },
              { href: "mailto:amanzaveri@example.com", Icon: Mail, label: "Email" },
            ].map(({ href, Icon, label }) => (
              <a
                key={href}
                href={href}
                target={href.startsWith('http') ? "_blank" : undefined}
                rel={href.startsWith('http') ? "noopener noreferrer" : undefined}
                className="text-gray-400 hover:text-accent transition-colors"
              >
                <Icon className="h-5 w-5" />
                <span className="sr-only">{label}</span>
              </a>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator - smaller */}
      <motion.button
        onClick={scrollToExperience}
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 text-gray-500 hover:text-accent transition-colors cursor-pointer"
      >
        <ArrowDown className="h-5 w-5" />
        <span className="sr-only">Scroll down</span>
      </motion.button>
    </section>
  );
}
