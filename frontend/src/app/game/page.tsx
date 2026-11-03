import React from "react";
import type { Metadata } from "next";
import { GameHubContainer } from "@/components/game/GameHubContainer";

export const metadata: Metadata = {
  title: "Create or Join a Game — AI TRAITORS: The Architect",
  description: "Gather your allies (or rivals) and step into the game.",
};

export default function GameHubPage() {
  return <GameHubContainer initialTab="create" />;
}
