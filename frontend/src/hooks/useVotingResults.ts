"use client";

import { useEffect, useState, useMemo } from "react";
import { VotingResultsService } from "@/services/votingResultsService";
import { VotingResultsState, PlayerRole, GameOutcomeStatus } from "@/types/votingResults";

export function useVotingResults(roomCode = "A7K4D9", roundNumber = 2) {
  const service = useMemo(() => {
    return new VotingResultsService(roomCode, roundNumber);
  }, [roomCode, roundNumber]);

  const [state, setState] = useState<VotingResultsState>(() => service.getState());

  useEffect(() => {
    const unsubscribe = service.subscribe((newState) => {
      setState({ ...newState });
    });

    return () => {
      unsubscribe();
      service.destroy();
    };
  }, [service]);

  return {
    state,
    revealAllegiance: () => service.revealAllegiance(),
    hideAllegiance: () => service.hideAllegiance(),
    setRoleDemo: (role: PlayerRole) => service.setRoleDemo(role),
    setOutcomeDemo: (outcome: GameOutcomeStatus) => service.setOutcomeDemo(outcome),
  };
}

