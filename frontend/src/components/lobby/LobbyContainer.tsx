"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { LobbyHeader } from "./LobbyHeader";
import { RoomInfoBar } from "./RoomInfoBar";
import { PlayerSlotsRow } from "./PlayerSlotsRow";
import { LobbySettingsPanel } from "./LobbySettingsPanel";
import { LobbyChatBar } from "./LobbyChatBar";
import { StartGameAction } from "./StartGameAction";
import { useLobby } from "@/hooks/useLobby";
import { useGamePhaseGuard } from "@/hooks/useGamePhaseGuard";
import { getPlayerSession } from "@/services/playerSession";
import { PlayerCapacity } from "@/services/rooms";
import { Radio, Sparkles, AlertCircle, X } from "lucide-react";

interface LobbyContainerProps {
  initialRoomCode?: string;
  initialRoomName?: string;
  initialCapacity?: PlayerCapacity;
  initialIsPrivate?: boolean;
}

export function LobbyContainer({
  initialRoomCode = "",
  initialRoomName = "Council Chamber",
  initialCapacity = 8,
  initialIsPrivate = false,
}: LobbyContainerProps) {
  useGamePhaseGuard(initialRoomCode, "LOBBY");
  const router = useRouter();

  const {
    state,
    isHost,
    currentUser,
    toggleReady,
    sendChatMessage,
    validateGameStart,
    startGame,
    leaveLobby,
    addTestPlayers,
    removeTestPlayer,
  } = useLobby(
    initialRoomCode,
    initialRoomName,
    initialCapacity,
    initialIsPrivate
  );

  const [gameStartedNotification, setGameStartedNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isAddingTestPlayers, setIsAddingTestPlayers] = useState(false);

  // Synchronized navigation: whenever server status turns to "playing", ALL players enter the game together!
  React.useEffect(() => {
    if (state.status === "playing") {
      setGameStartedNotification(true);
      const timer = setTimeout(() => {
        router.push(`/game/reveal?room=${state.roomCode}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.status, state.roomCode, router]);

  const handleStartGame = async () => {
    setErrorMessage(null);
    const res = await startGame();
    if (!res.success) {
      setErrorMessage(res.message);
    }
  };

  const handleAddTestPlayers = async () => {
    setIsAddingTestPlayers(true);
    const result = await addTestPlayers();
    setIsAddingTestPlayers(false);
    if (!result.success) setErrorMessage(result.message);
  };

  const handleLeaveLobby = async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    try {
      await leaveLobby();
      if (typeof window !== "undefined") {
        try {
          const rooms = JSON.parse(localStorage.getItem("agy_room_sessions") || "{}");
          delete rooms[initialRoomCode.toUpperCase()];
          localStorage.setItem("agy_room_sessions", JSON.stringify(rooms));
        } catch {}
      }
      router.replace("/dashboard");
    } catch {
      router.replace("/dashboard");
    }
  };

  const currentSession = getPlayerSession(initialRoomCode);

  return (
    <div className="min-h-screen bg-[#100d13] text-[#f5f1f7] flex flex-col selection:bg-purple-900/40 selection:text-gold-light">
      {/* 1. Cinematic Background Vignette & Atmospheric Glows */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 95% 75% at 50% 12%, #24101F 0%, #120A14 45%, #09060D 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -top-24 -left-20 w-[500px] h-[400px] rounded-full bg-purple-muted/15 blur-[140px] z-0"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-28 -right-20 w-[500px] h-[400px] rounded-full bg-burgundy-deep/25 blur-[140px] z-0"
        aria-hidden="true"
      />

      {/* 2. Top Navigation Bar */}
      <DashboardHeader
        activeNav="create"
        profile={{
          name: currentSession.name || currentUser?.name || "Player",
          email: currentSession.email || "",
          avatarUrl: currentSession.avatarUrl || currentUser?.avatarUrl || "",
          roleBadge: isHost ? "Chamber Host" : "Council Initiate",
        }}
      />

      {/* 3. Main Master Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 z-10 flex flex-col gap-5">
        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="w-full rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-sm text-rose-200 flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* A. Top Header Area */}
        <div className="space-y-4">
          <LobbyHeader onLeaveLobby={handleLeaveLobby} />

          {/* B. Room Information Horizontal Bar */}
          <RoomInfoBar
            roomName={state.roomName}
            roomCode={state.roomCode}
            playerCount={state.players.length}
            maxCapacity={state.settings.playerCapacity}
            isPrivate={state.isPrivate}
            isHost={isHost}
            onLeaveLobby={handleLeaveLobby}
            isLeaving={isLeaving}
            onAddTestPlayers={handleAddTestPlayers}
            isAddingTestPlayers={isAddingTestPlayers}
          />
        </div>

        {/* C. Middle Chamber: Player Slots (Left 8 cols) & Settings Panel (Right 4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Player Slots Grid */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold text-[#b9b0bd] uppercase tracking-wider">
                Council Chamber Slots ({state.players.length}/{state.settings.playerCapacity})
              </span>
              <span className="text-[11px] text-[#b99ca5]/70">
                Connected players in real time
              </span>
            </div>
            <PlayerSlotsRow
              players={state.players}
              capacity={state.settings.playerCapacity}
              onToggleReady={toggleReady}
              currentUserId={currentUser?.id || currentSession.id}
              isHost={isHost}
              onRemoveTestPlayer={async (playerId) => {
                const result = await removeTestPlayer(playerId);
                if (!result.success) setErrorMessage(result.message);
              }}
            />
          </div>

          {/* Right Column: Settings & Role Distribution */}
          <div className="lg:col-span-4 flex flex-col">
            <LobbySettingsPanel
              settings={state.settings}
            />
          </div>
        </div>

        {/* D. Bottom Floor: Lobby Chat (Left) & Start Game Action (Right) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2">
          {/* Left / Center: Lobby Chat Bar */}
          <div className="flex-1">
            <LobbyChatBar
              messages={state.messages}
              onSendMessage={sendChatMessage}
            />
          </div>

          {/* Right: Start Game Button */}
          <div className="shrink-0 flex items-center justify-center">
            <StartGameAction
              isHost={isHost}
              onValidate={validateGameStart}
              onStartGame={handleStartGame}
            />
          </div>
        </div>

        {/* E. Live connection status indicator */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs text-[#a89fac]">
          <div className="flex items-center gap-2">
            <Radio
              className={`w-3.5 h-3.5 ${
                state.connectionStatus === "connected"
                  ? "text-emerald-400 animate-pulse"
                  : "text-amber-400"
              }`}
            />
            <span className="text-[#b9b0bd]/80">Multiplayer Sync:</span>
            <span className="bg-[#19151d] px-2 py-0.5 rounded border border-white/10 font-mono text-[10px] text-white">
              {state.connectionStatus === "connected" ? "Live WebSocket Connected" : "Connecting..."}
            </span>
          </div>
          <div className="text-[11px] text-[#b9b0bd]/60">
            {isHost ? "You are the Host. Start game when all players are Ready." : "Waiting for Host to start the game."}
          </div>
        </div>
      </main>

      {/* 4. Start Game Launch Overlay Notification */}
      {gameStartedNotification && (
        <div className="fixed inset-0 z-50 bg-[#09060D]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-full border-2 border-gold-antique/60 bg-gradient-to-tr from-purple-muted/40 to-gold-antique/20 flex items-center justify-center mb-6 shadow-[0_0_35px_rgba(212,175,55,0.4)] animate-pulse">
            <Sparkles className="w-8 h-8 text-gold-light animate-spin" />
          </div>

          <h2 className="font-cinzel text-3xl sm:text-4xl font-bold tracking-[0.2em] text-gold-light mb-2">
            GAME STARTING
          </h2>
          <p className="font-cormorant text-xl text-[#F5EEDC] italic max-w-md mb-4">
            The Council is being summoned.
          </p>
          <span className="text-xs font-mono text-gold-antique/80">
            Revealing secret roles…
          </span>
        </div>
      )}
    </div>
  );
}
