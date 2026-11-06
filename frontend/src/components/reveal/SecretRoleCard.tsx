"use client";

import React from "react";
import Image from "next/image";
import { RoleConfig } from "@/types/roleReveal";

interface SecretRoleCardProps {
  config: RoleConfig;
}

export function SecretRoleCard({ config }: SecretRoleCardProps) {
  // Define border and glow styling based on role
  const getRoleStyling = () => {
    switch (config.role) {
      case "traitor":
        return {
          border: "border-red-600/80",
          shadow: "shadow-[0_0_40px_rgba(220,38,38,0.32)]",
          glowBg: "radial-gradient(circle at 50% 45%, rgba(220, 38, 38, 0.22) 0%, rgba(18, 10, 20, 0.95) 75%)",
          cornerGlow: "bg-red-500",
          titleGradient: "bg-gradient-to-r from-red-500 via-rose-300 to-amber-500",
        };
      case "doctor":
        return {
          border: "border-emerald-500/80",
          shadow: "shadow-[0_0_40px_rgba(16,185,129,0.32)]",
          glowBg: "radial-gradient(circle at 50% 45%, rgba(16, 185, 129, 0.22) 0%, rgba(18, 10, 20, 0.95) 75%)",
          cornerGlow: "bg-emerald-400",
          titleGradient: "bg-gradient-to-r from-emerald-400 via-teal-200 to-emerald-500",
        };
      case "detective":
        return {
          border: "border-gold-antique/80",
          shadow: "shadow-[0_0_40px_rgba(212,175,55,0.32)]",
          glowBg: "radial-gradient(circle at 50% 45%, rgba(212, 175, 55, 0.22) 0%, rgba(18, 10, 20, 0.95) 75%)",
          cornerGlow: "bg-gold-light",
          titleGradient: "bg-gradient-to-r from-gold-light via-[#FFF2D0] to-gold-antique",
        };
      case "faithful":
      default:
        return {
          border: "border-blue-500/80",
          shadow: "shadow-[0_0_40px_rgba(96,165,250,0.32)]",
          glowBg: "radial-gradient(circle at 50% 45%, rgba(96, 165, 250, 0.22) 0%, rgba(18, 10, 20, 0.95) 75%)",
          cornerGlow: "bg-blue-400",
          titleGradient: "bg-gradient-to-r from-blue-400 via-cyan-200 to-indigo-400",
        };
    }
  };

  const styling = getRoleStyling();

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Card Container */}
      <div
        style={{ background: styling.glowBg }}
        className={`relative w-full max-w-[340px] sm:max-w-[360px] h-[410px] sm:h-[440px] rounded-3xl border-2 ${styling.border} ${styling.shadow} backdrop-blur-xl p-6 flex flex-col items-center justify-between text-center overflow-hidden transition-all duration-700 animate-in fade-in zoom-in-95`}
      >
        {/* Subtle Edge Glow Points at Top & Bottom */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[2px] ${styling.cornerGlow} blur-[2px] opacity-90`}
        />
        <div
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-[2px] ${styling.cornerGlow} blur-[2px] opacity-90`}
        />

        {/* 1. Character Thematic Illustration */}
        <div className="relative w-full flex-1 flex items-center justify-center pt-2">
          <div className="relative w-[210px] h-[160px] flex items-center justify-center">
            <Image
              src={config.imageSrc}
              alt={config.title}
              width={210}
              height={150}
              unoptimized
              priority
              className="object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] scale-105 transition-transform duration-500 hover:scale-110"
            />
          </div>
        </div>

        {/* 2. Text Reveal Section */}
        <div className="w-full flex flex-col items-center pb-4">
          <span className="font-sans text-xs tracking-[0.28em] text-text-secondary/85 uppercase font-medium mb-1">
            YOU ARE A
          </span>
          <h2
            className={`font-cinzel text-3xl sm:text-4xl font-extrabold tracking-[0.18em] uppercase ${styling.titleGradient} bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)]`}
          >
            {config.title}
          </h2>
        </div>
      </div>
    </div>
  );
}
