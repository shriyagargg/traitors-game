"use client";

import { useEffect, useState, useRef } from "react";
import { VictoryService } from "@/services/victoryService";
import { VictoryState, VictoryOutcome } from "@/types/victory";

export function useVictory(
  roomCode = "",
  initialOutcome: VictoryOutcome = "FAITHFUL_VICTORY"
) {
  const serviceRef = useRef<VictoryService | null>(null);
  if (serviceRef.current === null) {
    serviceRef.current = new VictoryService(roomCode, initialOutcome);
  }
  const service = serviceRef.current;

  const [state, setState] = useState<VictoryState>(() => service.getState());

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
  };
}
