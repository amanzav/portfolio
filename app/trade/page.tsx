import { BlogShell } from "@/components/blog";
import { TradePost } from "@/components/blog/posts/TradePost";
import { blogBySlug } from "@/lib/blogs";

const meta = blogBySlug("trade")!;

export const metadata = {
  title: meta.title,
  description: meta.subtitle,
};

export default function TradePage() {
  return (
    <BlogShell meta={meta}>
      <TradePost />
    </BlogShell>
  );
}
