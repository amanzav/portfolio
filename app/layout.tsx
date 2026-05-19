import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { Analytics } from "@vercel/analytics/next";
import { RouteGlitch } from "@/components/RouteGlitch";
import { BootOverlay } from "@/components/BootOverlay";
import { SignalOverlay } from "@/components/SignalOverlay";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://amanzav.github.io"),
  title: {
    default: "Aman Zaveri",
    template: "%s | Aman Zaveri",
  },
  description:
    "Aman Zaveri builds minimal software, mechatronics, and systems interfaces.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: { url: "/icon.svg", type: "image/svg+xml" },
  },
  authors: [{ name: "Aman Zaveri", url: "https://github.com/amanzav" }],
  creator: "Aman Zaveri",
  publisher: "Aman Zaveri",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://amanzav.github.io",
    siteName: "Aman Zaveri Portfolio",
    title: "Aman Zaveri — Software / Mechatronics / Systems",
    description:
      "Minimal systems portfolio for software, mechatronics, and interface work.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Aman Zaveri - Software Engineer Portfolio",
      },
    ],
  },
  alternates: {
    canonical: "https://amanzav.github.io",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Aman Zaveri",
    url: "https://amanzav.github.io",
    jobTitle: "Software Engineer",
    description: "Building minimal software, mechatronics, and systems interfaces.",
    sameAs: [
      "https://github.com/amanzav",
      "https://linkedin.com/in/amanzav",
      "https://twitter.com/amanzav",
    ],
    knowsAbout: [
      "Software Engineering",
      "Web Development",
      "Embedded Systems",
      "Artificial Intelligence",
      "Machine Learning",
      "React",
      "Next.js",
      "TypeScript",
    ],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Aman Zaveri Portfolio",
    url: "https://amanzav.github.io",
    description:
      "Software engineer portfolio showcasing projects and experience",
    author: {
      "@type": "Person",
      name: "Aman Zaveri",
    },
  };

  return (
    <html lang="en" className={`${inter.variable} ${jetBrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <BootOverlay />
        <SignalOverlay />
        <RouteGlitch />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
