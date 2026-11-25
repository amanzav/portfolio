import { ArticleDocument, articleMetadata } from "@/components/articles/ArticleDocument";

export const metadata = articleMetadata("autopark");

export default function Page() {
  return <ArticleDocument slug="autopark" />;
}
