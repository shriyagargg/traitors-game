import React from "react";
import Link from "next/link";
import { Gamepad2, Users, ArrowRight } from "lucide-react";

export function ActionCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 my-6 w-full">
      {/* 1. Create a Game Action Card */}
      <Link
        href="/lobby/create"
        className="group relative flex items-center justify-between p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-gold-light via-[#F3DEAA] to-gold-antique text-background transition-all duration-300 shadow-[0_4px_25px_rgba(242,216,154,0.3)] hover:shadow-[0_6px_35px_rgba(212,175,55,0.45)] hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-background/10 border border-background/20 flex items-center justify-center shrink-0">
            <Gamepad2 className="w-6 h-6 text-background stroke-[2]" />
          </div>
          <div className="flex flex-col text-left">
            <h2 className="font-cinzel text-lg sm:text-xl font-bold tracking-wide text-background">
              Create a Game
            </h2>
            <p className="text-xs sm:text-sm font-sans text-background/80 font-medium">
              Host a new game and invite your friends
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-background transition-transform duration-300 group-hover:translate-x-1 shrink-0" />
      </Link>

      {/* 2. Join a Game Action Card */}
      <Link
        href="/lobby/join"
        className="group relative flex items-center justify-between p-5 sm:p-6 rounded-2xl bg-[#120A14]/85 hover:bg-[#1A0E1C] border border-gold-antique/60 hover:border-gold-antique text-text-main transition-all duration-300 backdrop-blur-md shadow-[0_4px_20px_rgba(18,10,20,0.5)] hover:shadow-[0_6px_25px_rgba(212,175,55,0.2)] hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1A0E1C] border border-gold-antique/30 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-gold-antique stroke-[1.8]" />
          </div>
          <div className="flex flex-col text-left">
            <h2 className="font-cinzel text-lg sm:text-xl font-bold tracking-wide text-text-main group-hover:text-gold-light transition-colors">
              Join a Game
            </h2>
            <p className="text-xs sm:text-sm font-sans text-text-secondary">
              Enter a room code and start playing
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-gold-antique transition-transform duration-300 group-hover:translate-x-1 shrink-0" />
      </Link>
    </div>
  );
}
