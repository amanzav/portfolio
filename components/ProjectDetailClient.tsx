"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Github, MoveUpRight } from "lucide-react";
import { ProjectItem } from "@/lib/projects";

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
      <header>
        <nav
          aria-label="Breadcrumb"
          className="font-mono text-xs uppercase tracking-[0.18em] text-muted"
        >
          <Link
            href="/"
            className="transition-colors hover:text-foreground"
          >
            / home
          </Link>
          <Link
            href="/projects"
            className="ml-2 transition-colors hover:text-foreground"
          >
            / projects
          </Link>
        </nav>

        <p className="mt-14 font-mono text-xs uppercase tracking-[0.22em] text-muted">
          project record
        </p>
        <h1 className="mt-3 text-4xl font-medium leading-none tracking-[-0.04em] md:text-5xl">
          {project.name}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-foreground/70">
          {project.description}
        </p>
      </header>

      <section className="mt-9 grid gap-3 border-y border-border py-4 font-mono text-xs uppercase tracking-[0.16em] text-muted md:grid-cols-[120px_1fr]">
        <span>stack</span>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-foreground/70">
          {project.skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>

        <span>links</span>
        <div className="flex flex-wrap gap-4">
          <a
            href={project.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-foreground/70 transition-colors hover:text-foreground"
          >
            <Github className="h-4 w-4" />
            github
          </a>
          {project.siteUrl && (
            <a
              href={project.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-foreground/70 transition-colors hover:text-foreground"
            >
              <MoveUpRight className="h-4 w-4" />
              site
            </a>
          )}
        </div>
      </section>

      {project.details && (
        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            details
          </h2>
          <div className="mt-5 space-y-5 text-sm leading-7 text-foreground/80">
            {project.details.split("\n\n").map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
