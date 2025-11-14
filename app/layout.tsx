import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://amanzav.github.io'),
  title: {
    default: "Aman Zaveri",
    template: "%s | Aman Zaveri"
  },
  description: "Hey! I'm Aman Zaveri, a 3rd year Mechatronics Engineer at the University of Waterloo. Currently interning at Ford!",
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
    title: "Aman Zaveri — Software Engineer",
    description: "Building minimal, scalable systems across web and embedded. Experienced in React, Next.js, TypeScript, embedded systems, and AI/ML.",
    images: [
      {
        url: "/og-image.svg",
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
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Aman Zaveri',
    url: 'https://amanzav.github.io',
    jobTitle: 'Software Engineer',
    description: 'Building minimal, scalable systems across web and embedded.',
    sameAs: [
      'https://github.com/amanzav',
      'https://linkedin.com/in/amanzav',
      'https://twitter.com/amanzav',
    ],
    knowsAbout: [
      'Software Engineering',
      'Web Development',
      'Embedded Systems',
      'Artificial Intelligence',
      'Machine Learning',
      'React',
      'Next.js',
      'TypeScript',
    ],
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Aman Zaveri Portfolio',
    url: 'https://amanzav.github.io',
    description: 'Software engineer portfolio showcasing projects and experience',
    author: {
      '@type': 'Person',
      name: 'Aman Zaveri',
    },
  };

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased lg:overflow-hidden lg:h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, '\\u003c'),
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
