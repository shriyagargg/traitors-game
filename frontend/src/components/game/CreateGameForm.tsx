"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Gamepad2,
  Users,
  Moon,
  MessageSquare,
  Scale,
  Globe,
  Lock,
  ArrowRight,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { CrownIcon } from "../CrownIcon";
import {
  PlayerCapacity,
  RoomConfig,
  createRoom,
  RoomOperationResult,
} from "@/services/rooms";
import { getPlayerSession } from "@/services/playerSession";

interface CreateGameFormProps {
  capacity: PlayerCapacity;
  onCapacityChange: (cap: PlayerCapacity) => void;
  onRoomCreated?: (result: RoomOperationResult) => void;
}

export function CreateGameForm({
  capacity: propCapacity,
  onCapacityChange,
  onRoomCreated,
}: CreateGameFormProps) {
  const router = useRouter();

  // Form State
  const [selectedCapacity, setSelectedCapacity] = useState<PlayerCapacity>(propCapacity || 7);
  const [roomName, setRoomName] = useState("Council Chamber");
  const [nightDuration, setNightDuration] = useState(30);
  const [discussionDuration, setDiscussionDuration] = useState(120);
  const [votingDuration, setVotingDuration] = useState(60);
  const [isPrivate, setIsPrivate] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<RoomOperationResult | null>(null);

  // Sync prop changes if parent updates
  useEffect(() => {
    if (propCapacity) {
      setSelectedCapacity(propCapacity);
    }
  }, [propCapacity]);

  const handleCapacitySelect = (cap: PlayerCapacity) => {
    setSelectedCapacity(cap);
    onCapacityChange?.(cap);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResult(null);

    const session = getPlayerSession();
    if (!session.accountToken) {
      router.push(`/auth/register?returnTo=${encodeURIComponent("/lobby/create")}`);
      return;
    }

    if (!roomName.trim()) {
      setErrorMessage("Please enter a room name.");
      return;
    }

    const effectiveCapacity = selectedCapacity || propCapacity || 7;

    setLoading(true);
    try {
      const config: RoomConfig = {
        roomName: roomName.trim(),
        playerCapacity: effectiveCapacity,
        nightDuration,
        discussionDuration,
        votingDuration,
        isPrivate,
      };

      const res = await createRoom(config);
      setResult(res);
      if (res.success) {
        if (onRoomCreated) {
          onRoomCreated(res);
        }
        setTimeout(() => {
          router.push(
            `/lobby?code=${res.roomCode}&name=${encodeURIComponent(
              config.roomName
            )}&capacity=${config.playerCapacity}&private=${config.isPrivate}`
          );
        }, 0);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Unable to configure room. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full rounded-2xl bg-[#19151d] border border-white/10 p-5 sm:p-6">
      {/* 1. Header */}
      <div className="flex items-center gap-3.5 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#302637] border border-white/5 flex items-center justify-center shrink-0">
          <Gamepad2 className="w-5 h-5 text-[#c4a6d2]" />
        </div>
        <div className="text-left">
          <h2 className="text-xl font-semibold text-white tracking-tight">
            Create a New Game
          </h2>
          <p className="text-sm text-[#b9b0bd]">
            Set up your room, invite players and let The Architect run the game.
          </p>
        </div>
      </div>

      {/* 2. Notifications & Status Banners */}
      {errorMessage && (
        <div className="mb-4 rounded-lg border border-rose-300/20 bg-rose-950/20 px-4 py-2.5 text-xs font-sans text-rose-200">
          {errorMessage}
        </div>
      )}
      {result && result.success && (
        <div className="mb-4 rounded-lg border border-emerald-300/20 bg-emerald-950/20 px-4 py-3 text-xs font-sans text-emerald-200 flex flex-col gap-1">
          <p className="font-semibold text-emerald-300">
            ✓ Chamber Activated: Code [{result.roomCode}]
          </p>
          <p className="text-emerald-200/80">{result.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Field 0: Your Name (Host) */}
        {/* Field A: Room Name */}
        <div className="text-left">
          <label className="block text-xs font-sans text-text-secondary mb-1.5 font-medium">
            Room Name
          </label>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#100d13] border border-white/10 focus-within:border-[#a78ab2] transition-all">
            <CrownIcon className="w-4 h-4 text-[#c4a6d2] shrink-0" />
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={40}
              required
              className="w-full bg-transparent text-sm font-sans text-text-main placeholder:text-text-secondary/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Field B: Player Capacity (6, 7, 8 Players) */}
        <div className="text-left">
          <label className="block text-xs font-sans text-text-secondary mb-1.5 font-medium">
            Player Capacity
          </label>
          <div className="grid grid-cols-3 gap-3">
            {([6, 7, 8] as PlayerCapacity[]).map((cap) => {
              const isSelected = selectedCapacity === cap;

              return (
                <button
                  key={cap}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCapacitySelect(cap);
                  }}
                  className={`py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 border cursor-pointer ${
                    isSelected
                      ? "bg-[#392c40] border-[#9b7ba6] text-white font-semibold ring-1 ring-[#9b7ba6]"
                      : "bg-[#100d13] border-white/10 hover:border-white/25 text-[#b9b0bd] hover:text-white"
                  }`}
                >
                  <Users
                    className={`w-4 h-4 ${
                      isSelected ? "text-[#c4a6d2]" : "text-text-secondary"
                    }`}
                  />
                  <span className="text-xs font-sans">{cap} Players</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Field C: Game Timings Dropdowns */}
        <div className="text-left">
          <label className="block text-xs font-sans text-text-secondary mb-1.5 font-medium">
            Game Timings (per round)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Night Phase */}
            <div className="relative rounded-xl bg-[#100d13] border border-white/10 px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-[#c4a6d2]/80" />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-text-secondary/70">Night Phase</span>
                  <select
                    value={nightDuration}
                    onChange={(e) => setNightDuration(Number(e.target.value))}
                    aria-label="Night Phase duration"
                    className="bg-transparent text-xs font-sans text-text-main focus:outline-none cursor-pointer pr-4"
                  >
                    <option value={30} className="bg-bg-secondary text-text-main">30 sec</option>
                    <option value={45} className="bg-bg-secondary text-text-main">45 sec</option>
                    <option value={60} className="bg-bg-secondary text-text-main">60 sec</option>
                    <option value={90} className="bg-bg-secondary text-text-main">90 sec</option>
                  </select>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-text-secondary pointer-events-none" />
            </div>

            {/* 2. Discussion */}
            <div className="relative rounded-xl bg-[#100d13] border border-white/10 px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#c4a6d2]/80" />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-text-secondary/70">Discussion</span>
                  <select
                    value={discussionDuration}
                    onChange={(e) => setDiscussionDuration(Number(e.target.value))}
                    aria-label="Discussion duration"
                    className="bg-transparent text-xs font-sans text-text-main focus:outline-none cursor-pointer pr-4"
                  >
                    <option value={60} className="bg-bg-secondary text-text-main">60 sec</option>
                    <option value={120} className="bg-bg-secondary text-text-main">120 sec</option>
                    <option value={180} className="bg-bg-secondary text-text-main">180 sec</option>
                    <option value={240} className="bg-bg-secondary text-text-main">240 sec</option>
                  </select>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-text-secondary pointer-events-none" />
            </div>

            {/* 3. Voting */}
            <div className="relative rounded-xl bg-[#100d13] border border-white/10 px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#c4a6d2]/80" />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-text-secondary/70">Voting</span>
                  <select
                    value={votingDuration}
                    onChange={(e) => setVotingDuration(Number(e.target.value))}
                    aria-label="Voting duration"
                    className="bg-transparent text-xs font-sans text-text-main focus:outline-none cursor-pointer pr-4"
                  >
                    <option value={30} className="bg-bg-secondary text-text-main">30 sec</option>
                    <option value={60} className="bg-bg-secondary text-text-main">60 sec</option>
                    <option value={90} className="bg-bg-secondary text-text-main">90 sec</option>
                    <option value={120} className="bg-bg-secondary text-text-main">120 sec</option>
                  </select>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-text-secondary pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Field D: Room Privacy */}
        <div className="text-left">
          <label className="block text-xs font-sans text-text-secondary mb-1.5 font-medium">
            Room Privacy
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Public Option */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setIsPrivate(false);
              }}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition text-left ${
                !isPrivate
                  ? "bg-[#281023] border-gold-antique text-text-main shadow-sm"
                  : "bg-[#170C1B]/60 border-gold-antique/20 text-text-secondary hover:border-gold-antique/40"
              }`}
            >
              <div className="mt-0.5">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    !isPrivate ? "border-gold-antique" : "border-text-secondary/50"
                  }`}
                >
                  {!isPrivate && <div className="w-2 h-2 rounded-full bg-gold-antique" />}
                </div>
              </div>
              <Globe className="w-4 h-4 text-[#c4a6d2] shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text-main">Public Room</span>
                <span className="text-[11px] text-text-secondary">
                  Anyone with the room code can join
                </span>
              </div>
            </button>

            {/* Private Option */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setIsPrivate(true);
              }}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition text-left ${
                isPrivate
                  ? "bg-[#281023] border-gold-antique text-text-main shadow-sm"
                  : "bg-[#170C1B]/60 border-gold-antique/20 text-text-secondary hover:border-gold-antique/40"
              }`}
            >
              <div className="mt-0.5">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isPrivate ? "border-gold-antique" : "border-text-secondary/50"
                  }`}
                >
                  {isPrivate && <div className="w-2 h-2 rounded-full bg-gold-antique" />}
                </div>
              </div>
              <Lock className="w-4 h-4 text-[#c4a6d2] shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text-main">Private Room</span>
                <span className="text-[11px] text-text-secondary">Invite only</span>
              </div>
            </button>
          </div>
        </div>

        {/* Action Button: Create Room → */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 py-3.5 px-6 rounded-xl bg-[#e1cbd4] hover:bg-white text-[#211c25] font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 shadow-none active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-background" />
              <span>Creating room…</span>
            </>
          ) : (
            <>
              <Gamepad2 className="w-5 h-5 text-background stroke-[2]" />
              <span>Create Room</span>
              <ArrowRight className="w-4 h-4 text-background" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
