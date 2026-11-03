import React from "react";

export function CrownIcon({ className = "w-5 h-5 text-gold-antique" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2.5 19h19c.28 0 .5-.22.5-.5v-1.5c0-.28-.22-.5-.5-.5h-19c-.28 0-.5.22-.5.5V18.5c0 .28.22.5.5.5zm1.5-4h16c.28 0 .48-.25.43-.53l-1.93-9.65a.5.5 0 0 0-.85-.24l-3.9 3.9-2.9-6.76a.5.5 0 0 0-.9 0l-2.9 6.76-3.9-3.9a.5.5 0 0 0-.85.24L3.57 14.47c-.05.28.15.53.43.53z" />
    </svg>
  );
}
