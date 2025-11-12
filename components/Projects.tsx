"use client";

import { motion } from "motion/react";
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
    github: "https://github.com/amanzav/course-clutch",
  },
  {
    name: "Reva",
    description: "LLM-based job-matching assistant (Next.js + LangChain).",
    github: "https://github.com/amanzav/reva",
  },
  {
    name: "EV Education Game",
    description: "Unity + UGS EV learning game for EcoCAR.",
    github: "https://github.com/amanzav/uwaft-cav-game",
  },
];

export function Projects() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut", delay: 0.15 }}
      className="pb-4"
    >
      <h2 className="text-lg font-medium text-neutral-200 mb-2 tracking-tight">Projects</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {projects.map((project, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.2, ease: "easeOut", delay: index * 0.05 }}
            className="rounded-xl border border-white/5 bg-black/20 p-5 transition-transform duration-150 hover:scale-[1.02] hover:-translate-y-[2px]"
          >
            <div className="flex flex-col h-full">
              <h3 className="font-medium text-neutral-200 mb-2">
                {project.name}
              </h3>
              <p className="text-xs text-neutral-400 mb-auto">{project.description}</p>
              
              <div className="flex justify-end mt-2">
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-neutral-100 transition-colors"
                    aria-label={`GitHub repository for ${project.name}`}
                  >
                    <Github size={16} />
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
