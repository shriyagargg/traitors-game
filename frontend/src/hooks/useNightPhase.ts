"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NightPhaseService, NIGHT_ROLE_CONFIGS } from "@/services/nightPhaseService";
import { GameRole } from "@/types/roleReveal";
import { getPlayerSession } from "@/services/playerSession";
import { NightPhaseState, NightPlayerTarget, NightRoleConfig } from "@/types/nightPhase";

export function useNightPhase(roomCode = "", initialRole: GameRole = "traitor", roundNumber = 1) {
  const serviceRef = useRef<NightPhaseService | null>(null);
  const [state, setState] = useState<NightPhaseState>(() => ({
    roomCode: roomCode.toUpperCase(),
    roundNumber,
    timerSeconds: 0,
    currentRole: initialRole,
    currentUserId: getPlayerSession(roomCode).id,
    selectedTargetId: null,
    isSubmitted: false,
    submittedTargetName: null,
    connectionStatus: "disconnected",
    hasSynced: false,
    allPlayers: [],
    targets: [],
  }));

  useEffect(() => {
    const service = new NightPhaseService(roomCode, initialRole, roundNumber);
    serviceRef.current = service;
    const unsubscribe = service.subscribe((nextState) => setState({ ...nextState }));

    return () => {
      unsubscribe();
      service.destroy();
      if (serviceRef.current === service) serviceRef.current = null;
    };
  }, [roomCode, initialRole, roundNumber]);

  const config: NightRoleConfig = NIGHT_ROLE_CONFIGS[state.currentRole];
  const targets: NightPlayerTarget[] = state.targets || [];
  const allPlayers = state.allPlayers || [];
  const formattedTimer = useMemo(() => {
    const mins = Math.floor(state.timerSeconds / 60);
    const secs = state.timerSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, [state.timerSeconds]);

  return {
    state,
    config,
    targets,
    allPlayers,
    formattedTimer,
    selectTarget: (id: string) => serviceRef.current?.selectTarget(id),
    submitAction: () => serviceRef.current
      ? serviceRef.current.submitAction()
      : Promise.resolve({ success: false, message: "Night phase is still connecting." }),
    resetAction: () => serviceRef.current?.resetAction(),
  };
}
