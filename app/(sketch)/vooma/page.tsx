import { ArticleDocument, articleMetadata } from "@/components/articles/ArticleDocument";

export const metadata = articleMetadata("vooma");

export default function Page() {
  return <ArticleDocument slug="vooma" />;
}
