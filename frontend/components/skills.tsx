"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { skillCategories } from "@/data/skills";
import { Github, Linkedin, Mail, Code2 } from "lucide-react";

export function Skills() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="skills" className="py-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-3">
            <Code2 className="h-5 w-5 text-accent" />
            <h2 className="text-2xl md:text-3xl font-bold">Skills & Technologies</h2>
          </div>
          <p className="text-gray-400 text-sm">
            Technologies I work with on a daily basis
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          {skillCategories.map((category, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <h3 className="text-accent font-semibold mb-3 text-sm font-mono">
                {category.category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="border-white/10 hover:border-accent hover:bg-accent/5 transition-all duration-200 text-xs py-0.5 px-2.5"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Separator className="mb-8 bg-white/5" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-gray-400 mb-2 text-sm">
                Interested in working together?
              </p>
              <a
                href="mailto:amanzaveri@example.com"
                className="text-accent hover:underline font-medium"
              >
                Get in touch →
              </a>
            </div>

            <div className="flex gap-6">
              <a
                href="https://github.com/amanzav"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-accent transition-colors"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>

              <a
                href="https://linkedin.com/in/amanzaveri"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-accent transition-colors"
              >
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </a>

              <a
                href="mailto:amanzaveri@example.com"
                className="text-gray-400 hover:text-accent transition-colors"
              >
                <Mail className="h-5 w-5" />
                <span className="sr-only">Email</span>
              </a>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-xs">
              Designed & Built by Aman Zaveri © {new Date().getFullYear()}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
