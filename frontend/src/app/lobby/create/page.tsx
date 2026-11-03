import React from "react";
import type { Metadata } from "next";
import { GameHubContainer } from "@/components/game/GameHubContainer";

export const metadata: Metadata = {
  title: "Create a Game — AI TRAITORS: The Architect",
  description: "Set up your room, configure player capacity, and let The Architect run the game.",
};

export default function CreateGamePage() {
  return <GameHubContainer initialTab="create" />;
}
