import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { BlogShell } from "@/components/blog";
import { TradePost } from "@/components/blog/posts/TradePost";
import { blogBySlug } from "@/lib/blogs";

const meta = blogBySlug("trade")!;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.subtitle,
  alternates: { canonical: siteUrl("/trade/") },
  openGraph: {
    type: "article",
    url: siteUrl("/trade/"),
    title: meta.title,
    description: meta.subtitle,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function TradePage() {
  return (
    <BlogShell meta={meta}>
      <TradePost />
    </BlogShell>
  );
}
