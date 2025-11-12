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
  description?: string;
  details?: string;
}

const experiences: ExperienceItem[] = [
  {
    company: "Ford Motor Company",
    role: "Software Engineering Intern",
    date: "2024–2025",
    description: "Developed route-aware fuel optimization widget (Kotlin).",
    details: "More detailed information about the Ford internship experience will go here.",
  },
  {
    company: "Transpire Technologies",
    role: "Software Engineering Intern",
    date: "2024",
    description: "Built real-time analytics platform (Flask + Kubernetes).",
    details: "More detailed information about the Transpire Technologies internship experience will go here.",
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
                    <div className="mt-4">
                      <p className="text-foreground/80">{exp.details}</p>
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
