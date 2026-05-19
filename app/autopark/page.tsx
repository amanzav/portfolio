import { BlogShell } from "@/components/blog";
import { AutoparkPost } from "@/components/blog/posts/AutoparkPost";
import { blogBySlug } from "@/lib/blogs";

const meta = blogBySlug("autopark")!;

export const metadata = {
  title: meta.title,
  description: meta.subtitle,
};

export default function AutoparkPage() {
  return (
    <BlogShell meta={meta}>
      <AutoparkPost />
    </BlogShell>
  );
}
