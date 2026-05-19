import { BlogShell } from "@/components/blog";
import { MultibotPost } from "@/components/blog/posts/MultibotPost";
import { blogBySlug } from "@/lib/blogs";

const meta = blogBySlug("multibot")!;

export const metadata = {
  title: meta.title,
  description: meta.subtitle,
};

export default function MultibotPage() {
  return (
    <BlogShell meta={meta}>
      <MultibotPost />
    </BlogShell>
  );
}
