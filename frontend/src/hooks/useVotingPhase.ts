"use client";

import { useEffect, useState, useMemo } from "react";
import { VotingService } from "@/services/votingService";
import { VotingPhaseState, VotingTarget } from "@/types/votingPhase";

export function useVotingPhase(roomCode = "A7K4D9", roundNumber = 2) {
  const service = useMemo(() => {
    return new VotingService(roomCode, roundNumber);
  }, [roomCode, roundNumber]);

  const [state, setState] = useState<VotingPhaseState>(() => service.getState());

  useEffect(() => {
    const unsubscribe = service.subscribe((newState) => {
      setState({ ...newState });
    });

    return () => {
      unsubscribe();
      service.destroy();
    };
  }, [service]);

  const targets: VotingTarget[] = service.getEligibleTargets();

  const formattedTimer = useMemo(() => {
    const mins = Math.floor(state.timerSeconds / 60);
    const secs = state.timerSeconds % 60;
    const mm = mins < 10 ? `0${mins}` : `${mins}`;
    const ss = secs < 10 ? `0${secs}` : `${secs}`;
    return `${mm}:${ss}`;
  }, [state.timerSeconds]);

  return {
    state,
    targets,
    formattedTimer,
    selectTarget: (id: string) => service.selectTarget(id),
    submitVote: () => service.submitVote(),
    resetVote: () => service.resetVote(),
    resetTimer: () => service.resetTimer(),
  };
}
