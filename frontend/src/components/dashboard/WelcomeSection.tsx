import React from "react";
interface WelcomeSectionProps { playerName: string; }
export function WelcomeSection({ playerName }: WelcomeSectionProps) {
 return <section className="w-full rounded-2xl border border-white/10 bg-[#19151d] px-6 py-8 sm:px-9 sm:py-10"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#c4a6d2]">Your game space</p><h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{playerName ? `Welcome back, ${playerName}` : "Welcome back"}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#b9b0bd]">Create a room for your group or join a game with an invitation code.</p></section>;
}
