"use client";

import { useEffect, useState, useMemo } from "react";
import { DiscussionService } from "@/services/discussionService";
import { DiscussionState } from "@/types/discussion";

export function useDiscussion(roomCode = "A7K4D9", roundNumber = 2) {
  const service = useMemo(() => {
    return new DiscussionService(roomCode, roundNumber);
  }, [roomCode, roundNumber]);

  const [state, setState] = useState<DiscussionState>(() => service.getState());

  useEffect(() => {
    const unsubscribe = service.subscribe((newState) => {
      setState({ ...newState });
    });

    return () => {
      unsubscribe();
      service.destroy();
    };
  }, [service]);

  // Format countdown seconds into MM:SS (e.g. 168 -> "02:48")
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
  };
}
