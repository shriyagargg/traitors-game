"use client";

import React, { useState } from "react";

export function SocialAuth() {
  const [notification, setNotification] = useState<string | null>(null);

  const handleSocialClick = (provider: string) => {
    setNotification(`${provider} OAuth is currently in sandbox preview mode.`);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="w-full flex flex-col gap-3 mt-6">
      {/* Subtle Divider: or continue with */}
      <div className="relative flex items-center justify-center my-1">
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gold-antique/20 to-transparent" />
        <span className="absolute bg-[#120A14] px-3 font-sans text-xs text-text-secondary/80 tracking-wider">
          or continue with
        </span>
      </div>

      {notification && (
        <div className="text-center text-xs font-sans text-gold-light bg-gold-antique/10 border border-gold-antique/20 rounded-lg py-1.5 px-3 animate-fade-in">
          {notification}
        </div>
      )}

      {/* Social Buttons Container */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Google Button */}
        <button
          type="button"
          onClick={() => handleSocialClick("Google")}
          className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-[#170C1B]/90 hover:bg-[#1f1025] border border-gold-antique/25 hover:border-gold-antique/60 text-text-main text-sm font-medium transition duration-200 shadow-sm active:scale-[0.98]"
        >
          {/* Google 4-Color SVG Icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.16z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span className="font-sans">Google</span>
        </button>

        {/* GitHub Button */}
        <button
          type="button"
          onClick={() => handleSocialClick("GitHub")}
          className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-[#170C1B]/90 hover:bg-[#1f1025] border border-gold-antique/25 hover:border-gold-antique/60 text-text-main text-sm font-medium transition duration-200 shadow-sm active:scale-[0.98]"
        >
          {/* GitHub SVG Icon */}
          <svg className="w-4 h-4 fill-current text-text-main" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          <span className="font-sans">GitHub</span>
        </button>
      </div>
    </div>
  );
}
