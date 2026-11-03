import React from "react";

interface RoleAvatarProps {
  faction: "Faithful" | "Traitor";
  className?: string;
}

export function RoleAvatar({ faction, className = "w-10 h-10" }: RoleAvatarProps) {
  const isFaithful = faction === "Faithful";
  const glowColor = isFaithful ? "rgba(59, 130, 246, 0.35)" : "rgba(225, 29, 72, 0.4)";
  const eyeColor = isFaithful ? "#60A5FA" : "#F43F5E";
  const borderTone = isFaithful ? "border-blue-500/30" : "border-rose-500/30";

  return (
    <div
      className={`relative rounded-xl bg-[#170C1B] border ${borderTone} flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{ boxShadow: `0 0 12px ${glowColor}` }}
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-8 h-8"
      >
        {/* Hood Contour */}
        <path
          d="M18 4C12 4 9 9 8 16C7 23 6 29 5 32H31C30 29 29 23 28 16C27 9 24 4 18 4Z"
          fill="#1C0E22"
          stroke="#381845"
          strokeWidth="1.2"
        />
        {/* Shadowed Mask/Face Opening */}
        <path
          d="M18 9C14.5 9 12.5 13 12 18C11.5 23 13 28 18 28C23 28 24.5 23 24 18C23.5 13 21.5 9 18 9Z"
          fill="#09060D"
        />
        {/* Glowing Eyes */}
        <circle cx="15.5" cy="18" r="1.3" fill={eyeColor} />
        <circle cx="20.5" cy="18" r="1.3" fill={eyeColor} />
      </svg>
    </div>
  );
}
