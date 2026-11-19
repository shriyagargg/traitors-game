"use client";

import { useEffect, useState, useRef } from "react";
import { VotingResultsService } from "@/services/votingResultsService";
import { VotingResultsState, PlayerRole, GameOutcomeStatus } from "@/types/votingResults";

export function useVotingResults(roomCode = "", roundNumber = 1) {
  const serviceRef = useRef<VotingResultsService | null>(null);
  if (serviceRef.current === null) {
    serviceRef.current = new VotingResultsService(roomCode, roundNumber);
  }
  const service = serviceRef.current;

  const [state, setState] = useState<VotingResultsState>(() => service.getState());

  useEffect(() => {
    if (roomCode) {
      void service.reinit(roomCode);
    }
  }, [roomCode, service]);

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

  return {
    state,
    revealAllegiance: () => service.revealAllegiance(),
    hideAllegiance: () => service.hideAllegiance(),
  };
}
