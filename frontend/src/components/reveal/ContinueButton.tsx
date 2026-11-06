"use client";

import React, { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

interface ContinueButtonProps {
  onContinue: () => void;
  disabled?: boolean;
}

export function ContinueButton({
  onContinue,
  disabled = false,
}: ContinueButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (disabled || loading) return;
    setLoading(true);
    onContinue();
  };

  return (
    <div className="w-full flex items-center justify-center pt-4 pb-2 z-20">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className="w-full sm:w-64 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-gold-light via-[#F3DEAA] to-gold-antique hover:from-gold-antique hover:to-gold-light text-[#09060D] font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 shadow-[0_0_25px_rgba(242,216,154,0.35)] hover:shadow-[0_0_35px_rgba(212,175,55,0.45)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-[#09060D]" />
            <span>Entering Chamber...</span>
          </>
        ) : (
          <>
            <span>Continue</span>
            <ArrowRight className="w-4 h-4 text-[#09060D] stroke-[2.5]" />
          </>
        )}
      </button>
    </div>
  );
}
