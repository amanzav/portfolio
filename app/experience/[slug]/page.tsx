import { notFound } from "next/navigation";
import { experiences } from "@/lib/experiences";
import ExperienceDetailClient from "@/components/ExperienceDetailClient";

export default function ExperienceDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const experience = experiences.find((exp) => exp.id === params.slug);
  if (!experience) {
    notFound();
  }
  return (
    <main className="min-h-screen bg-background text-foreground px-4 md:px-8 py-8 md:py-12">
      <div className="max-w-3xl mx-auto pb-16">
        <ExperienceDetailClient experience={experience} />
      </div>
    </main>
  );
}

// Required for static export
export function generateStaticParams() {
  return experiences.map(exp => ({ slug: exp.id }));
}
