"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DiscussionService, INITIAL_ARCHITECT_ANNOUNCEMENT } from "@/services/discussionService";
import { DiscussionState } from "@/types/discussion";

function initialState(roomCode: string, roundNumber: number): DiscussionState {
  return {
    roomCode: roomCode.toUpperCase(),
    roundNumber,
    phaseName: "Discussion",
    phaseType: "Day",
    timerSeconds: 0,
    announcement: { ...INITIAL_ARCHITECT_ANNOUNCEMENT },
    players: [],
    messages: [],
    connectionStatus: "disconnected",
    hasSynced: false,
  };
}

export function useDiscussion(roomCode = "", roundNumber = 1) {
  const serviceRef = useRef<DiscussionService | null>(null);
  const [state, setState] = useState<DiscussionState>(() => initialState(roomCode, roundNumber));

  useEffect(() => {
    const service = new DiscussionService(roomCode, roundNumber);
    serviceRef.current = service;
    const unsubscribe = service.subscribe((nextState) => setState({ ...nextState }));

    return () => {
      unsubscribe();
      service.destroy();
      if (serviceRef.current === service) serviceRef.current = null;
    };
  }, [roomCode, roundNumber]);

  const formattedTimer = useMemo(() => {
    const mins = Math.floor(state.timerSeconds / 60);
    const secs = state.timerSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, [state.timerSeconds]);

  return {
    state,
    formattedTimer,
    sendMessage: (text: string) => serviceRef.current
      ? serviceRef.current.sendMessage(text)
      : Promise.resolve({ success: false, message: "Discussion is still connecting." }),
    consultArchitect: (query: string) => serviceRef.current
      ? serviceRef.current.consultArchitect(query)
      : Promise.resolve({ success: false, message: "The Architect is still connecting." }),
    togglePlayerStatus: (playerId: string) => serviceRef.current?.togglePlayerStatus(playerId),
  };
}
