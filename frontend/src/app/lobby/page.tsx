"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LobbyContainer } from "@/components/lobby/LobbyContainer";
import { PlayerCapacity } from "@/services/rooms";

function LobbyContent() {
  const searchParams = useSearchParams();

  const code = searchParams.get("code") || "";
  const name = searchParams.get("name") || "Council Chamber";
  const capacityParam = Number(searchParams.get("capacity")) || 8;
  const capacity: PlayerCapacity =
    capacityParam === 6 || capacityParam === 7 || capacityParam === 8
      ? capacityParam
      : 8;
  const isPrivate = searchParams.get("private") === "true";

  if (!code) return <div className="min-h-screen bg-[#09060D] flex items-center justify-center text-gold-light">No room code supplied. Create or join a game first.</div>;

  return (
    <LobbyContainer
      initialRoomCode={code}
      initialRoomName={name}
      initialCapacity={capacity}
      initialIsPrivate={isPrivate}
    />
  );
}

export default function LobbyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09060D] flex items-center justify-center text-gold-light font-cinzel">
          Loading Chamber...
        </div>
      }
    >
      <LobbyContent />
    </Suspense>
  );
}
