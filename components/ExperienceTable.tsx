"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ExperienceItem {
  company: string;
  role: string;
  date: string;
  skills: string[];
  description?: string;
  details?: string;
}

const experiences: ExperienceItem[] = [
  {
    company: "Ford Motor Company",
    role: "Software Developer Intern",
    date: "May 2025 – Aug 2025",
    skills: ["Kotlin", "Java", "C++"],
    description: "Route-aware fuel optimization & tire-pressure alert systems.",
    details: "Led end-to-end development of a route-aware fuel optimization Android widget (Kotlin + Java) for the infotainment system, with a graph-ranking algorithm that yielded 30% more fuel-optimal routes.\n\nOwned, design, and deployed a tire-pressure alert system in C++ using HAL + AIDL, delivering sub-second alerts with 700ms latency in offline and edge-connectivity conditions for the Phoenix infotainment system.\n\nBuilt a Docker CI/CD pipeline integrating LLM-based AST analysis (GitHub Actions + sentence-transformers) to detect unit test gaps and auto-route PRs, reducing deployment reviews by 20 min per PR.\n\nRefactored 30+ in-vehicle data handlers using async queues and lock-free buffers to eliminate contention during CAN message bursts, sustaining stable throughput under 5K+ signal updates per second.",
  },
  {
    company: "Ford Motor Company",
    role: "Software Engineering Intern",
    date: "Sep 2024 – Dec 2024",
    skills: ["TensorFlow", "Python", "Docker"],
    description: "ML anomaly detection & automated infotainment testing.",
    details: "Developed an ML proof-of-concept (TensorFlow + Scikit-learn) trained on 50K+ connectivity samples to classify network anomalies, outperforming baseline rule-based detection.\n\nCreated Jenkins pipelines (Docker + MQTT) for automated infotainment fault validation, running 100+ tests per nightly build and eliminating manual QA loops.\n\nBuilt a Linux-based Slash test suite covering 250+ regression cases across multiple firmware releases, improving reliability in pre-production environments.\n\nAnalyzed IPv6 connectivity logs via Pandas/NumPy to identify gaps and improve signal accuracy by 32%.",
  },
  {
    company: "Transpire Technologies",
    role: "Member of Technical Staff",
    date: "Jan 2024 – Apr 2024",
    skills: ["React", "Flask", "Kubernetes"],
    description: "Real-time analytics platform serving 1,000+ enterprise users.",
    details: "Optimized AppSync subscription schema and Supabase triggers to avoid redundant payloads, trimming ~1.8 KB per message and dropping subscription traffic from 120 KB/s → 65 KB/s during peak streams.\n\nDelivered a real-time React analytics platform with Flask, PostgreSQL, and Kubernetes-based microservices, serving 1,000 enterprise users with auto-scaled deployment and minimal downtime.\n\nAutomated event anomaly-detection pipelines using Selenium + Vector, enabling 3x more outreach.",
  },
];

export function ExperienceTable() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut", delay: 0.1 }}
      className="flex-shrink-0"
    >
      <h2 className="text-2xl font-semibold text-foreground mb-2 tracking-tight">
        Experience
      </h2>
      <Table>
        <TableBody>
          {experiences.map((exp, index) => (
            <TableRow key={index} className="border-border hover:bg-foreground/5">
              <TableCell className="text-foreground/90">
                {exp.description ? (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-default hover:text-foreground transition-colors">
                          {exp.company}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" sideOffset={8} alignOffset={-10}>
                        <p className="whitespace-nowrap">{exp.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  exp.company
                )}
              </TableCell>
              <TableCell className="text-foreground/90">{exp.role}</TableCell>
              <TableCell className="text-foreground/70 text-sm">
                <div className="flex gap-2 flex-wrap">
                  {exp.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-foreground/10 text-foreground/80 text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right text-muted">{exp.date}</TableCell>
              <TableCell className="w-12 text-right">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted hover:text-foreground transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{exp.company} — {exp.role}</DialogTitle>
                      <DialogDescription>{exp.date}</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-3">
                      {exp.details?.split('\n\n').map((paragraph, idx) => (
                        <p key={idx} className="text-foreground/80 text-sm leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </motion.section>
  );
}
