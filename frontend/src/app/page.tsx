import React from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FeatureStrip } from "@/components/FeatureStrip";
import { ScrollIndicator } from "@/components/ScrollIndicator";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-background text-text-main selection:bg-purple-muted selection:text-gold-light">
      {/* Cinematic Background Atmospheric Layers */}
      {/* 1. Subtle top-center purple/burgundy gradient vignette */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 90% 65% at 50% 15%, #24101F 0%, #120A14 45%, #09060D 100%)",
        }}
        aria-hidden="true"
      />

      {/* 2. Soft bottom mist/fog layers matching the reference image */}
      <div
        className="pointer-events-none fixed -bottom-24 -left-20 w-[480px] h-[340px] rounded-full bg-purple-muted/15 blur-[120px] z-0"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-24 -right-20 w-[480px] h-[340px] rounded-full bg-burgundy-deep/25 blur-[120px] z-0"
        aria-hidden="true"
      />

      {/* Main Landing Viewport Container */}
      <div className="relative z-10 flex min-h-screen flex-col justify-between">
        {/* Navigation Bar */}
        <Navbar activeSection="home" />

        {/* Hero & Central Composition */}
        <div className="flex-1 flex flex-col items-center justify-center py-4 sm:py-6">
          <Hero />
          <FeatureStrip />
        </div>

        {/* Bottom Scroll Indicator */}
        <ScrollIndicator />
      </div>

      {/* Section Anchors for Navigation & Rules Overview */}
      <section
        id="how-to-play"
        className="relative z-10 w-full max-w-4xl mx-auto px-6 py-24 border-t border-purple-muted/30 text-center"
      >
        <h2 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-[0.16em] text-gold-antique mb-4">
          HOW TO PLAY
        </h2>
        <div className="h-[1px] w-20 bg-gold-antique/50 mx-auto mb-8" />
        <p className="font-cormorant italic text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
          &ldquo;Six to eight players enter the council chamber. Roles are secretly bestowed in darkness.
          Trust is a currency, deception is an art, and every accusation is weighed by The Architect.&rdquo;
        </p>
      </section>

      <section
        id="the-architect"
        className="relative z-10 w-full max-w-4xl mx-auto px-6 py-24 border-t border-purple-muted/30 text-center"
      >
        <h2 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-[0.16em] text-gold-antique mb-4">
          THE ARCHITECT
        </h2>
        <div className="h-[1px] w-20 bg-gold-antique/50 mx-auto mb-8" />
        <p className="font-cormorant italic text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
          &ldquo;An autonomous multi-agent intelligence orchestrating the state machine, logical contradiction analysis,
          epistemic knowledge bases, and real-time narrative arbitration.&rdquo;
        </p>
      </section>
    </main>
  );
}
