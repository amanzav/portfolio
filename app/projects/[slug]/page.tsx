import { notFound } from "next/navigation";
import { projects } from "@/lib/projects";
import ProjectDetailClient from "@/components/ProjectDetailClient";

export default function ProjectDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = projects.find((proj) => proj.id === params.slug);
  if (!project) {
    notFound();
  }
  return (
    <main className="min-h-screen bg-background text-foreground px-4 md:px-8 py-8 md:py-12">
      <div className="max-w-3xl mx-auto pb-16">
        <ProjectDetailClient project={project} />
      </div>
    </main>
  );
}

// Required for static export
export function generateStaticParams() {
  return projects.map(proj => ({ slug: proj.id }));
}
