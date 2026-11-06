"use client";

import React from "react";
import {
  Target,
  Eye,
  Plus,
  Search,
  Shield,
  Info,
} from "lucide-react";
import { DramaMaskIcon } from "../game/DramaMaskIcon";
import { RoleConfig } from "@/types/roleReveal";

interface RoleInfoPanelProps {
  config: RoleConfig;
}

export function RoleInfoPanel({ config }: RoleInfoPanelProps) {
  // Render role-specific header icon
  const renderRoleIcon = () => {
    switch (config.role) {
      case "traitor":
        return <DramaMaskIcon className="w-8 h-8 text-red-500" />;
      case "doctor":
        return <Plus className="w-8 h-8 text-emerald-400 stroke-[3]" />;
      case "detective":
        return <Search className="w-8 h-8 text-gold-antique stroke-[2.5]" />;
      case "faithful":
      default:
        return <Shield className="w-8 h-8 text-blue-400 stroke-[2]" />;
    }
  };

  return (
    <div className="w-full max-w-[480px] h-[410px] sm:h-[440px] rounded-3xl border border-white/10 bg-[#120A14]/90 backdrop-blur-xl p-6 sm:p-7 shadow-[0_4px_30px_rgba(20,9,28,0.5)] flex flex-col justify-between text-left transition-all duration-500">
      {/* 1. Header: Role Identity */}
      <div className="flex items-center gap-3.5 pb-2 border-b border-gold-antique/10">
        <div className="w-12 h-12 rounded-2xl bg-[#1A0E1C] border border-gold-antique/25 flex items-center justify-center shrink-0 shadow-inner">
          {renderRoleIcon()}
        </div>
        <div>
          <h2 className="font-cinzel text-2xl font-bold tracking-wide text-[#F5EEDC]">
            {config.title}
          </h2>
          <p className="text-xs font-sans text-text-secondary font-medium">
            {config.subtitle}
          </p>
        </div>
      </div>

      {/* 2. Your Objective */}
      <div className="py-1">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-gold-antique" />
          <h3 className="font-sans text-xs sm:text-sm font-semibold text-gold-light tracking-wide">
            Your Objective
          </h3>
        </div>
        <p className="text-xs sm:text-sm font-sans text-text-secondary leading-relaxed pl-6">
          {config.objective}
        </p>
      </div>

      {/* 3. Your Abilities */}
      <div className="py-1">
        <div className="flex items-center gap-2 mb-1.5">
          <Eye className="w-4 h-4 text-gold-antique" />
          <h3 className="font-sans text-xs sm:text-sm font-semibold text-gold-light tracking-wide">
            Your Abilities
          </h3>
        </div>
        <ul className="space-y-1.5 pl-6">
          {config.abilities.map((ability, index) => (
            <li
              key={index}
              className="text-xs sm:text-sm font-sans text-text-secondary flex items-start gap-2 leading-snug"
            >
              <span className="text-gold-antique font-bold leading-none mt-1">•</span>
              <span>{ability}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 4. Reminder Callout Box */}
      <div className="rounded-2xl border border-gold-antique/25 bg-[#1A0E1C]/90 p-3.5 sm:p-4 flex items-start sm:items-center gap-3 shadow-inner">
        <div className="w-7 h-7 rounded-full bg-gold-antique/10 border border-gold-antique/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
          <Info className="w-4 h-4 text-gold-antique" />
        </div>
        <p className="text-xs font-sans text-text-secondary/90 leading-relaxed italic">
          {config.reminder}
        </p>
      </div>
    </div>
  );
}
