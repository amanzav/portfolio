"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ChevronLeft, Github, ExternalLink } from "lucide-react";
import { ProjectItem } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface ProjectDetailClientProps {
  project: ProjectItem;
}

export default function ProjectDetailClient({ project }: ProjectDetailClientProps) {
  const [isBackHovered, setIsBackHovered] = useState(false);

  // Enable scrolling on detail pages
  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, []);

  return (
    <>
      {/* Subtle background gradient */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-foreground/[0.02] via-transparent to-transparent" />
      
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {/* Back button with hover text */}
        <div className="mb-10">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-foreground/70 hover:text-foreground transition-all"
            aria-label="Back to portfolio"
            onMouseEnter={() => setIsBackHovered(true)}
            onMouseLeave={() => setIsBackHovered(false)}
          >
            <div className="flex items-center justify-center w-8 h-8">
              <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            </div>
            <motion.span
              initial={{ width: 0, opacity: 0 }}
              animate={{
                width: isBackHovered ? 'auto' : 0,
                opacity: isBackHovered ? 1 : 0
              }}
              transition={{ duration: 0.15 }}
              className="text-sm font-medium overflow-hidden whitespace-nowrap"
            >
              Back to Portfolio
            </motion.span>
          </Link>
        </div>

        {/* Enhanced header section */}
        <motion.div
          className="relative border border-border/50 rounded-lg p-6 mb-8 bg-foreground/[0.02] backdrop-blur-sm"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-foreground/[0.03] to-transparent pointer-events-none" />
          
          <div className="relative space-y-4">
            <div>
              <h1 className="text-3xl font-semibold text-foreground mb-2 tracking-tight">
                {project.name}
              </h1>
              <p className="text-foreground/70 text-base leading-relaxed">
                {project.description}
              </p>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <Button
                variant="outline"
                asChild
                size="sm"
                className="gap-2 hover:scale-105 transition-transform"
              >
                <a href={project.href} target="_blank" rel="noopener noreferrer">
                  <Github className="w-4 h-4" />
                  View on GitHub
                </a>
              </Button>
              {project.siteUrl && (
                <Button
                  variant="outline"
                  asChild
                  size="sm"
                  className="gap-2 hover:scale-105 transition-transform"
                >
                  <a href={project.siteUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                    Visit Site
                  </a>
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mb-8" />

        {/* Tech stack with stagger animation and hover effects */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="mb-10"
        >
          <h2 className="text-sm font-medium text-foreground/60 uppercase tracking-wider mb-4">
            Tech Stack
          </h2>
          <div className="flex gap-2 flex-wrap">
            {project.skills.map((skill, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15, delay: 0.15 + idx * 0.03 }}
                className="px-3 py-1.5 rounded-md bg-foreground/10 text-foreground/80 text-sm border border-foreground/10 hover:bg-foreground/15 hover:border-foreground/20 hover:scale-105 transition-all cursor-default"
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Divider */}
        {project.details && (
          <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mb-8" />
        )}

        {/* Details section */}
        {project.details && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.2 }}
            className="prose prose-neutral dark:prose-invert prose-sm max-w-none"
          >
            <h2 className="text-sm font-medium text-foreground/60 uppercase tracking-wider mb-4">
              Project Details
            </h2>
            <div className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {project.details}
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
