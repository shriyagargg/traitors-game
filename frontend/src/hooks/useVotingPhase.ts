"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { VotingService } from "@/services/votingService";
import { VotingPhaseState, VotingTarget } from "@/types/votingPhase";

export function useVotingPhase(roomCode = "A7K4D9", roundNumber = 2) {
  const serviceRef = useRef<VotingService | null>(null);
  if (serviceRef.current === null) {
    serviceRef.current = new VotingService(roomCode, roundNumber);
  }
  const service = serviceRef.current;

  const [state, setState] = useState<VotingPhaseState>(() => service.getState());

  useEffect(() => {
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
  }, []);

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
    fastForward: () => service.fastForward(),
  };
}
