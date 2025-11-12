"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import { experiences } from "@/lib/experiences";

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
                <Link href={`/experience/${exp.id}`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted hover:text-foreground transition-colors"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </motion.section>
  );
}
