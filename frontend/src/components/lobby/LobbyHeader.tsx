"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface LobbyHeaderProps {
  onLeaveLobby?: () => void;
}

export function LobbyHeader({ onLeaveLobby }: LobbyHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
      {onLeaveLobby ? (
        <button
          type="button"
          onClick={onLeaveLobby}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#19151d] px-3.5 py-2 text-xs sm:text-sm font-medium text-[#b9b0bd] hover:text-white hover:border-white/20 transition-all active:scale-95 shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#c4a6d2]" />
          <span>Exit to Dashboard</span>
        </button>
      ) : (
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#19151d] px-3.5 py-2 text-xs sm:text-sm font-medium text-[#b9b0bd] hover:text-white hover:border-white/20 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-[#c4a6d2]" />
          <span>Exit to Dashboard</span>
        </Link>
      )}

      <div className="text-right">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#c4a6d2]">
          Council Chamber
        </p>
        <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
          Game Lobby
        </h1>
      </div>
    </header>
  );
}
