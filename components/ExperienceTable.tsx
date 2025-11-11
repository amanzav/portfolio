"use client";

import { motion } from "framer-motion";
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
      <Table>
        <TableBody>
          {experiences.map((exp, index) => (
            <TableRow key={index} className="border-neutral-800 hover:bg-neutral-900/50">
              <TableCell className="text-neutral-300">
                {exp.description ? (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-default hover:text-neutral-100 transition-colors">
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
              <TableCell className="text-neutral-300">{exp.role}</TableCell>
              <TableCell className="text-right text-neutral-400">{exp.date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </motion.section>
  );
}
