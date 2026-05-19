import { BlogShell } from "@/components/blog";
import { TennisPost } from "@/components/blog/posts/TennisPost";
import { blogBySlug } from "@/lib/blogs";

const meta = blogBySlug("tennis")!;

export const metadata = {
  title: meta.title,
  description: meta.subtitle,
};

export default function TennisPage() {
  return (
    <BlogShell meta={meta}>
      <TennisPost />
    </BlogShell>
  );
}
