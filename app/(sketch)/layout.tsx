import type { Metadata } from "next";
import { SITE_URL, siteUrl } from "@/lib/site";
import "@/styles/sketch-article.css";
import "@/styles/portfolio-shell.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Aman Zaveri", template: "%s | Aman Zaveri" },
  description: "Mechatronics at Waterloo. Currently building AI systems at Vooma.",
  alternates: { canonical: siteUrl() },
  authors: [{ name: "Aman Zaveri" }],
  openGraph: {
    type: "website",
    url: siteUrl(),
    siteName: "Aman Zaveri",
    title: "Aman Zaveri",
    description: "Software, embedded systems, and robotics. Mechatronics at Waterloo.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Aman Zaveri's pencil robotic arm portfolio" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-image.png"] },
  robots: { index: true, follow: true },
};

export default function SketchLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
