"use client";

import { motion } from "motion/react";
import { Car, GraduationCap, Pencil, ChevronRight, Github, ExternalLink } from "lucide-react";
import { RevaTerminal } from "./backgrounds/RevaTerminal";
import { projects } from "@/lib/projects";
import Link from "next/link";
import { Magnetic } from "./ui/shadcn-io/magnetic";

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
      <h2 className="text-base md:text-lg font-medium text-foreground mb-2 tracking-tight">
        Projects
      </h2>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        {projects.map((project) => {
          const IconComponent = iconMap[project.Icon as keyof typeof iconMap];
          
          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block group"
            >
              <div className="border border-border rounded-lg p-4 hover:bg-foreground/5 hover:border-foreground/20 transition-all">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Icon */}
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                      {IconComponent && (
                        <IconComponent className="w-6 h-6 text-foreground/70" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-foreground/90 truncate">
                        {project.name}
                      </h3>
                      <p className="text-sm text-foreground/70 mt-0.5 truncate">
                        {project.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <div className="flex-shrink-0 flex items-center">
                    <div className="inline-flex items-center justify-center w-9 h-9 text-foreground/70 group-hover:text-foreground transition-colors">
                      <ChevronRight className="w-5 h-5 transition-transform group-hover:-rotate-45" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop Grid Layout */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        {projects.map((project, index) => {
          const IconComponent = iconMap[project.Icon as keyof typeof iconMap];
          
          // Set backgrounds based on project
          let background;
          if (project.id === "reva") {
            background = <RevaTerminal />;
          } else {
            background = <img className="absolute -top-20 -right-20 opacity-60" />;
          }

          return (
            <Magnetic
              key={project.id}
              strength={0.1}
              range={200}
              springOptions={{ stiffness: 150, damping: 15, mass: 0.1 }}
            >
              <Link
                href={`/projects/${project.id}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-lg bg-transparent border border-border h-[max(12vw,180px)] cursor-pointer"
              >
                <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-110">
                  {background}
                </div>
                <div className="relative z-10 p-4 mt-auto">
                  <div className="pointer-events-none flex transform-gpu flex-col gap-1 transition-all duration-300 group-hover:-translate-y-6">
                    {IconComponent && (
                      <IconComponent className="h-8 w-8 origin-left transform-gpu text-foreground/70 transition-all duration-300 ease-in-out group-hover:scale-85" />
                    )}
                    <h3 className="text-sm font-medium text-foreground/90 tracking-tight">
                      {project.name}
                    </h3>
                    <p className="max-w-lg text-sm text-foreground/70">{project.description}</p>
                  </div>
                </div>

                <div className="pointer-events-none absolute bottom-0 w-full translate-y-4 transform-gpu flex-row items-center gap-3 px-4 pb-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hidden md:flex z-20">
                  {project.site && (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(project.site, '_blank', 'noopener,noreferrer');
                      }}
                      className="pointer-events-auto p-0 group/icon bg-transparent border-0 cursor-pointer"
                      aria-label="Visit site"
                    >
                      <ExternalLink className="h-4 w-4 text-foreground/60 group-hover/icon:text-foreground group-hover/icon:scale-[1.01] transition-all duration-150" />
                    </button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(project.github, '_blank', 'noopener,noreferrer');
                    }}
                    className="pointer-events-auto p-0 group/icon bg-transparent border-0 cursor-pointer"
                    aria-label="View GitHub repository"
                  >
                    <Github className="h-4 w-4 text-foreground/60 group-hover/icon:text-foreground group-hover/icon:scale-[1.01] transition-all duration-150" />
                  </button>
                  
                  <div className="ml-auto pointer-events-auto inline-flex items-center justify-center w-8 h-8 text-foreground/70 hover:text-foreground transition-colors group/chevron">
                    <ChevronRight className="w-5 h-5 transition-transform group-hover/chevron:-rotate-45" />
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10 z-[5]" />
              </Link>
            </Magnetic>
          );
        })}
      </div>
    </motion.section>
  );
}
