import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Aman Zaveri - Full-Stack & Embedded Engineer",
  description: "Full-Stack & Embedded Engineer building systems that ship. Portfolio showcasing experience at Ford Motor Company, Transpire Technologies, and projects like CourseClutch and Reva.",
  keywords: ["Aman Zaveri", "Software Engineer", "Full-Stack Developer", "Embedded Systems", "Ford", "Portfolio"],
  authors: [{ name: "Aman Zaveri" }],
  openGraph: {
    title: "Aman Zaveri - Full-Stack & Embedded Engineer",
    description: "Building Systems that Ship",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
