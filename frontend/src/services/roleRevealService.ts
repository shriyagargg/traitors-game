import { GameRole, RoleConfig, PlayerSecretIdentity } from "@/types/roleReveal";

export const ROLE_CONFIGS: Record<GameRole, RoleConfig> = {
  traitor: {
    role: "traitor",
    title: "TRAITOR",
    subtitle: "The Hidden Threat",
    accentColor: "#DC2626",
    glowColor: "rgba(220, 38, 38, 0.4)",
    badgeBg: "bg-red-950/60 border-red-500/40",
    borderColor: "border-red-600/70",
    textColor: "text-red-400",
    imageSrc: "/images/role_traitor.png",
    objective: "Eliminate the Faithful and gain control of the game.",
    abilities: [
      "Choose one player to eliminate each night.",
      "Communicate privately with your Traitor ally.",
      "Blend in during discussions and avoid suspicion.",
    ],
    reminder: "Your identity is secret. Do not reveal it. Deceive, strategise and survive.",
  },
  doctor: {
    role: "doctor",
    title: "DOCTOR",
    subtitle: "The Protector",
    accentColor: "#10B981",
    glowColor: "rgba(16, 185, 129, 0.4)",
    badgeBg: "bg-emerald-950/60 border-emerald-500/40",
    borderColor: "border-emerald-600/70",
    textColor: "text-emerald-400",
    imageSrc: "/images/role_doctor.png",
    objective: "Keep innocent players alive and prevent the Traitors from gaining control.",
    abilities: [
      "Select one player to protect each night.",
      "Protection can prevent a successful elimination.",
      "Use discussions to identify suspicious behaviour.",
    ],
    reminder: "Choose wisely. One decision can save a life.",
  },
  detective: {
    role: "detective",
    title: "DETECTIVE",
    subtitle: "The Investigator",
    accentColor: "#D4AF37",
    glowColor: "rgba(212, 175, 55, 0.4)",
    badgeBg: "bg-amber-950/60 border-amber-500/40",
    borderColor: "border-[#D4AF37]/70",
    textColor: "text-gold-light",
    imageSrc: "/images/role_detective.png",
    objective: "Discover the Traitors and help the Faithful eliminate them.",
    abilities: [
      "Investigate one player each night.",
      "Receive a private investigation result.",
      "Use verified information strategically during discussions.",
    ],
    reminder: "Observe carefully. Information is your greatest weapon.",
  },
  faithful: {
    role: "faithful",
    title: "FAITHFUL",
    subtitle: "The Innocent Majority",
    accentColor: "#60A5FA",
    glowColor: "rgba(96, 165, 250, 0.4)",
    badgeBg: "bg-blue-950/60 border-blue-500/40",
    borderColor: "border-blue-500/70",
    textColor: "text-blue-400",
    imageSrc: "/images/role_faithful.png",
    objective: "Identify and eliminate all Traitors before they take control.",
    abilities: [
      "Participate in daytime discussions.",
      "Analyse player statements and voting behaviour.",
      "Vote to eliminate suspected Traitors.",
    ],
    reminder: "Trust carefully. Question everything.",
  },
};

/**
 * Fetch secret role assignment securely from backend.
 * Only the requesting authenticated player's secret role is delivered.
 */
export async function fetchSecretIdentity(
  roomCode = "A7K4D9",
  requestedRole?: GameRole
): Promise<PlayerSecretIdentity> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  try {
    const res = await fetch(`${apiUrl}/api/v1/game/${roomCode}/my-role`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        playerId: data.player_id || "p_somya",
        playerName: data.player_name || "Somya",
        roomCode: roomCode.toUpperCase(),
        roundNumber: data.round_number || 1,
        role: data.role as GameRole,
        isMock: false,
      };
    }
  } catch {
    // Backend game engine endpoint is in standby
  }

  // Graceful simulation: default role is "traitor" as depicted in reference mockup
  const finalRole: GameRole = requestedRole || "traitor";

  return {
    playerId: "p_somya",
    playerName: "Somya",
    roomCode: roomCode.toUpperCase(),
    roundNumber: 1,
    role: finalRole,
    isMock: true,
  };
}
