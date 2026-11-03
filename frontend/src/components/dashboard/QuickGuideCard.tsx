import React from "react";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";

export function QuickGuideCard() {
  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-gold-antique" />
          <h3 className="font-cormorant text-xl sm:text-2xl font-normal text-text-main tracking-wide">
            Quick Guide
          </h3>
        </div>
        <p className="text-xs sm:text-sm font-sans text-text-secondary leading-relaxed mb-6">
          New to the game? Learn the rules, roles and strategies to survive the council.
        </p>
      </div>

      <Link
        href="/#how-to-play"
        className="w-full py-2.5 px-4 rounded-xl border border-gold-antique/60 hover:border-gold-antique bg-gold-antique/10 hover:bg-gold-antique/20 text-gold-light hover:text-white text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition duration-200 shadow-[0_0_12px_rgba(212,175,55,0.1)] hover:shadow-[0_0_18px_rgba(212,175,55,0.25)]"
      >
        <span>How to Play</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
