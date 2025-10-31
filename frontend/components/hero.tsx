"use client";

import { motion } from "framer-motion";
import { ArrowDown, Github, Linkedin, Mail, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HandwritingSignature } from "@/components/handwriting-signature";

export function Hero() {
  const scrollToExperience = () => {
    document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 md:px-12 lg:px-24">
      <div className="max-w-5xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Name */}
          <HandwritingSignature />

          {/* Tagline - no word-by-word animation */}
          <h2 className="text-xl md:text-2xl lg:text-3xl font-medium text-gray-400">
            Building Systems that Ship.
          </h2>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 pt-2 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-accent text-black hover:bg-accent/90 transition-colors"
            >
              <a href="/resume.pdf" download>
                <Download className="mr-2 h-5 w-5" />
                Download Resume
              </a>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/10 hover:border-accent hover:text-accent transition-colors"
            >
              <a href="mailto:amanzaveri@example.com">
                <Mail className="mr-2 h-5 w-5" />
                Get in Touch
              </a>
            </Button>
          </div>

          {/* Social Links */}
          <div className="flex gap-6 pt-4 justify-center">
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
                <Icon className="h-6 w-6" />
                <span className="sr-only">{label}</span>
              </a>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        onClick={scrollToExperience}
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 text-gray-500 hover:text-accent transition-colors cursor-pointer"
      >
        <ArrowDown className="h-6 w-6" />
        <span className="sr-only">Scroll down</span>
      </motion.button>
    </section>
  );
}
