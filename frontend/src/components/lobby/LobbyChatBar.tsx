"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send } from "lucide-react";
import { LobbyChatMessage } from "@/types/lobby";

interface LobbyChatBarProps {
  messages: LobbyChatMessage[];
  onSendMessage: (text: string) => void;
}

export function LobbyChatBar({ messages, onSendMessage }: LobbyChatBarProps) {
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
    <div className="w-full rounded-2xl border border-gold-antique/25 bg-[#120A14]/85 backdrop-blur-md p-3.5 sm:p-4 flex flex-col md:flex-row items-center gap-4 shadow-[0_4px_30px_rgba(20,9,28,0.4)]">
      {/* 1. Left: Lobby Chat Pill Badge */}
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1A0E1C] border border-gold-antique/30 text-gold-light shrink-0 self-start md:self-center">
        <MessageSquare className="w-4 h-4 text-gold-antique" />
        <span className="text-xs font-semibold whitespace-nowrap">Lobby Chat</span>
      </div>

      {/* 2. Middle: Message Feed Stream */}
      <div className="flex-1 w-full max-h-20 sm:max-h-24 overflow-y-auto pr-2 space-y-1.5 scrollbar-thin scrollbar-thumb-gold-antique/20 border-l border-gold-antique/15 pl-3.5">
        {messages.slice(-5).map((msg) => (
          <div key={msg.id} className="text-xs leading-relaxed flex items-baseline gap-2">
            <span className="font-semibold text-gold-light/95 shrink-0">
              {msg.senderName}:
            </span>
            <span className={`text-text-secondary ${msg.isSystem ? "italic text-text-secondary/70" : ""}`}>
              {msg.text}
            </span>
            <span className="text-[10px] text-text-secondary/40 shrink-0 ml-auto">
              · {msg.timestamp}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Right: Input Form & Send Button */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 w-full md:w-80 shrink-0"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            maxLength={120}
            className="w-full bg-[#1A0E1C] border border-gold-antique/30 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#F5EEDC] placeholder-text-secondary/40 focus:outline-none focus:border-gold-antique focus:ring-1 focus:ring-gold-antique/50 transition"
          />
        </div>
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="p-2.5 rounded-xl bg-gradient-to-r from-gold-light to-gold-antique text-background hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          title="Send message"
        >
          <Send className="w-4 h-4 stroke-[2.5]" />
        </button>
      </form>
    </div>
  );
}
