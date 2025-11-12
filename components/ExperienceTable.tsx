"use client";

import { motion } from "motion/react";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { experiences } from "@/lib/experiences";

export function ExperienceTable() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut", delay: 0.1 }}
      className="flex-shrink-0"
    >
      <h2 className="text-lg font-medium text-foreground mb-1 tracking-tight">
        Experience
      </h2>
      <Table>
        <TableBody>
          {experiences.map((exp, index) => (
            <TableRow key={index} className="border-border hover:bg-foreground/5">
              <TableCell className="text-foreground/90 text-sm py-1.5">
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
              <TableCell className="text-foreground/90 text-sm py-1.5">{exp.role}</TableCell>
              <TableCell className="text-foreground/70 text-xs py-1.5">
                <div className="flex gap-1 flex-wrap">
                  {exp.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded-md bg-foreground/10 text-foreground/80 text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right text-muted text-xs py-6">{exp.date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </motion.section>
  );
}
