"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { VotingService } from "@/services/votingService";
import { getPlayerSession } from "@/services/playerSession";
import { VotingPhaseState, VotingTarget } from "@/types/votingPhase";

function initialState(roomCode: string, roundNumber: number): VotingPhaseState {
  const session = getPlayerSession(roomCode);
  return {
    roomCode: roomCode.toUpperCase(),
    roundNumber,
    phaseType: "Day",
    timerSeconds: 0,
    currentUserId: session.id,
    selectedTargetId: null,
    isSubmitted: false,
    submittedTargetName: null,
    connectionStatus: "disconnected",
    hasSynced: false,
    allPlayers: [],
    targets: [],
  };
}

export function useVotingPhase(roomCode = "", roundNumber = 1) {
  const serviceRef = useRef<VotingService | null>(null);
  const [state, setState] = useState<VotingPhaseState>(() => initialState(roomCode, roundNumber));

  useEffect(() => {
    const service = new VotingService(roomCode, roundNumber);
    serviceRef.current = service;
    const unsubscribe = service.subscribe((nextState) => setState({ ...nextState }));

    return () => {
      unsubscribe();
      service.destroy();
      if (serviceRef.current === service) serviceRef.current = null;
    };
  }, [roomCode, roundNumber]);

  const targets: VotingTarget[] = state.targets || [];
  const allPlayers = state.allPlayers || [];
  const formattedTimer = useMemo(() => {
    const mins = Math.floor(state.timerSeconds / 60);
    const secs = state.timerSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, [state.timerSeconds]);

  return {
    state,
    targets,
    allPlayers,
    formattedTimer,
    selectTarget: (id: string) => serviceRef.current?.selectTarget(id),
    submitVote: () => serviceRef.current
      ? serviceRef.current.submitVote()
      : Promise.resolve({ success: false, message: "Voting is still connecting." }),
    resetVote: () => serviceRef.current?.resetVote(),
  };
}
