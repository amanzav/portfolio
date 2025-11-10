"use client";

import { motion } from "framer-motion";
import { Github } from "lucide-react";

interface Project {
  name: string;
  description: string;
  github?: string;
  demo?: string;
}

const projects: Project[] = [
  {
    name: "CourseClutch",
    description: "Serverless course notifier (FastAPI + AWS Lambda).",
    github: "https://github.com/Aman-Zaveri",
  },
  {
    name: "Reva",
    description: "LLM-based job-matching assistant (Next.js + LangChain).",
    github: "https://github.com/Aman-Zaveri",
  },
  {
    name: "EV Education Game",
    description: "Unity + UGS EV learning game for EcoCAR.",
    github: "https://github.com/Aman-Zaveri",
  },
];

export function Projects() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut", delay: 0.15 }}
      className="mb-10"
    >
      <h2 className="text-2xl font-semibold text-neutral-200 mb-3 tracking-tight">Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((project, index) => (
          <motion.div
            key={index}
            className="rounded-lg border border-neutral-800/80 bg-black/20 p-5 hover:ring-1 hover:ring-neutral-700/30"
            whileHover={{
              scale: 1.01,
              y: -2,
            }}
            transition={{ duration: 0.1, ease: "easeOut" }}
          >
            <div className="flex flex-col h-full">
              <h3 className="font-semibold text-neutral-200 mb-2">
                {project.name}
              </h3>
              <p className="text-sm text-neutral-400 mb-4 flex-1">{project.description}</p>
              <div className="flex gap-3">
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-neutral-100 transition-colors"
                    aria-label={`GitHub repository for ${project.name}`}
                  >
                    <Github size={18} />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
