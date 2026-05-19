import Link from "next/link";
import { Github, MoveUpRight } from "lucide-react";
import { projects } from "@/lib/projects";
import { blogs } from "@/lib/blogs";

export const metadata = {
  title: "Projects",
  description: "Project index for Aman Zaveri.",
};

export default function ProjectsPage() {
  return (
    <main className="min-h-screen px-5 py-6 md:px-8 md:py-10">
      <section className="mx-auto w-full max-w-4xl">
        <Header label="project index" title="Projects" />

        <div className="mt-10">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted">
            / writing — notes from things I built
          </p>
          <div className="mt-4 grid gap-3">
            {blogs.map((blog, index) => (
              <article
                key={blog.slug}
                className="group border border-border bg-background/80 p-4 transition-colors hover:bg-foreground/[0.03] pixel-corners md:p-5"
              >
                <Link href={`/${blog.slug}`} className="block">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted">
                        {String(index + 1).padStart(2, "0")} / note — {blog.date}
                      </p>
                      <h2 className="mt-3 text-xl font-medium tracking-[-0.03em] text-foreground">
                        {blog.title}
                      </h2>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-foreground/70">
                        {blog.blurb}
                      </p>
                    </div>
                    <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted transition-colors group-hover:text-foreground">
                      read
                    </span>
                  </div>
                </Link>
                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border pt-4 font-mono text-xs uppercase tracking-[0.16em] text-muted">
                  {blog.stack.slice(0, 5).map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-14">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted">
            / archive — older shipped work
          </p>
        </div>

        <div className="mt-4 grid gap-3">
          {projects.map((project, index) => (
            <article
              key={project.id}
              className="group border border-border bg-background/80 p-4 transition-colors hover:bg-foreground/[0.03] pixel-corners md:p-5"
            >
              <Link href={`/projects/${project.id}`} className="block">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted">
                      {String(index + 1).padStart(2, "0")} / project
                    </p>
                    <h2 className="mt-3 text-xl font-medium tracking-[-0.03em] text-foreground">
                      {project.name}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-foreground/70">
                      {project.description}
                    </p>
                  </div>
                  <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted transition-colors group-hover:text-foreground">
                    open
                  </span>
                </div>
              </Link>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border pt-4 font-mono text-xs uppercase tracking-[0.16em] text-muted">
                {project.skills.slice(0, 4).map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
                <div className="ml-auto flex items-center gap-3">
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${project.name} GitHub repository`}
                    className="text-muted transition-colors hover:text-foreground"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                  {project.siteUrl && (
                    <a
                      href={project.siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${project.name} live site`}
                      className="text-muted transition-colors hover:text-foreground"
                    >
                      <MoveUpRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </article>
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
