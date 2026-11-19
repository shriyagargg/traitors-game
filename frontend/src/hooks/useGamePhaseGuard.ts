"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/services/rooms";
import { getPlayerSession, ensureRoomSession } from "@/services/playerSession";

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

/**
 * Prevents a stale bookmark or manual URL change from displaying another phase.
 *
 * Key guards:
 * - Polls every 10s (not 3s) to reduce backend load.
 * - Skips the first 6s after mount so the WebSocket INITIAL_SYNC can settle.
 * - Only redirects after 2 consecutive mismatches (debounce) to avoid bouncing
 *   during the brief animation delay between phase transitions.
 * - Stops after the first successful redirect (redirectedRef) so it cannot
 *   bounce the user back from the page they were just sent to.
 */
export function useGamePhaseGuard(roomCode: string, expectedPhase: string) {
  const router = useRouter();
  const redirectedRef = useRef(false);
  const mismatchCountRef = useRef(0);
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!roomCode) return;
    redirectedRef.current = false;
    mismatchCountRef.current = 0;
    mountTimeRef.current = Date.now();

    let active = true;
    let checking = false;

    const check = async () => {
      // Don't redirect right after mount — give WebSocket time to sync.
      if (Date.now() - mountTimeRef.current < 6000) return;
      // Once we've redirected, stop checking entirely.
      if (redirectedRef.current) return;
      if (checking) return;
      checking = true;
      try {
        let session = getPlayerSession(roomCode);
        if (!session.token && session.accountToken) {
          session = await ensureRoomSession(roomCode);
        }
        if (!session.token) return;
        const query = new URLSearchParams({
          player_id: session.id,
          token: session.token,
          account_token: session.accountToken || "",
        });
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/game/${encodeURIComponent(roomCode)}/state?${query}`
        );
        if (!active) return;
        if (response.status === 401) {
          router.replace(
            `/auth/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`
          );
          return;
        }
        if (!response.ok) return;
        const state = await response.json();
        if (!state.phase) return;

        const route = routes[state.phase];
        if (!route || typeof window === "undefined") return;

        const isLobby = state.phase === "LOBBY";
        const serverRound = String(state.round_number || 1);
        const destination = isLobby
          ? `${route}?code=${encodeURIComponent(roomCode)}`
          : `${route}?room=${encodeURIComponent(roomCode)}&round=${serverRound}`;
        const currentPath = window.location.pathname;
        const currentRound = new URLSearchParams(window.location.search).get("round");
        const needsRedirect = isLobby
          ? !currentPath.startsWith(route) || !window.location.search.includes(encodeURIComponent(roomCode))
          : !currentPath.startsWith(route) || (currentRound !== null && currentRound !== serverRound);

        if (needsRedirect) {
          mismatchCountRef.current++;
          // Only redirect after 2 consecutive mismatches (debounce transient stale state).
          if (mismatchCountRef.current >= 2) {
            redirectedRef.current = true;
            router.replace(destination);
          }
        } else {
          // Reset debounce count whenever we're on the right page.
          mismatchCountRef.current = 0;
        }
      } catch {
        // Retain the current screen during a transient network interruption.
      } finally {
        checking = false;
      }
    };

    // First check after 8s (after the mount-time quiet window).
    const firstCheckTimer = setTimeout(() => void check(), 8000);
    // Subsequent checks every 10s.
    const interval = setInterval(() => void check(), 10000);
    return () => {
      active = false;
      clearTimeout(firstCheckTimer);
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);
}
