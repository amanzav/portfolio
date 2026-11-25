import { ArticleDocument, articleMetadata } from "@/components/articles/ArticleDocument";

export const metadata = articleMetadata("multibot");

export default function Page() {
  return <ArticleDocument slug="multibot" />;
}
