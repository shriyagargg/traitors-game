"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sun, Sparkles, MessageCircle, HelpCircle } from "lucide-react";

interface DiscussionArchitectPanelProps {
  roundNumber: number;
  phaseName: string;
  phaseType: string;
  onConsult?: (query: string) => Promise<{ success: boolean; answer?: string; message?: string }>;
}

export function DiscussionArchitectPanel({
  roundNumber,
  phaseName,
  phaseType,
  onConsult,
}: DiscussionArchitectPanelProps) {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  const prompts = [
    "The Architect, who is deflecting?",
    "The Architect, analyze the night murder.",
    "The Architect, advise the Faithful.",
  ];

  const handlePrompt = async (prompt: string) => {
    if (!onConsult || loading) return;
    setLoading(true);
    setError("");
    try {
      const result = await onConsult(prompt);
      if (result.success && result.answer) {
        setAnswer(result.answer);
        setQuestion("");
      } else setError(result.message || "The Architect could not answer. Please try again.");
    } catch {
      setError("The Architect could not answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (question.trim()) void handlePrompt(question.trim());
  };

  return (
    <div className="w-full h-full rounded-3xl border border-white/10 bg-[#120A14]/90 backdrop-blur-xl p-5 sm:p-6 flex flex-col items-center justify-between text-center shadow-[0_4px_30px_rgba(20,9,28,0.5)] transition-all">
      {/* 1. Hooded Circular Architect Illustration */}
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 flex items-center justify-center">
          {/* Soft Violet/Gold Halo */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-muted/30 to-gold-antique/25 blur-md pointer-events-none" />

          <div className="relative w-full h-full rounded-full overflow-hidden border border-gold-antique/50 shadow-[0_0_25px_rgba(139,74,168,0.35)]">
            <Image
              src="/images/architect_gameplay.png"
              alt="The Architect"
              fill
              unoptimized
              className="object-cover scale-105"
            />
          </div>
        </div>

        {/* 2. Identity Heading & Subtitle */}
        <div className="mt-3 mb-3">
          <h2 className="font-cinzel text-lg sm:text-xl font-bold tracking-[0.18em] text-[#F5EEDC]">
            THE ARCHITECT
          </h2>
          <span className="font-cinzel text-[10px] tracking-[0.28em] text-gold-antique font-semibold block mt-0.5">
            — AI GAME MASTER —
          </span>
        </div>

        {/* 3. Phase Badge */}
        <div className="px-3.5 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 flex items-center gap-1.5 text-xs text-[#C084FC]">
          <Sun className="w-3.5 h-3.5 text-amber-400 stroke-[2.2]" />
          <span className="font-semibold">{phaseName} • Round {roundNumber}</span>
        </div>
      </div>

      {/* 4. Interactive Architect Chatbot Consultations */}
      <div className="w-full my-3 p-3 rounded-2xl bg-[#1A0E1C]/80 border border-purple-500/20 text-left">
        <div className="flex items-center gap-1.5 mb-2 text-xs font-cinzel font-semibold text-gold-light">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Consult AI Architect</span>
        </div>
        <p className="text-[11px] font-sans text-text-secondary/70 mb-2.5">
          Ask for tactical guidance or behavioral contradiction analysis:
        </p>
        <form onSubmit={handleSubmit} className="mb-2 flex gap-1.5">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={1000}
            placeholder="Ask the Architect..."
            disabled={loading}
            aria-label="Ask the Architect a question"
            className="min-w-0 flex-1 rounded-lg border border-purple-500/30 bg-[#120A14] px-2 py-1.5 text-[11px] text-[#F5EEDC] placeholder:text-text-secondary/50 focus:border-purple-300 focus:outline-none disabled:opacity-50"
          />
          <button type="submit" disabled={loading || !question.trim()} className="rounded-lg border border-purple-400/30 bg-purple-900/40 px-2.5 text-[10px] font-semibold text-purple-100 disabled:opacity-40">
            {loading ? "Thinking…" : "Ask"}
          </button>
        </form>
        <div className="space-y-1.5">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={loading}
              onClick={() => void handlePrompt(prompt)}
              className="w-full text-left px-2.5 py-1.5 rounded-xl bg-purple-900/20 hover:bg-purple-900/40 border border-purple-500/30 text-[11px] font-sans text-purple-200 transition flex items-center justify-between group active:scale-[0.98]"
            >
              <span className="truncate">{prompt}</span>
              <MessageCircle className="w-3 h-3 text-purple-400 shrink-0 opacity-60 group-hover:opacity-100" />
            </button>
          ))}
        </div>
        {answer && <div role="status" className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-gold-antique/20 bg-[#120A14] p-2 text-[11px] leading-relaxed text-[#F5EEDC]">{answer}</div>}
        {error && <p role="alert" className="mt-2 text-[10px] leading-relaxed text-red-300">{error}</p>}
      </div>

      {/* 5. Footer Security Note */}
      <div className="text-[10px] font-mono text-text-secondary/50 flex items-center gap-1">
        <HelpCircle className="w-3 h-3 text-gold-antique/50" />
        <span>Autonomous Truth &amp; Deception Arbiter</span>
      </div>
    </div>
  );
}
