"use client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import { motion } from "motion/react";
import { useState, useEffect } from "react";

function calculateDuration(dateString: string): string {
  const parts = dateString.split(' – ');
  if (parts.length !== 2) return '';
  
  const parseDate = (str: string) => {
    const [month, year] = str.split(' ');
    const monthMap: { [key: string]: number } = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    return new Date(parseInt(year), monthMap[month] || 0);
  };
  
  const start = parseDate(parts[0]);
  const end = parts[1].toLowerCase() === 'present' ? new Date() : parseDate(parts[1]);
  
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  
  if (months < 1) return '< 1 month';
  if (months === 1) return '1 month';
  if (months < 12) return `${months} months`;
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (remainingMonths === 0) return years === 1 ? '1 year' : `${years} years`;
  return `${years} ${years === 1 ? 'year' : 'years'} ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
}

export default function ExperienceDetailClient({ experience }: { experience: any }) {
  const [isBackHovered, setIsBackHovered] = useState(false);
  const duration = calculateDuration(experience.date);

  // Enable scrolling on detail pages
  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, []);

  return (
    <>
      {/* Subtle background gradient */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-foreground/[0.02] via-transparent to-transparent" />
      
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {/* Back button with hover text */}
        <div className="mb-10">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-foreground/70 hover:text-foreground transition-all"
            aria-label="Back to portfolio"
            onMouseEnter={() => setIsBackHovered(true)}
            onMouseLeave={() => setIsBackHovered(false)}
          >
            <div className="flex items-center justify-center w-8 h-8">
              <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            </div>
            <motion.span
              initial={{ width: 0, opacity: 0 }}
              animate={{
                width: isBackHovered ? 'auto' : 0,
                opacity: isBackHovered ? 1 : 0
              }}
              transition={{ duration: 0.15 }}
              className="text-sm font-medium overflow-hidden whitespace-nowrap"
            >
              Back to Portfolio
            </motion.span>
          </Link>
        </div>

        {/* Enhanced header section */}
        <motion.div 
          className="relative border border-border/50 rounded-lg p-6 mb-8 bg-foreground/[0.02] backdrop-blur-sm"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-foreground/[0.03] to-transparent pointer-events-none" />
          
          <div className="relative flex items-start gap-4 mb-4">
            <div className="w-16 h-16 flex items-center justify-center">
              <Image
                src={experience.logo}
                alt={`${experience.company} logo`}
                width={experience.company === "Transpire Technologies" ? 48 : 64}
                height={experience.company === "Transpire Technologies" ? 48 : 64}
                className="object-contain invert dark:invert-0"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-semibold text-foreground mb-1 tracking-tight">
                {experience.company}
              </h1>
              <p className="text-lg text-foreground/90 mb-2">
                {experience.role}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-foreground/10 text-foreground/70 text-xs font-medium border border-foreground/10">
                  {experience.date}
                </span>
                {duration && (
                  <span className="text-xs text-muted">
                    • {duration}
                  </span>
                )}
              </div>
            </div>
          </div>

          {experience.description && (
            <p className="text-foreground/70 text-base leading-relaxed italic border-l-2 border-foreground/20 pl-4">
              {experience.description}
            </p>
          )}
        </motion.div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mb-8" />

        {/* Skills section with stagger animation and hover effects */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="mb-10"
        >
          <h2 className="text-sm font-medium text-foreground/60 uppercase tracking-wider mb-4">
            Technologies & Skills
          </h2>
          <div className="flex gap-2 flex-wrap">
            {experience.skills.map((skill: string, idx: number) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15, delay: 0.15 + idx * 0.03 }}
                className="px-3 py-1.5 rounded-md bg-foreground/10 text-foreground/80 text-sm border border-foreground/10 hover:bg-foreground/15 hover:border-foreground/20 hover:scale-105 transition-all cursor-default"
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Divider */}
        {experience.details && (
          <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mb-8" />
        )}

        {/* Details section */}
        {experience.details && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.2 }}
            className="prose prose-neutral dark:prose-invert prose-sm max-w-none"
          >
            <h2 className="text-sm font-medium text-foreground/60 uppercase tracking-wider mb-4">
              What I Did
            </h2>
            <div className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {experience.details}
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
