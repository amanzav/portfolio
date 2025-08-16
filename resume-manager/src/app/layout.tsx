import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'Resume Builder',
  description: 'Single-source resume profiles with print to PDF'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <div className="mx-auto max-w-5xl p-6">{children}</div>
      </body>
    </html>
  );
}
