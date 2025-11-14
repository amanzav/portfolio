"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
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
              <TableCell className="py-1.5 w-10 md:w-12">
                <div className="w-6 h-6 md:w-8 md:h-8 relative flex items-center justify-center">
                  <Image
                    src={exp.logo}
                    alt={`${exp.company} logo`}
                    width={exp.company === "Transpire Technologies" ? 24 : 32}
                    height={exp.company === "Transpire Technologies" ? 24 : 32}
                    className="object-contain invert dark:invert-0"
                  />
                </div>
              </TableCell>
              <TableCell className="text-foreground/90 text-sm py-1.5">
                <span className="sm:hidden">{exp.shortCompany || exp.company}</span>
                <span className="hidden sm:inline">{exp.company}</span>
              </TableCell>
              <TableCell className="text-foreground/90 text-sm py-1.5">
                <span className="sm:hidden">{exp.shortRole || exp.role}</span>
                <span className="hidden sm:inline">{exp.role}</span>
              </TableCell>
              <TableCell className="text-foreground/70 text-xs py-1.5 hidden lg:table-cell">
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
              <TableCell className="text-right text-muted text-xs py-6 hidden lg:table-cell whitespace-nowrap">{exp.date}</TableCell>
              <TableCell className="text-right py-1.5 w-10 md:w-12">
                <Link
                  href={`/experience/${exp.id}`}
                  className="inline-flex items-center justify-center w-8 h-8 text-foreground/70 hover:text-foreground transition-colors group"
                  aria-label="View details"
                >
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:-rotate-45" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </motion.section>
  );
}
