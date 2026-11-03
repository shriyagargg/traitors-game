import React from "react";
import type { Metadata } from "next";
import { GameHubContainer } from "@/components/game/GameHubContainer";

export const metadata: Metadata = {
  title: "Join a Game — AI TRAITORS: The Architect",
  description: "Enter your room code and claim your seat at the council table of The Architect.",
};

export default function JoinGamePage() {
  return <GameHubContainer initialTab="join" />;
}
