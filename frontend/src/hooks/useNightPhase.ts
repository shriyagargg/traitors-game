"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { NightPhaseService, NIGHT_ROLE_CONFIGS } from "@/services/nightPhaseService";
import { GameRole } from "@/types/roleReveal";
import { NightPhaseState, NightPlayerTarget, NightRoleConfig } from "@/types/nightPhase";

export function useNightPhase(
  roomCode = "A7K4D9",
  initialRole: GameRole = "traitor",
  roundNumber = 2
) {
  const serviceRef = useRef<NightPhaseService | null>(null);
  if (serviceRef.current === null) {
    serviceRef.current = new NightPhaseService(roomCode, initialRole, roundNumber);
  }
  const service = serviceRef.current;

  const [state, setState] = useState<NightPhaseState>(() => service.getState());

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

  const config: NightRoleConfig = NIGHT_ROLE_CONFIGS[state.currentRole];
  const targets: NightPlayerTarget[] = service.getEligibleTargets();

  const formattedTimer = useMemo(() => {
    const mins = Math.floor(state.timerSeconds / 60);
    const secs = state.timerSeconds % 60;
    const mm = mins < 10 ? `0${mins}` : `${mins}`;
    const ss = secs < 10 ? `0${secs}` : `${secs}`;
    return `${mm}:${ss}`;
  }, [state.timerSeconds]);

  return {
    state,
    config,
    targets,
    formattedTimer,
    selectTarget: (id: string) => service.selectTarget(id),
    submitAction: () => service.submitAction(),
    switchRole: (role: GameRole) => service.switchRole(role),
    resetAction: () => service.resetAction(),
    resetTimer: () => service.resetTimer(),
    fastForward: () => service.fastForward(),
  };
}
