"use client";

import React, { useState } from "react";
import { Users, Copy, Check, Lock, Globe, Pencil } from "lucide-react";
import { PlayerCapacity } from "@/services/rooms";

interface RoomInfoBarProps {
  roomName: string;
  roomCode: string;
  playerCount: number;
  maxCapacity: PlayerCapacity;
  isPrivate: boolean;
  isHost: boolean;
  onUpdateRoomName: (newName: string) => void;
}

export function RoomInfoBar({
  roomName,
  roomCode,
  playerCount,
  maxCapacity,
  isPrivate,
  isHost,
  onUpdateRoomName,
}: RoomInfoBarProps) {
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(roomName);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedName.trim().length >= 3) {
      onUpdateRoomName(editedName.trim());
      setIsEditingName(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-gold-antique/25 bg-[#120A14]/85 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-5 shadow-[0_4px_30px_rgba(20,9,28,0.4)]">
      {/* 1. Left: Room Icon, Room Name (Editable) & Room Code */}
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="w-12 h-12 rounded-xl bg-[#1A0E1C] border border-gold-antique/30 flex items-center justify-center shrink-0 shadow-inner">
          <Users className="w-6 h-6 text-gold-antique" />
        </div>

        <div className="flex flex-col text-left">
          {/* Room Name with Host Edit Trigger */}
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="bg-[#1A0E1C] border border-gold-antique/50 text-[#F5EEDC] text-sm font-semibold rounded-lg px-2.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-gold-antique"
                  autoFocus
                />
                <button
                  type="submit"
                  className="text-xs bg-gold-antique text-background px-2 py-0.5 rounded font-medium hover:bg-gold-light"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditedName(roomName);
                    setIsEditingName(false);
                  }}
                  className="text-xs text-text-secondary hover:text-text-main"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <h2 className="font-cormorant text-xl sm:text-2xl font-bold text-[#F5EEDC] tracking-wide">
                  {roomName}
                </h2>
                {isHost && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-text-secondary hover:text-gold-light transition"
                    title="Edit room name (Host only)"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Room Code Badge & Copy Button */}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-sans text-text-secondary">Room Code:</span>
            <div className="flex items-center gap-1.5 bg-[#1A0E1C] border border-gold-antique/30 px-2.5 py-0.5 rounded-lg">
              <span className="font-mono text-xs sm:text-sm font-bold text-gold-light tracking-wider select-all">
                {roomCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-0.5 text-gold-antique/80 hover:text-gold-light transition relative"
                title="Copy Room Code"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-background border border-gold-antique/40 text-gold-light text-[10px] px-1.5 py-0.5 rounded shadow">
                    Copied!
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle: Player Capacity Indicator */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-start md:justify-center border-t md:border-t-0 md:border-l border-gold-antique/15 pt-3 md:pt-0 md:pl-8">
        <div className="w-9 h-9 rounded-lg bg-[#1A0E1C] border border-gold-antique/20 flex items-center justify-center shrink-0">
          <Users className="w-4 h-4 text-gold-antique" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-sm sm:text-base font-semibold text-[#F5EEDC]">
            {playerCount} / {maxCapacity} Players
          </span>
          <span className="text-[11px] text-text-secondary">
            {playerCount === maxCapacity ? "Chamber is full" : `${maxCapacity - playerCount} slot${maxCapacity - playerCount > 1 ? "s" : ""} remaining`}
          </span>
        </div>
      </div>

      {/* 3. Right: Privacy Tag */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-start md:justify-end border-t md:border-t-0 md:border-l border-gold-antique/15 pt-3 md:pt-0 md:pl-8">
        <div className="w-9 h-9 rounded-lg bg-[#1A0E1C] border border-gold-antique/20 flex items-center justify-center shrink-0">
          {isPrivate ? (
            <Lock className="w-4 h-4 text-gold-antique" />
          ) : (
            <Globe className="w-4 h-4 text-gold-antique" />
          )}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-sm sm:text-base font-semibold text-[#F5EEDC]">
            {isPrivate ? "Private Room" : "Public Room"}
          </span>
          <span className="text-[11px] text-text-secondary">
            {isPrivate ? "Invite code required" : "Open to any player"}
          </span>
        </div>
      </div>
    </div>
  );
}
