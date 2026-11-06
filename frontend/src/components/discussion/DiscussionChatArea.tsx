"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  MessageSquare,
  Clock,
  Mic,
  MicOff,
  Send,
  Sparkles,
} from "lucide-react";
import { DiscussionMessage, ArchitectAnnouncement } from "@/types/discussion";

interface DiscussionChatAreaProps {
  roundNumber: number;
  phaseType: string;
  formattedTimer: string;
  announcement: ArchitectAnnouncement;
  messages: DiscussionMessage[];
  onSendMessage: (text: string) => void;
}

export function DiscussionChatArea({
  roundNumber,
  phaseType,
  formattedTimer,
  announcement,
  messages,
  onSendMessage,
}: DiscussionChatAreaProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <div className="w-full h-full rounded-3xl border border-white/10 bg-[#120A14]/90 backdrop-blur-xl p-5 sm:p-6 flex flex-col justify-between shadow-[0_4px_30px_rgba(20,9,28,0.5)]">
      {/* 1. Header & Live Countdown Timer */}
      <div className="flex items-center justify-between pb-3 border-b border-gold-antique/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1A0E1C] border border-gold-antique/30 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-gold-antique" />
          </div>
          <div>
            <h1 className="font-cormorant text-2xl sm:text-3xl font-bold tracking-wide text-[#F5EEDC]">
              Discussion Phase
            </h1>
            <p className="text-xs sm:text-sm font-sans text-text-secondary/80">
              Round {roundNumber} — {phaseType}
            </p>
          </div>
        </div>

        {/* Countdown Timer Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#1A0E1C] border border-gold-antique/40 shadow-inner">
          <Clock className="w-5 h-5 text-gold-antique animate-pulse" />
          <span className="font-mono text-xl sm:text-2xl font-bold text-gold-light tracking-wider">
            {formattedTimer}
          </span>
        </div>
      </div>

      {/* 2. Architect Announcement (Exactly One Single Banner) */}
      <div className="my-3.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#2B1038] via-[#210D2C] to-[#16091F] border border-[#8B4AA8]/40 shadow-sm flex items-start gap-3 text-left">
        <div className="w-8 h-8 rounded-xl bg-purple-900/40 border border-purple-400/40 flex items-center justify-center shrink-0 mt-0.5 text-purple-300">
          <Sparkles className="w-4 h-4 fill-current text-purple-300" />
        </div>
        <div>
          <h3 className="font-cinzel text-xs sm:text-sm font-bold tracking-wider text-[#C084FC]">
            {announcement.title}
          </h3>
          <p className="text-xs sm:text-sm font-sans text-text-secondary leading-relaxed mt-0.5">
            {announcement.message}
          </p>
        </div>
      </div>

      {/* 3. Discussion Message Feed */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 my-2 max-h-[360px] scrollbar-thin scrollbar-thumb-gold-antique/15">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-3 text-left group">
            {/* Circular Avatar */}
            <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-white/10 mt-0.5">
              <Image
                src={msg.avatarUrl}
                alt={msg.senderName}
                fill
                unoptimized
                className="object-cover"
              />
            </div>

            {/* Message Body */}
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xs sm:text-sm font-semibold text-[#F5EEDC]">
                  {msg.senderName}
                </span>
                <span className="text-[10px] text-text-secondary/40 font-mono">
                  {msg.timestamp}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-sans text-text-secondary leading-relaxed mt-0.5">
                {msg.text}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Message Composer */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 pt-3 border-t border-gold-antique/10 mt-2"
      >
        {/* Disabled Mic Indicator per instructions */}
        <button
          type="button"
          disabled
          className="w-10 h-10 rounded-xl bg-[#1A0E1C] border border-white/10 text-text-secondary/40 flex items-center justify-center shrink-0 cursor-not-allowed"
          title="Voice transmission in standby (Phase 4)"
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            maxLength={180}
            className="w-full bg-[#1A0E1C] border border-gold-antique/30 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#F5EEDC] placeholder-text-secondary/40 focus:outline-none focus:border-gold-antique focus:ring-1 focus:ring-gold-antique/40 transition"
          />
        </div>

        {/* Gold Send Button */}
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="p-2.5 sm:px-4 rounded-xl bg-gradient-to-r from-gold-light via-[#F3DEAA] to-gold-antique hover:from-gold-antique hover:to-gold-light text-[#09060D] font-bold transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
          title="Send message"
        >
          <Send className="w-4 h-4 stroke-[2.5]" />
        </button>
      </form>
    </div>
  );
}
