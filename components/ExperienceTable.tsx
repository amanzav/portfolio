"use client";

import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExperienceItem {
  company: string;
  role: string;
  date: string;
  description?: string;
}

const experiences: ExperienceItem[] = [
  {
    company: "Ford Motor Company",
    role: "Software Engineering Intern",
    date: "2024–2025",
    description: "Developed route-aware fuel optimization widget (Kotlin).",
  },
  {
    company: "Transpire Technologies",
    role: "Software Engineering Intern",
    date: "2024",
    description: "Built real-time analytics platform (Flask + Kubernetes).",
  },
  {
    company: "University of Waterloo",
    role: "BASc Mechatronics Engineering (AI)",
    date: "2023–2028",
  },
];

export function ExperienceTable() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut", delay: 0.1 }}
      className="mb-10"
    >
      <h2 className="text-2xl font-semibold text-neutral-200 mb-3 tracking-tight">
        Experience
      </h2>
      <div className="space-y-3">
        {experiences.map((exp, index) => (
          <div
            key={index}
            className={`grid grid-cols-[2fr_2fr_1fr] gap-4 text-sm pb-3 ${
              index < experiences.length - 1
                ? "border-b border-neutral-950"
                : ""
            }`}
          >
            {exp.description ? (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-default text-neutral-300 hover:text-neutral-100 transition-colors">
                      {exp.company}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" sideOffset={8} alignOffset={-10}>
                    <p className="whitespace-nowrap">{exp.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div className="text-neutral-300">{exp.company}</div>
            )}
            <div className="text-neutral-300">{exp.role}</div>
            <div className="text-neutral-400 text-right">{exp.date}</div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
