"use client";

import { useEffect, useState, useMemo } from "react";
import { NightPhaseService, NIGHT_ROLE_CONFIGS } from "@/services/nightPhaseService";
import { GameRole } from "@/types/roleReveal";
import { NightPhaseState, NightPlayerTarget, NightRoleConfig } from "@/types/nightPhase";

export function useNightPhase(
  roomCode = "A7K4D9",
  initialRole: GameRole = "traitor",
  roundNumber = 2
) {
  const service = useMemo(() => {
    return new NightPhaseService(roomCode, initialRole, roundNumber);
  }, [roomCode, initialRole, roundNumber]);

  const [state, setState] = useState<NightPhaseState>(() => service.getState());

  useEffect(() => {
    const unsubscribe = service.subscribe((newState) => {
      setState({ ...newState });
    });

    return () => {
      unsubscribe();
      service.destroy();
    };
  }, [service]);

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
