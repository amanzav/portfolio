"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { skillCategories } from "@/data/skills";
import { Github, Linkedin, Mail, Code2 } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1 },
};

export function Skills() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="skills" className="py-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <Code2 className="h-6 w-6 text-accent" />
            <h2 className="text-4xl md:text-5xl font-bold">Skills & Technologies</h2>
          </div>
          <p className="text-gray-400 text-lg">Technologies I work with on a daily basis</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
          {skillCategories.map((category, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
            >
              <h3 className="text-accent font-semibold mb-4 text-lg font-mono">
                {category.category}
              </h3>
              <motion.div
                variants={container}
                initial="hidden"
                animate={isInView ? "show" : "hidden"}
                className="flex flex-wrap gap-2"
              >
                {category.skills.map((skill, i) => (
                  <motion.div key={i} variants={item}>
                    <Badge
                      variant="outline"
                      className="border-white/20 hover:border-accent hover:bg-accent/10 transition-all duration-200 text-sm py-1.5 px-4"
                    >
                      {skill}
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Separator className="mb-12 bg-white/10" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <p className="text-gray-400 mb-2">
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
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">
              Designed & Built by Aman Zaveri © {new Date().getFullYear()}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
