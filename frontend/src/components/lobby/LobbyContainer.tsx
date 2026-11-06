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
import { MOCK_PLAYER_PROFILE } from "@/services/dashboard";
import { PlayerCapacity } from "@/services/rooms";
import { ShieldCheck, UserCheck, Users, Radio, Sparkles } from "lucide-react";

interface LobbyContainerProps {
  initialRoomCode?: string;
  initialRoomName?: string;
  initialCapacity?: PlayerCapacity;
  initialIsPrivate?: boolean;
}

export function LobbyContainer({
  initialRoomCode = "A7K4D9",
  initialRoomName = "Somya's Game Room",
  initialCapacity = 8,
  initialIsPrivate = false,
}: LobbyContainerProps) {
  const router = useRouter();

  const {
    state,
    isHost,
    currentUser,
    toggleReady,
    sendChatMessage,
    updateSettings,
    updateRoomName,
    validateGameStart,
    toggleDemoUserRole,
    simulateFillSlots,
    simulateReadyAll,
  } = useLobby(
    initialRoomCode,
    initialRoomName,
    initialCapacity,
    initialIsPrivate
  );

  const [gameStartedNotification, setGameStartedNotification] = useState(false);

  const handleStartGame = () => {
    setGameStartedNotification(true);
    setTimeout(() => {
      // In Phase 6 this navigates to the Role Reveal page
      router.push("/game/reveal");
    }, 2200);
  };

  const handleQuickFixDemo = () => {
    simulateFillSlots();
    simulateReadyAll();
  };

  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col selection:bg-purple-muted selection:text-gold-light relative overflow-x-hidden">
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

      {/* 2. Top Navigation Bar (Reusing Master Dashboard Header) */}
      <DashboardHeader activeNav="create" profile={MOCK_PLAYER_PROFILE} />

      {/* 3. Main Master Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 z-10 flex flex-col justify-between gap-5">
        {/* A. Top Header Area */}
        <div className="space-y-4">
          <LobbyHeader />

          {/* B. Room Information Horizontal Bar */}
          <RoomInfoBar
            roomName={state.roomName}
            roomCode={state.roomCode}
            playerCount={state.players.length}
            maxCapacity={state.settings.playerCapacity}
            isPrivate={state.isPrivate}
            isHost={isHost}
            onUpdateRoomName={updateRoomName}
          />
        </div>

        {/* C. Middle Chamber: Player Slots (Left 8 cols) & Settings Panel (Right 4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch my-auto">
          {/* Left Column: Player Slots Grid */}
          <div className="lg:col-span-8 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Council Chamber Slots ({state.players.length}/{state.settings.playerCapacity})
              </span>
              <span className="text-[11px] text-gold-antique/70">
                Click any status badge to toggle Ready (Demo)
              </span>
            </div>
            <PlayerSlotsRow
              players={state.players}
              capacity={state.settings.playerCapacity}
              onToggleReady={toggleReady}
              currentUserId={currentUser?.id}
            />
          </div>

          {/* Right Column: Settings & Role Distribution */}
          <div className="lg:col-span-4 flex flex-col">
            <LobbySettingsPanel
              settings={state.settings}
              isHost={isHost}
              onUpdateSettings={updateSettings}
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
              onQuickFixDemo={handleQuickFixDemo}
            />
          </div>
        </div>

        {/* E. Evaluator & Demo Simulation Toolbar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gold-antique/10 text-[11px] font-sans text-text-secondary/70">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-gold-antique animate-pulse" />
            <span className="text-gold-light/80">Connection Status:</span>
            <span className="bg-[#1A0E1C] px-2 py-0.5 rounded border border-gold-antique/25 font-mono text-[10px] text-text-main">
              {state.connectionStatus === "connected"
                ? "Live WebSocket"
                : "Mock Evaluation Adapter"}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-text-secondary/50">Demo Helpers:</span>
            <button
              onClick={toggleDemoUserRole}
              className="px-2 py-1 rounded bg-[#1A0E1C] hover:bg-[#251528] border border-gold-antique/20 text-gold-light text-[10px] transition"
              title="Toggle view between Host (Somya) and Guest (Shubh)"
            >
              Toggle Host / Guest View ({isHost ? "Currently Host" : "Currently Guest"})
            </button>
            <button
              onClick={simulateFillSlots}
              disabled={state.players.length >= state.settings.playerCapacity}
              className="px-2 py-1 rounded bg-[#1A0E1C] hover:bg-[#251528] border border-gold-antique/20 text-gold-light text-[10px] transition disabled:opacity-40"
              title="Fill remaining slots to capacity"
            >
              Fill Slots (8/8)
            </button>
            <button
              onClick={simulateReadyAll}
              className="px-2 py-1 rounded bg-[#1A0E1C] hover:bg-[#251528] border border-gold-antique/20 text-gold-light text-[10px] transition"
              title="Make all players ready"
            >
              Ready All Players
            </button>
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
            CHAMBER SEALED
          </h2>
          <p className="font-cormorant text-xl text-[#F5EEDC] italic max-w-md mb-4">
            The Architect is assigning secret roles according to CSP constraints...
          </p>
          <span className="text-xs font-mono text-gold-antique/80">
            Proceeding to Role Reveal Chamber...
          </span>
        </div>
      )}
    </div>
  );
}
