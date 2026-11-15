"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { DiscussionService } from "@/services/discussionService";
import { DiscussionState } from "@/types/discussion";

export function useDiscussion(roomCode = "A7K4D9", roundNumber = 2) {
  // useRef guarantees exactly ONE service instance per component mount,
  // even in React 18 Strict Mode (which calls useMemo twice in dev).
  const serviceRef = useRef<DiscussionService | null>(null);
  if (serviceRef.current === null) {
    serviceRef.current = new DiscussionService(roomCode, roundNumber);
  }
  const service = serviceRef.current;

  const [state, setState] = useState<DiscussionState>(() => service.getState());

  useEffect(() => {
    // Re-sync state in case service already ticked while React mounted
    setState({ ...service.getState() });

    const unsubscribe = service.subscribe((newState) => {
      setState({ ...newState });
    });

    return () => {
      unsubscribe();
      service.destroy();
      serviceRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — service is stable via ref

  const formattedTimer = useMemo(() => {
    const mins = Math.floor(state.timerSeconds / 60);
    const secs = state.timerSeconds % 60;
    const mm = mins < 10 ? `0${mins}` : `${mins}`;
    const ss = secs < 10 ? `0${secs}` : `${secs}`;
    return `${mm}:${ss}`;
  }, [state.timerSeconds]);

  return {
    state,
    formattedTimer,
    sendMessage: (text: string) => service.sendMessage(text),
    togglePlayerStatus: (playerId: string) => service.togglePlayerStatus(playerId),
    resetTimer: () => service.resetTimer(),
    fastForward: () => service.fastForward(),
  };
}
