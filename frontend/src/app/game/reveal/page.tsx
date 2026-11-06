"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RoleRevealContainer } from "@/components/reveal/RoleRevealContainer";
import { GameRole } from "@/types/roleReveal";

function RoleRevealContent() {
  const searchParams = useSearchParams();

  const code = searchParams.get("code") || "A7K4D9";
  const roleParam = searchParams.get("role") as GameRole | null;
  const initialRole: GameRole =
    roleParam === "traitor" ||
    roleParam === "doctor" ||
    roleParam === "detective" ||
    roleParam === "faithful"
      ? roleParam
      : "traitor";

  return (
    <RoleRevealContainer initialRoomCode={code} initialRole={initialRole} />
  );
}

export default function RoleRevealPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09060D] flex items-center justify-center text-gold-light font-cinzel">
          Deciding Secret Identity...
        </div>
      }
    >
      <RoleRevealContent />
    </Suspense>
  );
}
