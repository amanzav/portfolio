import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { notFound } from "next/navigation";
import { projects } from "@/lib/projects";
import ProjectDetailClient from "@/components/ProjectDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((item) => item.id === slug);
  if (!project) notFound();
  const url = siteUrl(`/projects/${slug}/`);
  return {
    title: project.name,
    description: project.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article", url, title: project.name, description: project.description,
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((proj) => proj.id === slug);
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
