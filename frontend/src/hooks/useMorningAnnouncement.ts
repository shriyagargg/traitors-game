"use client";

import { useEffect, useState, useMemo } from "react";
import { MorningService } from "@/services/morningService";
import { MorningAnnouncementState } from "@/types/morningAnnouncement";

export function useMorningAnnouncement(roomCode = "A7K4D9", roundNumber = 2) {
  const service = useMemo(() => {
    return new MorningService(roomCode, roundNumber);
  }, [roomCode, roundNumber]);

  const [state, setState] = useState<MorningAnnouncementState>(() =>
    service.getState()
  );

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
    toggleEliminationScenario: () => service.toggleEliminationScenario(),
  };
}
