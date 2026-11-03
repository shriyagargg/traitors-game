"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

export function ScrollIndicator() {
  const handleScroll = () => {
    const section = document.getElementById("how-to-play");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      onClick={handleScroll}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleScroll();
        }
      }}
      className="flex flex-col items-center justify-center cursor-pointer group mt-8 sm:mt-12 mb-6 z-10 transition-transform duration-300 hover:translate-y-0.5 focus:outline-none"
      aria-label="Scroll to Learn How to Play"
    >
      <span className="text-xs sm:text-sm font-sans tracking-wider text-text-secondary group-hover:text-text-main transition-colors">
        Learn How to Play
      </span>
      <ChevronDown className="w-4 h-4 text-gold-antique animate-float-slow mt-1 transition-colors group-hover:text-gold-light" />
    </div>
  );
}
