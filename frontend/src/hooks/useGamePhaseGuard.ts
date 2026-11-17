"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/services/rooms";
import { getPlayerSession } from "@/services/playerSession";

const routes: Record<string, string> = {
  LOBBY: "/lobby",
  ROLE_REVEAL: "/game/reveal",
  NIGHT: "/game/night",
  MORNING: "/game/morning",
  DISCUSSION: "/game/discussion",
  VOTING: "/game/voting",
  VOTING_RESULTS: "/game/voting-results",
  GAME_OVER: "/game/victory",
};

/** Prevents a stale bookmark or manual URL change from displaying another phase. */
export function useGamePhaseGuard(roomCode: string, expectedPhase: string) {
  const router = useRouter();
  useEffect(() => {
    if (!roomCode) return;
    const session = getPlayerSession(roomCode);
    const query = new URLSearchParams({ player_id: session.id, token: session.token || "" });
    let active = true;
    let checking = false;
    const check = async () => {
      if (checking) return;
      checking = true;
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/v1/game/${encodeURIComponent(roomCode)}/state?${query}`);
        if (!active || !response.ok) return;
        const state = await response.json();
        if (state.phase && state.phase !== expectedPhase) {
          const route = routes[state.phase];
          if (route) {
            const isLobby = state.phase === "LOBBY";
            router.replace(isLobby
              ? `${route}/${encodeURIComponent(roomCode)}`
              : `${route}?room=${encodeURIComponent(roomCode)}&round=${state.round_number || 1}`);
          }
        }
      } catch {
        // Retain the current screen during a transient network interruption.
      } finally {
        checking = false;
      }
    };
    void check();
    const interval = setInterval(check, 3000);
    return () => { active = false; clearInterval(interval); };
  }, [expectedPhase, roomCode, router]);
}
