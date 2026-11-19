"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send } from "lucide-react";
import { LobbyChatMessage } from "@/types/lobby";

interface LobbyChatBarProps {
  messages: LobbyChatMessage[];
  onSendMessage: (text: string) => Promise<{ success: boolean; message?: string }>;
}

export function LobbyChatBar({ messages, onSendMessage }: LobbyChatBarProps) {
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || sending) return;
    setSending(true);
    setSendStatus("Sending…");
    try {
      const result = await onSendMessage(inputValue.trim());
      if (result?.success) { setInputValue(""); setSendStatus("Sent"); }
      else setSendStatus(result?.message || "Message failed. Please retry.");
    } catch { setSendStatus("Message failed. Please retry."); }
    finally { setSending(false); window.setTimeout(() => setSendStatus(""), 3500); }
  };

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#19151d] p-3.5 sm:p-4 flex flex-col md:flex-row items-center gap-3.5 shadow-[0_4px_30px_rgba(20,9,28,0.4)]">
      {/* 1. Left: Lobby Chat Pill Badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#261d2c] border border-white/10 text-gold-light shrink-0 self-start md:self-center">
        <MessageSquare className="w-4 h-4 text-[#c4a6d2]" />
        <span className="text-xs font-semibold whitespace-nowrap">Chamber Chat</span>
      </div>

      {/* 2. Middle: Message Feed Stream */}
      <div className="flex-1 w-full max-h-20 sm:max-h-24 overflow-y-auto pr-2 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10 border-l border-white/10 pl-3.5">
        {messages.length === 0 ? (
          <span className="text-xs text-[#b9b0bd]/40 italic">
            No messages yet. Send a message to the chamber...
          </span>
        ) : (
          messages.slice(-6).map((msg) => (
            <div key={msg.id} className="text-xs leading-relaxed flex items-baseline gap-2">
              <span className="font-semibold text-white shrink-0">
                {msg.senderName}:
              </span>
              <span className={`text-[#b9b0bd] break-words ${msg.isSystem ? "italic text-[#b9b0bd]/60" : ""}`}>
                {msg.text}
              </span>
              <span className="text-[10px] text-[#b9b0bd]/30 shrink-0 ml-auto font-mono">
                · {msg.timestamp}
              </span>
            </div>
          ))
        )}
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
            className="w-full bg-[#120d15] border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-[#b9b0bd]/40 focus:outline-none focus:border-[#b99ca5] focus:ring-1 focus:ring-[#b99ca5]/40 transition"
          />
        </div>
        <button
          type="submit"
          disabled={!inputValue.trim() || sending}
          className="p-2.5 rounded-xl bg-gradient-to-r from-gold-light via-[#F3DEAA] to-gold-antique text-[#09060D] hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
          title="Send message"
        >
          <Send className="w-4 h-4 stroke-[2.5]" />
        </button>
      </form>
      {sendStatus && <p role="status" aria-live="polite" className={`w-full text-right text-[10px] ${sendStatus === "Sent" ? "text-emerald-300" : sendStatus.startsWith("Sending") ? "text-[#b9b0bd]" : "text-red-300"}`}>{sendStatus}</p>}
    </div>
  );
}
