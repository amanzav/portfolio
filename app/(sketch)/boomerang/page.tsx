import { ArticleDocument, articleMetadata } from "@/components/articles/ArticleDocument";

export const metadata = articleMetadata("boomerang");

export default function Page() {
  return <ArticleDocument slug="boomerang" />;
}
