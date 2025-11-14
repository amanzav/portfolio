"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ChevronLeft, Github, ExternalLink } from "lucide-react";
import { ProjectItem } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface ProjectDetailClientProps {
  project: ProjectItem;
}

export default function ProjectDetailClient({ project }: ProjectDetailClientProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div className="mb-8">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/"
                className="inline-flex items-center justify-center w-8 h-8 text-foreground/70 hover:text-foreground transition-colors"
                aria-label="Back to portfolio"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top" align="center" sideOffset={0}>
              <p className="whitespace-nowrap">Back to portfolio</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2 tracking-tight">
            {project.name}
          </h1>
          <p className="text-foreground/70 text-base mb-4">
            {project.description}
          </p>
          
          <div className="flex gap-3 mb-4">
            <Button
              variant="outline"
              asChild
              size="sm"
              className="gap-2"
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
                className="gap-2"
              >
                <a href={project.siteUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  Visit Site
                </a>
              </Button>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {project.skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-1 rounded-md bg-foreground/10 text-foreground/80 text-xs"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {project.details && (
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
              {project.details}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
