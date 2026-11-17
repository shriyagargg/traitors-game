"use client";

import { useEffect, useState, useRef } from "react";
import { MorningService } from "@/services/morningService";
import { MorningAnnouncementState } from "@/types/morningAnnouncement";

export function useMorningAnnouncement(roomCode = "A7K4D9", roundNumber = 2) {
  const serviceRef = useRef<MorningService | null>(null);
  if (serviceRef.current === null) {
    serviceRef.current = new MorningService(roomCode, roundNumber);
  }
  const service = serviceRef.current;

  const [state, setState] = useState<MorningAnnouncementState>(() =>
    service.getState()
  );

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
