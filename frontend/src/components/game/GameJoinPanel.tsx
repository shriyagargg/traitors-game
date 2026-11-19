"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Key, ArrowRight, Loader2 } from "lucide-react";
import { joinRoom, RoomOperationResult } from "@/services/rooms";
import { getPlayerSession } from "@/services/playerSession";

interface JoinGamePanelProps {
  onSwitchToCreate: () => void;
  onRoomJoined?: (result: RoomOperationResult) => void;
}

export function JoinGamePanel({ onSwitchToCreate, onRoomJoined }: JoinGamePanelProps) {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<RoomOperationResult | null>(null);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Force uppercase and strip spaces
    const val = e.target.value.toUpperCase().replace(/\s+/g, "");
    setRoomCode(val);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResult(null);

    const session = getPlayerSession();
    if (!session.accountToken) {
      router.push(`/auth/register?returnTo=${encodeURIComponent(`/lobby/join?code=${roomCode}`)}`);
      return;
    }

    if (!roomCode.trim()) {
      setErrorMessage("Please provide a valid room code.");
      return;
    }

    setLoading(true);
    try {
      const res = await joinRoom(roomCode);
      setResult(res);
      if (res.success) {
        if (onRoomJoined) {
          onRoomJoined(res);
        }
        setTimeout(() => {
          router.push(`/lobby?code=${res.roomCode || roomCode}`);
        }, 0);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Unable to connect to room. Please check your code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto rounded-2xl bg-[#19151d] border border-white/10 p-6 sm:p-7 z-10 relative">
      {/* Header */}
      <div className="flex flex-col items-center justify-center text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#1A0E1C] border border-gold-antique/30 flex items-center justify-center mb-3">
          <Key className="w-6 h-6 text-gold-antique" />
        </div>
        <h2 className="text-xl font-semibold text-white tracking-tight">
          Join an Existing Game
        </h2>
        <p className="text-sm text-[#b9b0bd] mt-1">
          Signed-in players can join an open room with its invitation code.
        </p>
      </div>

      {/* Notifications & Banners */}
      {errorMessage && (
        <div className="mb-5 rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-2.5 text-xs font-sans text-rose-200 text-center">
          {errorMessage}
        </div>
      )}
      {result && result.success && (
        <div className="mb-5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-xs font-sans text-emerald-200 text-center">
          <p className="font-semibold text-emerald-300">
            ✓ Room joined [{result.roomCode}]
          </p>
          <p className="text-emerald-200/80 mt-0.5">{result.message}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleJoinSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-sans text-text-secondary mb-1.5 text-left uppercase tracking-wider">
            Enter Room Code
          </label>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#100d13] border border-white/10 focus-within:border-[#a78ab2] transition-all">
            <Users className="w-5 h-5 text-gold-antique/70 shrink-0" />
            <input
              type="text"
              placeholder="ENTER ROOM CODE (E.G. AIT-7492)"
              value={roomCode}
              onChange={handleCodeChange}
              maxLength={12}
              required
              className="w-full bg-transparent text-center font-cinzel text-base sm:text-lg tracking-widest text-gold-light placeholder:text-text-secondary/40 focus:outline-none uppercase"
            />
          </div>
        </div>

        {/* Primary Action Button: Join Game → */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-xl bg-[#e1cbd4] hover:from-gold-antique hover:to-gold-light text-[#211c25] font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 shadow-[0_0_25px_rgba(242,216,154,0.35)] hover:shadow-[0_0_30px_rgba(212,175,55,0.45)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-background" />
              <span>Verifying Chamber Code...</span>
            </>
          ) : (
            <>
              <Users className="w-5 h-5 text-background stroke-[2]" />
              <span>Join Game</span>
              <ArrowRight className="w-4 h-4 text-background" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Create tab */}
      <p className="text-center font-sans text-xs text-text-secondary mt-6">
        Want to host your own game?{" "}
        <button
          type="button"
          onClick={onSwitchToCreate}
          className="text-gold-light hover:text-gold-antique font-medium underline transition"
        >
          Create a Game
        </button>
      </p>
    </div>
  );
}
