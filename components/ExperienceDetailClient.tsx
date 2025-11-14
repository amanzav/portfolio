"use client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import Image from "next/image";
import { motion } from "motion/react";

export default function ExperienceDetailClient({ experience }: { experience: any }) {
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

      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 relative flex items-center justify-center">
          <Image
            src={experience.logo}
            alt={`${experience.company} logo`}
            width={experience.company === "Transpire Technologies" ? 48 : 64}
            height={experience.company === "Transpire Technologies" ? 48 : 64}
            className="object-contain invert dark:invert-0"
          />
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-1">
            {experience.company}
          </h1>
          <p className="text-lg text-foreground/90 mb-2">
            {experience.role}
          </p>
          <p className="text-sm text-muted">{experience.date}</p>
        </div>
      </div>

      {experience.description && (
        <p className="text-foreground/80 mb-6 text-base italic">
          {experience.description}
        </p>
      )}

      <div className="flex gap-2 flex-wrap mb-8">
        {experience.skills.map((skill: string, idx: number) => (
          <span
            key={idx}
            className="px-3 py-1.5 rounded-md bg-foreground/10 text-foreground/80 text-sm"
          >
            {skill}
          </span>
        ))}
      </div>

      {experience.details && (
        <div className="prose prose-invert prose-sm max-w-none">
          <h2 className="text-xl font-medium text-foreground mb-4">
            What I Did
          </h2>
          <div className="text-foreground/80 leading-relaxed whitespace-pre-line">
            {experience.details}
          </div>
        </div>
      )}
    </motion.div>
  );
}
