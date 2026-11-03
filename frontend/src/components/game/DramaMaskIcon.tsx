import React from "react";

export function DramaMaskIcon({ className = "w-6 h-6 text-rose-400" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Mask Contour */}
      <path d="M2 10.5C2 16.5 6.5 21 12 21C17.5 21 22 16.5 22 10.5C22 5.5 17.5 3 12 3C6.5 3 2 5.5 2 10.5Z" />
      {/* Slanted Eyes */}
      <ellipse cx="8.5" cy="10" rx="2" ry="1.2" transform="rotate(-15 8.5 10)" fill="currentColor" />
      <ellipse cx="15.5" cy="10" rx="2" ry="1.2" transform="rotate(15 15.5 10)" fill="currentColor" />
      {/* Sinister Grin */}
      <path d="M8 15.5C9.5 17 14.5 17 16 15.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
