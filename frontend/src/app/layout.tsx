import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI TRAITORS — The Architect",
  description: "An Autonomous Multi-Agent Social Deduction and Strategy Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-void text-zinc-100 antialiased selection:bg-burgundy-700 selection:text-gold-light">
        {children}
      </body>
    </html>
  );
}
