import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI TRAITORS — The Architect",
  description:
    "An Autonomous Multi-Agent Social Deduction and Strategy Platform. The AI is not just playing the game. The AI is running the game.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-text-main font-sans antialiased selection:bg-purple-muted selection:text-gold-light">
        {children}
      </body>
    </html>
  );
}
