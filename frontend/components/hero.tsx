"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Github, Linkedin, Mail, Download, ArrowDown } from "lucide-react";

export function Hero() {
  const scrollToExperience = () => {
    document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 md:px-12 lg:px-24">
      {/* Main hero content */}
      <div className="max-w-5xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          {/* Greeting */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-accent font-mono text-sm md:text-base"
          >
            Hi, my name is
          </motion.p>

          {/* Name - Big and Bold */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight"
          >
            <span className="bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-transparent">
              Aman Zaveri
            </span>
          </motion.h1>

          {/* Tagline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-500 max-w-4xl"
          >
            Building Systems that Ship.
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed"
          >
            Full-Stack & Embedded Engineer specializing in scalable systems, 
            real-time analytics, and intelligent automation. Currently working with 
            Kotlin, C++, Python, and React at Ford Motor Company.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-4 pt-4"
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

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex gap-6 pt-8"
          >
            <motion.a
              href="https://github.com/amanzav"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="text-gray-400 hover:text-accent transition-colors"
            >
              <Github className="h-6 w-6" />
              <span className="sr-only">GitHub</span>
            </motion.a>

            <motion.a
              href="https://linkedin.com/in/amanzaveri"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="text-gray-400 hover:text-accent transition-colors"
            >
              <Linkedin className="h-6 w-6" />
              <span className="sr-only">LinkedIn</span>
            </motion.a>

            <motion.a
              href="mailto:amanzaveri@example.com"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="text-gray-400 hover:text-accent transition-colors"
            >
              <Mail className="h-6 w-6" />
              <span className="sr-only">Email</span>
            </motion.a>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        onClick={scrollToExperience}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 text-gray-500 hover:text-accent transition-colors cursor-pointer"
        whileHover={{ y: 5 }}
      >
        <ArrowDown className="h-6 w-6 animate-bounce" />
        <span className="sr-only">Scroll down</span>
      </motion.button>
    </section>
  );
}
