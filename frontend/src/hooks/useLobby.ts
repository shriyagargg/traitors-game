"use client";

import { useEffect, useState, useRef } from "react";
import { LobbyService } from "@/services/lobbyService";
import { LobbyRoomState } from "@/types/lobby";
import { PlayerCapacity } from "@/services/rooms";

export function useLobby(
  roomCode = "",
  initialRoomName = "Council Chamber",
  initialCapacity: PlayerCapacity = 8,
  isPrivate = false
) {
  const serviceRef = useRef<LobbyService | null>(null);
  if (serviceRef.current === null) {
    serviceRef.current = new LobbyService(
      roomCode,
      initialRoomName,
      initialCapacity,
      isPrivate
    );
  }
  const service = serviceRef.current;

  const [state, setState] = useState<LobbyRoomState>(() => service.getState());

  useEffect(() => {
    setState({ ...service.getState() });

    const unsubscribe = service.subscribe((newState) => {
      setState({ ...newState });
    });

    return () => {
      unsubscribe();
      service.disconnect();
      serviceRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    startGame: () => service.startGame(),
    addTestPlayers: (count?: number) => service.addTestPlayers(count),
    removeTestPlayer: (playerId: string) => service.removeTestPlayer(playerId),
    leaveLobby: () => service.leaveLobby(),
  };
}
