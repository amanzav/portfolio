import Image from "next/image";
import Link from "next/link";
import { experiences } from "@/lib/experiences";

export const metadata = {
  title: "Work",
  description: "Experience index for Aman Zaveri.",
};

export default function WorkPage() {
  return (
    <main className="min-h-screen px-5 py-6 md:px-8 md:py-10">
      <section className="mx-auto w-full max-w-4xl">
        <Header label="work index" title="Work" />

        <div className="mt-10 border-y border-border">
          {experiences.map((experience, index) => (
            <Link
              key={experience.id}
              href={`/experience/${experience.id}`}
              className="group grid gap-4 border-b border-border px-0 py-5 transition-colors last:border-b-0 hover:bg-foreground/[0.03] md:grid-cols-[48px_1fr_auto]"
            >
              <div className="flex h-10 w-10 items-center justify-center border border-border bg-background pixel-corners">
                <Image
                  src={experience.logo}
                  alt={`${experience.company} logo`}
                  width={
                    experience.company === "Transpire Technologies"
                      ? 24
                      : experience.company === "Boomerang Inc."
                      ? 28
                      : 30
                  }
                  height={
                    experience.company === "Transpire Technologies"
                      ? 24
                      : experience.company === "Boomerang Inc."
                      ? 28
                      : 30
                  }
                  className="object-contain"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center gap-3 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{experience.date}</span>
                </div>
                <h2 className="text-lg font-medium tracking-[-0.03em] text-foreground">
                  {experience.company}
                </h2>
                <p className="mt-1 text-sm text-foreground/70">{experience.role}</p>
              </div>

              <div className="flex items-end justify-end md:items-center">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-foreground/60 transition-colors group-hover:text-foreground">
                  open
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function Header({ label, title }: { label: string; title: string }) {
  return (
    <header>
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-[0.18em] text-muted transition-colors hover:text-foreground"
      >
        / home
      </Link>
      <p className="mt-14 font-mono text-xs uppercase tracking-[0.22em] text-muted">
        {label}
      </p>
      <h1 className="mt-3 text-4xl font-medium leading-none tracking-[-0.04em] md:text-5xl">
        {title}
      </h1>
    </header>
  );
}
