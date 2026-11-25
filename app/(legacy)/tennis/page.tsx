import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { BlogShell } from "@/components/blog";
import { TennisPost } from "@/components/blog/posts/TennisPost";
import { blogBySlug } from "@/lib/blogs";

const meta = blogBySlug("tennis")!;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.subtitle,
  alternates: { canonical: siteUrl("/tennis/") },
  openGraph: {
    type: "article",
    url: siteUrl("/tennis/"),
    title: meta.title,
    description: meta.subtitle,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function TennisPage() {
  return (
    <BlogShell meta={meta}>
      <TennisPost />
    </BlogShell>
  );
}
