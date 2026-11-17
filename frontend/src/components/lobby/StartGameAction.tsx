"use client";

import React, { useState } from "react";
import { Play, Loader2, AlertCircle } from "lucide-react";

interface StartGameActionProps {
  isHost: boolean;
  onValidate: () => { canStart: boolean; reasons: string[] };
  onStartGame: () => void;
}

export function StartGameAction({
  isHost,
  onValidate,
  onStartGame,
}: StartGameActionProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [validationModal, setValidationModal] = useState<{
    show: boolean;
    reasons: string[];
  }>({ show: false, reasons: [] });

  const handleClick = () => {
    if (!isHost) return;

    const validation = onValidate();
    if (!validation.canStart) {
      setValidationModal({
        show: true,
        reasons: validation.reasons,
      });
      return;
    }

    setIsStarting(true);
    setTimeout(() => {
      onStartGame();
    }, 1200);
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full sm:w-64">
      {/* Validation Reasons Tooltip/Modal */}
      {validationModal.show && (
        <div className="absolute bottom-full mb-3 right-0 w-72 rounded-2xl bg-[#1A0E1C] border border-gold-antique/50 p-4 shadow-[0_10px_35px_rgba(0,0,0,0.8)] z-50 text-left animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 mb-2 text-rose-400 font-semibold text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Chamber Requirements Unmet</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-text-secondary">
            {validationModal.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-gold-antique font-bold">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setValidationModal({ show: false, reasons: [] })}
            className="mt-2 w-full text-center text-[10px] text-text-secondary/60 hover:text-text-main"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Action Button */}
      <button
        onClick={handleClick}
        disabled={isStarting}
        className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 shadow-[0_0_25px_rgba(242,216,154,0.35)] ${
          isHost
            ? "bg-gradient-to-r from-gold-light via-[#F3DEAA] to-gold-antique hover:from-gold-antique hover:to-gold-light text-[#09060D] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            : "bg-[#1A0E1C] border border-gold-antique/30 text-text-secondary cursor-not-allowed opacity-80"
        }`}
      >
        {isStarting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-[#09060D]" />
            <span>Starting Game...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current stroke-[2]" />
            <span>{isHost ? "Start Game" : "Waiting for Host..."}</span>
          </>
        )}
      </button>

      {/* Host Caption */}
      <span className="text-[11px] font-sans text-text-secondary/70 mt-1.5 tracking-wide">
        {isHost ? "(Host Only)" : "(Only Host can launch)"}
      </span>
    </div>
  );
}
