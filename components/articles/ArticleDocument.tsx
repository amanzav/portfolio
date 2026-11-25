import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import path from "node:path";

const articles = {
  "vooma": {
    file: "vooma.html",
    className: "article-page learning-article",
    title: "Memory and workflows at Vooma",
    description: "My work on AI memory, entity-linked retrieval, reusable workflows, and evaluations at Vooma.",
  },
  "boomerang": {
    file: "boomerang.html",
    className: "article-page learning-article",
    title: "Candidate search at Boomerang",
    description: "How I built candidate search and matching at Boomerang, with pseudocode for structured filters, neural retrieval, and reranking.",
  },
  "ford": {
    file: "ford.html",
    className: "article-page learning-article",
    title: "In-car infotainment at Ford",
    description: "What I learned from scoped firmware debugging, CAN replay, deferred packet processing, and route ranking across two Ford internships.",
  },
  "autopark": {
    file: "autopark.html",
    className: "article-page autopark-learning",
    title: "Teaching a car to park",
    description: "Learning to control a simulated car with PPO and TRPO: short explanations, pseudocode, and the limits of learning one parking path.",
  },
  "autopark/ppo": {
    file: "autopark-ppo.html",
    className: "article-page",
    title: "PPO: learning without overcorrecting",
    description: "A parking example of PPO: policies, advantages, and why the clipped objective limits the incentive for an oversized update.",
  },
  "multibot": {
    file: "multibot.html",
    className: "article-page learning-article",
    title: "Getting robots through the same crossing",
    description: "How I coordinated three simulated robots using shared intent, behavior trees, and local motion planning.",
  },
} as const;

export type ArticleSlug = keyof typeof articles;

export function articleMetadata(slug: ArticleSlug): Metadata {
  const article = articles[slug];
  const url = `https://www.azaveri.com/${slug}/`;
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: article.title,
      description: article.description,
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: ["/og-image.png"],
    },
  };
}

export function ArticleDocument({ slug }: { slug: ArticleSlug }) {
  const article = articles[slug];
  const html = readFileSync(
    path.join(process.cwd(), "content", "articles", article.file),
    "utf8",
  );

  // These checked-in documents contain trusted article markup, never user input.
  return <div className={article.className} dangerouslySetInnerHTML={{ __html: html }} />;
}
