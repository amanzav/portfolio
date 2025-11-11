import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aman Zaveri — Software Engineer",
  description: "Building minimal, scalable systems across web and embedded.",
  keywords: ["Software Engineer", "Web Development", "Embedded Systems", "AI"],
  authors: [{ name: "Aman Zaveri" }],
  openGraph: {
    title: "Aman Zaveri — Software Engineer",
    description: "Building minimal, scalable systems across web and embedded.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
