import { ArticleDocument, articleMetadata } from "@/components/articles/ArticleDocument";

export const metadata = articleMetadata("ford");

export default function Page() {
  return <ArticleDocument slug="ford" />;
}
