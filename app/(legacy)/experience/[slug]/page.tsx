import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const experience = experiences.find((item) => item.id === slug);
  if (!experience || !postBySlug[slug]) notFound();
  const title = `${experience.shortCompany || experience.company} - ${experience.role}`;
  const description = experience.description || `${experience.role} at ${experience.company}.`;
  const url = siteUrl(`/experience/${slug}/`);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article", url, title, description,
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
  };
}

export default async function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const experience = experiences.find((e) => e.id === slug);
  const post = postBySlug[slug];
  if (!experience || !post) {
    notFound();
  }
  return <ExperienceShell experience={experience!}>{post}</ExperienceShell>;
}

export function generateStaticParams() {
  return experiences.map((e) => ({ slug: e.id }));
}
