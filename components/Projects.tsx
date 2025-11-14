"use client";

import { motion } from "motion/react";
import { Car, GraduationCap, Pencil } from "lucide-react";
import { BentoCard, BentoGrid } from "./ui/bento-grid";
import { RevaTerminal } from "./backgrounds/RevaTerminal";
import { projects } from "@/lib/projects";

// Map icon names to actual icon components
const iconMap = {
  GraduationCap,
  Pencil,
  Car,
};

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
        {projects.map((project, index) => {
          const IconComponent = iconMap[project.Icon as keyof typeof iconMap];
          
          // Set backgrounds based on project
          let background;
          if (project.id === "reva") {
            background = <RevaTerminal />;
          } else {
            background = <img className="absolute -top-20 -right-20 opacity-60" />;
          }

          // Set grid position
          let className = "";
          if (index === 0) className = "lg:col-start-1 lg:col-end-2";
          else if (index === 1) className = "lg:col-start-2 lg:col-end-3";
          else if (index === 2) className = "lg:col-start-3 lg:col-end-4";

          return (
            <BentoCard
              key={project.name}
              name={project.name}
              description={project.description}
              Icon={IconComponent}
              href={project.href}
              siteUrl={project.siteUrl}
              cta="View on GitHub"
              background={background}
              className={className}
              detailSlug={project.id}
            />
          );
        })}
      </BentoGrid>
    </motion.section>
  );
}
