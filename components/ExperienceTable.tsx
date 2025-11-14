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
      <h2 className="text-base md:text-lg font-medium text-foreground mb-2 md:mb-1 tracking-tight">
        Experience
      </h2>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        {experiences.map((exp, index) => (
          <Link
            key={index}
            href={`/experience/${exp.id}`}
            className="block group"
          >
            <div className="border border-border rounded-lg p-4 hover:bg-foreground/5 hover:border-foreground/20 transition-all">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Logo */}
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                    <Image
                      src={exp.logo}
                      alt={`${exp.company} logo`}
                      width={exp.company === "Transpire Technologies" ? 28 : 40}
                      height={exp.company === "Transpire Technologies" ? 28 : 40}
                      className="object-contain invert dark:invert-0"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground/90 truncate">
                      {exp.company}
                    </h3>
                    <p className="text-sm text-foreground/70 mt-0.5">
                      {exp.role}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {exp.date}
                    </p>
                    
                    {/* Skills - Show first 2 on mobile */}
                    {exp.skills.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-2">
                        {exp.skills.slice(0, 2).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-foreground/10 text-foreground/80 text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                        {exp.skills.length > 2 && (
                          <span className="px-2 py-0.5 text-muted text-xs">
                            +{exp.skills.length - 2}
                          </span>
                        )}
                      </div>
                    )}
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
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block">
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
                <TableCell className="text-foreground/90 text-xs md:text-sm py-1.5">
                  {exp.company}
                </TableCell>
                <TableCell className="text-foreground/90 text-xs md:text-sm py-1.5">
                  {exp.role}
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
      </div>
    </motion.section>
  );
}
