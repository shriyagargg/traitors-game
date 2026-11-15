"use client";

import { useEffect, useState, useMemo } from "react";
import { VictoryService } from "@/services/victoryService";
import { VictoryState, VictoryOutcome } from "@/types/victory";

export function useVictory(
  roomCode = "A7K4D9",
  initialOutcome: VictoryOutcome = "FAITHFUL_VICTORY"
) {
  const service = useMemo(() => {
    return new VictoryService(roomCode, initialOutcome);
  }, [roomCode, initialOutcome]);

  const [state, setState] = useState<VictoryState>(() => service.getState());

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
    setOutcome: (outcome: VictoryOutcome) => service.setOutcome(outcome),
  };
}

