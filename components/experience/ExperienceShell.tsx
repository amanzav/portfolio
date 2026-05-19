import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { ExperienceItem } from "@/lib/experiences";

interface ExperienceShellProps {
  experience: ExperienceItem;
  children: ReactNode;
}

export function ExperienceShell({ experience, children }: ExperienceShellProps) {
  return (
    <main className="blog-screen min-h-screen px-5 py-6 md:px-8 md:py-12">
      <div className="blog-grain" aria-hidden />
      <article className="relative z-10 mx-auto w-full max-w-2xl pb-24">
        <Link
          href="/work"
          className="font-mono text-xs uppercase tracking-[0.18em] text-muted transition-colors hover:text-foreground"
        >
          / work
        </Link>

        <header className="mt-14">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center border border-border bg-background pixel-corners">
              <Image
                src={experience.logo}
                alt={`${experience.company} logo`}
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
                work record · {experience.date}
              </p>
              <h1 className="mt-1 text-2xl font-medium leading-tight tracking-[-0.03em] text-foreground md:text-3xl">
                {experience.company}
              </h1>
            </div>
          </div>
          <p className="mt-6 max-w-xl text-base leading-7 text-foreground/75 md:text-[1.02rem] md:leading-8">
            {experience.role}
            {experience.location ? ` · ${experience.location}` : ""}
          </p>
        </header>

        <section className="mt-8 grid gap-3 border-y border-border py-4 font-mono text-xs uppercase tracking-[0.16em] text-muted md:grid-cols-[110px_1fr]">
          <span>stack</span>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-foreground/70">
            {experience.skills.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
          <span>role</span>
          <div className="text-foreground/70">{experience.role}</div>
        </section>

        <div className="prose-blog mt-10">{children}</div>

        <footer className="mt-20 border-t border-border pt-6 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted">
          <p>end of record · operator signs off</p>
        </footer>
      </article>
    </main>
  );
}
