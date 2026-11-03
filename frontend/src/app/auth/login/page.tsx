import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background text-text-main flex flex-col justify-between">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-md mx-auto py-16">
        <div className="w-14 h-14 rounded-2xl bg-burgundy-deep/60 border border-gold-antique/40 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
          <Shield className="w-7 h-7 text-gold-antique" />
        </div>
        <h1 className="font-cinzel text-3xl font-bold tracking-wider text-gold-gradient mb-2">
          COUNCIL LOGIN
        </h1>
        <p className="font-cormorant italic text-base text-text-secondary mb-8">
          &ldquo;Identify yourself to access your player profile and historical records.&rdquo;
        </p>
        <div className="p-6 rounded-xl border border-purple-muted/40 bg-bg-secondary/70 backdrop-blur-md w-full mb-6">
          <p className="text-sm font-sans text-text-secondary leading-relaxed">
            Authentication service will be connected in Phase 2.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-sans text-gold-antique hover:text-gold-light transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Landing Page</span>
        </Link>
      </div>
      <footer className="py-6 text-center text-xs font-sans text-text-secondary/60">
        AI TRAITORS • The Architect
      </footer>
    </main>
  );
}
