import { experiences } from "@/lib/experiences";
import ExperiencePageClient from "./ExperiencePageClient";

export function generateStaticParams() {
  return experiences.map((exp) => ({
    id: exp.id,
  }));
}

export default function ExperiencePage({ params }: { params: { id: string } }) {
  const experience = experiences.find((exp) => exp.id === params.id);

  if (!experience) {
    return null;
  }

  return <ExperiencePageClient experience={experience} />;
}
