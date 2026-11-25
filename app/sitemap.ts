import type { MetadataRoute } from "next";
import { experiences } from "@/lib/experiences";
import { projects } from "@/lib/projects";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const articlePaths = [
    "/vooma/",
    "/boomerang/",
    "/ford/",
    "/autopark/",
    "/autopark/ppo/",
    "/multibot/",
  ];
  const legacyPaths = [
    "/work/",
    "/projects/",
    "/tennis/",
    "/trade/",
    ...experiences.map(({ id }) => `/experience/${id}/`),
    ...projects.map(({ id }) => `/projects/${id}/`),
  ];

  return [
    { url: siteUrl(), changeFrequency: "monthly", priority: 1 },
    ...articlePaths.map((path) => ({
      url: siteUrl(path),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...legacyPaths.map((path) => ({
      url: siteUrl(path),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
