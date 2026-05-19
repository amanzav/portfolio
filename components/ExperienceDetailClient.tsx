"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ExperienceItem } from "@/lib/experiences";

function calculateDuration(dateString: string): string {
  const parts = dateString.split(" – ");
  if (parts.length !== 2) return "";

  const parseDate = (str: string) => {
    const [month, year] = str.split(" ");
    const monthMap: { [key: string]: number } = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    return new Date(parseInt(year), monthMap[month] || 0);
  };

  const start = parseDate(parts[0]);
  const end = parts[1].toLowerCase() === "present" ? new Date() : parseDate(parts[1]);
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

  if (months < 1) return "< 1 month";
  if (months === 1) return "1 month";
  if (months < 12) return `${months} months`;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (remainingMonths === 0) return years === 1 ? "1 year" : `${years} years`;
  return `${years} ${years === 1 ? "year" : "years"} ${remainingMonths} ${
    remainingMonths === 1 ? "month" : "months"
  }`;
}

export default function ExperienceDetailClient({
  experience,
}: {
  experience: ExperienceItem;
}) {
  const duration = calculateDuration(experience.date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <header>
        <Link
          href="/work"
          className="font-mono text-xs uppercase tracking-[0.18em] text-muted transition-colors hover:text-foreground"
        >
          / work
        </Link>

        <div className="mt-14 flex items-start gap-5">
          <div className="flex h-14 w-14 items-center justify-center border border-border bg-background pixel-corners">
            <Image
              src={experience.logo}
              alt={`${experience.company} logo`}
              width={experience.company === "Transpire Technologies" ? 34 : 42}
              height={experience.company === "Transpire Technologies" ? 34 : 42}
              className="object-contain"
            />
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
              experience record
            </p>
            <h1 className="mt-3 text-3xl font-medium leading-none tracking-[-0.04em] md:text-5xl">
              {experience.company}
            </h1>
          </div>
        </div>

        <p className="mt-5 max-w-2xl text-base leading-7 text-foreground/80">
          {experience.role}
        </p>
        {experience.description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/60">
            {experience.description}
          </p>
        )}
      </header>

      <section className="mt-9 grid gap-3 border-y border-border py-4 font-mono text-xs uppercase tracking-[0.16em] text-muted md:grid-cols-[120px_1fr]">
        <span>period</span>
        <span className="text-foreground/70">
          {experience.date}
          {duration ? ` / ${duration}` : ""}
        </span>

        <span>stack</span>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-foreground/70">
          {experience.skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
      </section>

      {experience.details && (
        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            work log
          </h2>
          <div className="mt-5 space-y-5 text-sm leading-7 text-foreground/80">
            {experience.details.split("\n\n").map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
