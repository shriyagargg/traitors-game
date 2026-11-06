"use client";

import { useEffect, useState, useMemo } from "react";
import { LobbyService } from "@/services/lobbyService";
import { LobbyRoomState } from "@/types/lobby";
import { PlayerCapacity } from "@/services/rooms";

export function useLobby(
  roomCode = "A7K4D9",
  initialRoomName = "Somya's Game Room",
  initialCapacity: PlayerCapacity = 8,
  isPrivate = false
) {
  const service = useMemo(() => {
    return new LobbyService(roomCode, initialRoomName, initialCapacity, isPrivate);
  }, [roomCode, initialRoomName, initialCapacity, isPrivate]);

  const [state, setState] = useState<LobbyRoomState>(() => service.getState());

  useEffect(() => {
    const unsubscribe = service.subscribe((newState) => {
      setState({ ...newState });
    });

    return () => {
      unsubscribe();
      service.disconnect();
    };
  }, [service]);

  const currentUser = state.players.find((p) => p.isCurrentUser);
  const isHost = !!currentUser?.isHost;

  return {
    state,
    isHost,
    currentUser,
    toggleReady: (playerId?: string) => service.toggleReady(playerId),
    sendChatMessage: (text: string) => service.sendChatMessage(text),
    updateSettings: (settings: Parameters<typeof service.updateSettings>[0]) =>
      service.updateSettings(settings),
    updateRoomName: (name: string) => service.updateRoomName(name),
    validateGameStart: () => service.validateGameStart(),
    toggleDemoUserRole: () => service.toggleDemoUserRole(),
    simulateFillSlots: () => service.simulateFillSlots(),
    simulateReadyAll: () => service.simulateReadyAll(),
  };
}
