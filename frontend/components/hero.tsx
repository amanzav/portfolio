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
      {/* Main hero content */}
      <div className="max-w-5xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          {/* Name - Handwriting SVG with stroke-by-stroke animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <HandwritingSignature />
          </motion.div>

          {/* Tagline */}
          <motion.h2
            className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-500 max-w-4xl mx-auto"
          >
            {["Building", "Systems", "that", "Ship."].map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 2 + i * 0.15,
                  duration: 0.4,
                }}
                className="inline-block mr-3"
              >
                {word}
              </motion.span>
            ))}
          </motion.h2>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3 }}
            className="flex flex-wrap gap-4 pt-2 justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                asChild
                size="lg"
                className="group relative overflow-hidden bg-accent text-black hover:bg-accent/90"
              >
                <a href="/resume.pdf" download>
                  <Download className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Download Resume
                </a>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 hover:border-accent hover:text-accent"
              >
                <a href="mailto:amanzaveri@example.com">
                  <Mail className="mr-2 h-5 w-5" />
                  Get in Touch
                </a>
              </Button>
            </motion.div>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.2 }}
            className="flex gap-6 pt-4 justify-center"
          >
            {[
              { href: "https://github.com/amanzav", Icon: Github, label: "GitHub" },
              { href: "https://linkedin.com/in/amanzaveri", Icon: Linkedin, label: "LinkedIn" },
              { href: "mailto:amanzaveri@example.com", Icon: Mail, label: "Email" },
            ].map(({ href, Icon, label }, i) => (
              <motion.a
                key={href}
                href={href}
                target={href.startsWith('http') ? "_blank" : undefined}
                rel={href.startsWith('http') ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.2 + i * 0.1 }}
                whileHover={{ scale: 1.15, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="text-gray-400 hover:text-accent transition-colors"
              >
                <Icon className="h-6 w-6" />
                <span className="sr-only">{label}</span>
              </motion.a>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        onClick={scrollToExperience}
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 1,
          y: [0, 10, 0]
        }}
        transition={{ 
          opacity: { delay: 3.5 },
          y: { duration: 2, repeat: Infinity }
        }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 text-gray-500 hover:text-accent transition-colors cursor-pointer"
        whileHover={{ scale: 1.2 }}
      >
        <ArrowDown className="h-6 w-6" />
        <span className="sr-only">Scroll down</span>
      </motion.button>
    </section>
  );
}
