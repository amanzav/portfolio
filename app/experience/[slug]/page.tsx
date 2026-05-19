import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { experiences } from "@/lib/experiences";
import { ExperienceShell } from "@/components/experience/ExperienceShell";
import { BoomerangPost } from "@/components/experience/posts/BoomerangPost";
import { Ford2025Post } from "@/components/experience/posts/Ford2025Post";
import { Ford2024Post } from "@/components/experience/posts/Ford2024Post";
import { TranspirePost } from "@/components/experience/posts/TranspirePost";

const postBySlug: Record<string, ReactNode> = {
  boomerang: <BoomerangPost />,
  "ford-2025": <Ford2025Post />,
  "ford-2024": <Ford2024Post />,
  transpire: <TranspirePost />,
};

export default function ExperienceDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const experience = experiences.find((e) => e.id === params.slug);
  const post = postBySlug[params.slug];
  if (!experience || !post) {
    notFound();
  }
  return <ExperienceShell experience={experience!}>{post}</ExperienceShell>;
}

export function generateStaticParams() {
  return experiences.map((e) => ({ slug: e.id }));
}
