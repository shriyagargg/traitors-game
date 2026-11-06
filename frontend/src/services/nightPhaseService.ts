import { GameRole } from "@/types/roleReveal";
import {
  NightRoleConfig,
  NightPhaseState,
  NightPlayerTarget,
} from "@/types/nightPhase";
import { INITIAL_DISCUSSION_PLAYERS } from "./discussionService";

export const NIGHT_ROLE_CONFIGS: Record<GameRole, NightRoleConfig> = {
  traitor: {
    role: "traitor",
    actionType: "elimination",
    heading: "Traitor Action",
    subtitle: "Choose one player to eliminate.",
    buttonText: "Confirm Elimination",
    accentColor: "#DC2626",
    ringClass: "ring-2 ring-red-500 shadow-[0_0_20px_rgba(220,38,38,0.6)]",
    radioBgClass: "bg-red-500 border-red-400",
    announcementText: "It is night. Traitors, make your move.",
  },
  doctor: {
    role: "doctor",
    actionType: "protection",
    heading: "Doctor Protection",
    subtitle: "Choose one player to protect tonight.",
    buttonText: "Confirm Protection",
    accentColor: "#10B981",
    ringClass: "ring-2 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)]",
    radioBgClass: "bg-emerald-500 border-emerald-400",
    announcementText: "It is night. Doctor, make your move.",
  },
  detective: {
    role: "detective",
    actionType: "investigation",
    heading: "Detective Investigation",
    subtitle: "Choose one player to investigate tonight.",
    buttonText: "Confirm Investigation",
    accentColor: "#D4AF37",
    ringClass: "ring-2 ring-gold-antique shadow-[0_0_20px_rgba(212,175,55,0.6)]",
    radioBgClass: "bg-gold-antique border-gold-light",
    announcementText: "It is night. Detective, make your move.",
  },
  faithful: {
    role: "faithful",
    actionType: "none",
    heading: "The Night is in Progress",
    subtitle:
      "You have no action tonight. Stay alert and prepare for the morning discussion.",
    buttonText: "",
    accentColor: "#60A5FA",
    ringClass: "ring-2 ring-blue-500",
    radioBgClass: "bg-blue-500 border-blue-400",
    announcementText: "It is night. Rest and await the morning.",
  },
};

export class NightPhaseService {
  private state: NightPhaseState;
  private listeners: Set<(state: NightPhaseState) => void> = new Set();
  private timerInterval: NodeJS.Timeout | null = null;
  private socket: WebSocket | null = null;

  constructor(roomCode = "A7K4D9", initialRole: GameRole = "traitor", roundNumber = 2) {
    this.state = {
      roomCode: roomCode.toUpperCase(),
      roundNumber: roundNumber,
      timerSeconds: 30, // 00:30 as shown in mockup
      currentRole: initialRole,
      currentUserId: "p_somya",
      selectedTargetId: initialRole === "faithful" ? null : "p_riya", // Pre-select Riya as depicted in reference mockup
      isSubmitted: false,
      submittedTargetName: null,
      connectionStatus: "mock_preview",
    };

    this.startCountdown();
    this.initWebSocket(roomCode);
  }

  private initWebSocket(roomCode: string) {
    if (typeof window === "undefined") return;

    try {
      const wsUrl =
        process.env.NEXT_PUBLIC_WS_URL ||
        `ws://localhost:8000/api/v1/ws/game/${roomCode}/night`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        this.socket = ws;
        this.updateState({ connectionStatus: "connected" });
      };

      ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          if (packet.type === "NIGHT_TIMER_SYNC" && typeof packet.payload?.seconds === "number") {
            this.updateState({ timerSeconds: packet.payload.seconds });
          }
        } catch {
          // ignore corrupted packets
        }
      };

      ws.onerror = () => {
        this.socket = null;
        this.updateState({ connectionStatus: "mock_preview" });
      };

      ws.onclose = () => {
        this.socket = null;
        this.updateState({ connectionStatus: "mock_preview" });
      };
    } catch {
      this.updateState({ connectionStatus: "mock_preview" });
    }
  }

  private startCountdown() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.state.timerSeconds > 0) {
        this.updateState({ timerSeconds: this.state.timerSeconds - 1 });
      }
    }, 1000);
  }

  public getState(): NightPhaseState {
    return this.state;
  }

  public subscribe(listener: (state: NightPhaseState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<NightPhaseState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((cb) => cb(this.state));
  }

  // Get eligible targets (living players excluding self where applicable)
  public getEligibleTargets(): NightPlayerTarget[] {
    if (this.state.currentRole === "faithful") {
      return [];
    }

    return INITIAL_DISCUSSION_PLAYERS.filter(
      (p) => p.id !== this.state.currentUserId
    ).map((p) => ({
      id: p.id,
      name: p.name.replace(" (You)", ""),
      avatarUrl: p.avatarUrl,
      isAlive: p.isAlive,
      isSelectable: p.isAlive,
    }));
  }

  // Action: Select target
  public selectTarget(targetId: string) {
    if (this.state.isSubmitted || this.state.currentRole === "faithful") return;
    this.updateState({ selectedTargetId: targetId });
  }

  // Action: Submit Night Action
  public async submitAction(): Promise<{ success: boolean; message: string }> {
    if (!this.state.selectedTargetId && this.state.currentRole !== "faithful") {
      return { success: false, message: "Please select a target first." };
    }

    const target = this.getEligibleTargets().find(
      (t) => t.id === this.state.selectedTargetId
    );

    const targetName = target ? target.name : null;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiUrl}/api/v1/game/${this.state.roomCode}/night-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: this.state.currentUserId,
          roundNumber: this.state.roundNumber,
          role: this.state.currentRole,
          targetId: this.state.selectedTargetId,
        }),
      });
    } catch {
      // Backend action endpoint is in standby
    }

    this.updateState({
      isSubmitted: true,
      submittedTargetName: targetName,
    });

    return {
      success: true,
      message: "Action recorded successfully.",
    };
  }

  // Demo simulation: Switch role preview
  public switchRole(newRole: GameRole) {
    const targets = INITIAL_DISCUSSION_PLAYERS.filter(
      (p) => p.id !== this.state.currentUserId
    );
    this.updateState({
      currentRole: newRole,
      selectedTargetId: newRole === "faithful" ? null : targets[3].id, // default to Riya
      isSubmitted: false,
      submittedTargetName: null,
    });
  }

  public resetAction() {
    this.updateState({
      isSubmitted: false,
      submittedTargetName: null,
    });
  }

  public resetTimer() {
    this.updateState({ timerSeconds: 30 });
  }

  public destroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
