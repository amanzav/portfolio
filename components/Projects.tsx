"use client";

import { motion } from "framer-motion";
import { Github } from "lucide-react";

interface Project {
  name: string;
  description: string;
  subtext: string;
  github?: string;
  demo?: string;
}

const projects: Project[] = [
  {
    name: "CourseClutch",
    description: "Serverless course notifier (FastAPI + AWS Lambda).",
    subtext: "Because refreshing Quest every 10 seconds was getting old.",
    github: "https://github.com/Aman-Zaveri",
  },
  {
    name: "Reva",
    description: "LLM-based job-matching assistant (Next.js + LangChain).",
    subtext: "Basically a chatbot with commitment issues.",
    github: "https://github.com/Aman-Zaveri",
  },
  {
    name: "EV Education Game",
    description: "Unity + UGS EV learning game for EcoCAR.",
    subtext: "Turns kids into engineers before they realize it.",
    github: "https://github.com/Aman-Zaveri",
  },
];

export function Projects() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut", delay: 0.15 }}
      className="pb-12"
    >
      <h2 className="text-2xl font-semibold text-neutral-200 mb-6 tracking-tight">Projects</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <h3 className="font-semibold text-neutral-200 mb-2">
                {project.name}
              </h3>
              <p className="text-sm text-neutral-400 mb-2">{project.description}</p>
              
              {/* Subtext with subtle animation */}
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-sm text-neutral-500 italic mb-4 flex-1"
              >
                {project.subtext}
              </motion.p>
              
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
