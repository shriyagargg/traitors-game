"use client";

import React, { use } from "react";
import { LobbyContainer } from "@/components/lobby/LobbyContainer";

interface RoomLobbyPageProps {
  params: Promise<{ code: string }>;
}

export default function RoomLobbyPage({ params }: RoomLobbyPageProps) {
  const resolvedParams = use(params);
  const code = (resolvedParams.code || "").toUpperCase();

  return (
    <LobbyContainer
      initialRoomCode={code}
      initialRoomName="Council Chamber"
      initialCapacity={8}
      initialIsPrivate={false}
    />
  );
}
