"use client";

import React from "react";
import { MatchStatItem } from "@/types/victory";
import { BarChart3 } from "lucide-react";

interface MatchStatsSummaryProps {
  stats: MatchStatItem[];
}

export function MatchStatsSummary({ stats }: MatchStatsSummaryProps) {
  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center gap-2 pb-1">
        <BarChart3 className="w-4 h-4 text-gold-antique" />
        <h3 className="font-cormorant text-xl font-bold tracking-wide text-gold-light">
          Match Statistics
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl border border-white/10 bg-[#120A14]/80 backdrop-blur-md flex flex-col justify-between"
          >
            <span className="text-[11px] font-sans text-text-secondary/70 uppercase tracking-wider">
              {stat.label}
            </span>
            <span className="font-mono text-2xl font-bold text-gold-light my-1">
              {stat.value}
            </span>
            {stat.subtext && (
              <span className="text-[10px] font-sans text-text-secondary/50">
                {stat.subtext}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

