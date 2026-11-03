import React from "react";
import { Info, Plus, Search, Shield, Check, ScrollText } from "lucide-react";
import { DramaMaskIcon } from "./DramaMaskIcon";
import { PlayerCapacity, getRoleDistribution } from "@/services/rooms";

interface RoleDistributionPanelProps {
  capacity: PlayerCapacity;
}

export function RoleDistributionPanel({ capacity }: RoleDistributionPanelProps) {
  const roles = getRoleDistribution(capacity);

  const rules = [
    "Traitors secretly eliminate a player each night.",
    "Doctor protects one player each night.",
    "Detective investigates one player each night.",
    "Faithfuls discuss, analyse and vote to eliminate suspects.",
    "The game continues until a team wins.",
  ];

  return (
    <div className="w-full h-full rounded-3xl bg-[#120A14]/85 border border-gold-antique/30 backdrop-blur-xl p-6 sm:p-7 shadow-[0_4px_30px_rgba(20,9,28,0.5)] flex flex-col justify-between">
      {/* 1. Header: Role Distribution */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-cormorant text-2xl sm:text-3xl font-normal text-text-main tracking-wide">
              Role Distribution{" "}
              <span className="text-base sm:text-lg font-sans text-text-secondary">
                (for {capacity} Players)
              </span>
            </h2>
          </div>
          <div className="relative group cursor-pointer" title="Calculated via CSP solver rules">
            <Info className="w-4 h-4 text-text-secondary hover:text-gold-light transition-colors" />
          </div>
        </div>

        {/* 2. Compact 4 Role Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          {/* Card 1: Traitors */}
          <div className="rounded-2xl bg-[#1F0A14]/70 border border-rose-500/40 p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <DramaMaskIcon className="w-6 h-6 text-rose-400 mb-2" />
            <span className="font-cinzel text-2xl font-bold text-text-main leading-tight">
              {roles.traitors}
            </span>
            <span className="text-xs font-sans text-text-secondary mt-1">Traitors</span>
          </div>

          {/* Card 2: Doctor */}
          <div className="rounded-2xl bg-[#0A1F16]/70 border border-emerald-500/40 p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-6 h-6 flex items-center justify-center text-emerald-400 mb-2">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="font-cinzel text-2xl font-bold text-text-main leading-tight">
              {roles.doctor}
            </span>
            <span className="text-xs font-sans text-text-secondary mt-1">Doctor</span>
          </div>

          {/* Card 3: Detective */}
          <div className="rounded-2xl bg-[#1F190A]/70 border border-gold-antique/40 p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <Search className="w-6 h-6 text-gold-antique mb-2 stroke-[2]" />
            <span className="font-cinzel text-2xl font-bold text-text-main leading-tight">
              {roles.detective}
            </span>
            <span className="text-xs font-sans text-text-secondary mt-1">Detective</span>
          </div>

          {/* Card 4: Faithful */}
          <div className="rounded-2xl bg-[#0A1324]/70 border border-blue-500/40 p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <Shield className="w-6 h-6 text-blue-400 mb-2 stroke-[2]" />
            <span className="font-cinzel text-2xl font-bold text-text-main leading-tight">
              {roles.faithful}
            </span>
            <span className="text-xs font-sans text-text-secondary mt-1">Faithful</span>
          </div>
        </div>
      </div>

      {/* 3. Game Rules (Quick View) */}
      <div className="pt-6 border-t border-gold-antique/15 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <ScrollText className="w-4 h-4 text-gold-antique" />
          <h3 className="font-cormorant text-xl font-normal text-text-main tracking-wide">
            Game Rules (Quick View)
          </h3>
        </div>

        <ul className="space-y-2.5">
          {rules.map((rule, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-sans text-text-secondary leading-relaxed">
              <Check className="w-4 h-4 text-gold-antique shrink-0 mt-0.5 stroke-[2.5]" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
