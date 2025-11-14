"use client";

import { motion } from "motion/react";
import { Car, GraduationCap, Pencil } from "lucide-react";
import { BentoCard, BentoGrid } from "./ui/bento-grid";
import { RevaTerminal } from "./backgrounds/RevaTerminal";

const projects = [
  {
    Icon: GraduationCap,
    name: "CourseClutch",
    description: "Serverless course notifier",
    href: "https://github.com/amanzav/course-clutch",
    siteUrl: "https://courseclutch.com",
    cta: "View on GitHub",
    background: <img className="absolute -top-20 -right-20 opacity-60" />,
    className: "lg:col-start-1 lg:col-end-2",
  },
  {
    Icon: Pencil,
    name: "Reva",
    description: "LLM-based job-matching assistant",
    href: "https://github.com/amanzav/reva",
    cta: "View on GitHub",
    background: <RevaTerminal />,
    className: "lg:col-start-2 lg:col-end-3",
  },
  {
    Icon: Car,
    name: "EV Education Game",
    description: "Unity + UGS EV learning game for EcoCAR.",
    href: "https://github.com/amanzav/uwaft-cav-game",
    cta: "View on GitHub",
    background: <img className="absolute -top-20 -right-20 opacity-60" />,
    className: "lg:col-start-3 lg:col-end-4",
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
      <h2 className="text-lg font-medium text-foreground mb-2 tracking-tight">
        Projects
      </h2>

      <BentoGrid className="sm:grid-cols-3 auto-rows-[max(12vw,180px)] max-w-5xl mx-auto">
        {projects.map((project) => (
          <BentoCard key={project.name} {...project} />
        ))}
      </BentoGrid>
    </motion.section>
  );
}
