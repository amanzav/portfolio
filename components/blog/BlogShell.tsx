import Link from "next/link";
import type { ReactNode } from "react";
import type { BlogMeta } from "@/lib/blogs";

interface BlogShellProps {
  meta: BlogMeta;
  children: ReactNode;
}

export function BlogShell({ meta, children }: BlogShellProps) {
  return (
    <main className="blog-screen min-h-screen px-5 py-6 md:px-8 md:py-12">
      <div className="blog-grain" aria-hidden />
      <article className="relative z-10 mx-auto w-full max-w-2xl pb-24">
        <Link
          href="/projects"
          className="font-mono text-xs uppercase tracking-[0.18em] text-muted transition-colors hover:text-foreground"
        >
          / projects
        </Link>

        <header className="mt-14">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            blog record — {meta.date}
          </p>
          <h1 className="mt-3 text-2xl font-medium leading-tight tracking-[-0.04em] text-foreground md:text-3xl">
            {meta.title}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-foreground/70 md:text-base md:leading-7">
            {meta.subtitle}
          </p>
        </header>

        <section className="mt-8 grid gap-3 border-y border-border py-4 font-mono text-xs uppercase tracking-[0.16em] text-muted md:grid-cols-[110px_1fr]">
          <span>stack</span>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-foreground/70">
            {meta.stack.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </section>

        <div className="prose-blog mt-10">{children}</div>

        <footer className="mt-20 border-t border-border pt-6 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted">
          <p>end of record — signal terminates</p>
        </footer>
      </article>
    </main>
  );
}
