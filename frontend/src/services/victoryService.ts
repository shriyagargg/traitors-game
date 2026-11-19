import {
  VictoryState,
  VictoryOutcome,
  RevealedPlayer,
} from "@/types/victory";
import { getApiBaseUrl } from "./rooms";
import { getPlayerSession } from "./playerSession";

export class VictoryService {
  private state: VictoryState;
  private listeners: Set<(state: VictoryState) => void> = new Set();

  constructor(roomCode = "", initialOutcome: VictoryOutcome = "FAITHFUL_VICTORY") {
    this.state = {
      roomCode: roomCode.toUpperCase(),
      outcome: initialOutcome,
      winningFaction: initialOutcome === "FAITHFUL_VICTORY" ? "The Faithful" : "The Traitors",
      prizePool: "",
      roundsPlayed: 0,
      architectVerdict: "The game has ended.",
      revealedPlayers: [],
      stats: [],
      connectionStatus: "disconnected",
    };

    this.fetchVictoryData();
  }

  private async fetchVictoryData() {
    if (typeof window === "undefined") return;
    const session = getPlayerSession(this.state.roomCode);
    const apiUrl = getApiBaseUrl();

    try {
      const res = await fetch(
        `${apiUrl}/api/v1/game/${this.state.roomCode}/state?player_id=${session.id}&token=${encodeURIComponent(session.token || "")}&account_token=${encodeURIComponent(session.accountToken || "")}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.players) {
          const mapped: RevealedPlayer[] = data.players.map((p: any) => ({
            id: p.id,
            name: p.name,
            avatarUrl: p.avatar_url || p.avatarUrl || "",
            role: p.role,
            isTraitor: p.role === "Traitor",
            status: p.status === "ALIVE" ? "SURVIVED" : p.status,
            statusRoundText: p.status_round || (p.status === "ALIVE" ? "Survived" : p.status),
            isCurrentUser: p.id === session.id,
          }));

          const outcome: VictoryOutcome =
            data.outcome === "TRAITOR_VICTORY" ? "TRAITOR_VICTORY" : "FAITHFUL_VICTORY";
          const eliminatedTraitors = mapped.filter((player) => player.isTraitor && player.status !== "SURVIVED").length;
          const survivingFaithful = mapped.filter((player) => !player.isTraitor && player.status === "SURVIVED").length;
          const banishments = mapped.filter((player) => player.status === "BANISHED").length;
          const murders = mapped.filter((player) => player.status === "MURDERED").length;

          this.updateState({
            revealedPlayers: mapped,
            roundsPlayed: data.round_number || this.state.roundsPlayed,
            outcome: outcome,
            winningFaction: outcome === "FAITHFUL_VICTORY" ? "The Faithful" : "The Traitors",
            architectVerdict: outcome === "FAITHFUL_VICTORY"
              ? "The Faithful uncovered every Traitor. The council is safe."
              : "The Traitors survived the council and claimed the game.",
            stats: [
              { label: "Traitors Eliminated", value: eliminatedTraitors },
              { label: "Faithful Survived", value: survivingFaithful },
              { label: "Total Banishments", value: banishments },
              { label: "Total Murders", value: murders },
            ],
            connectionStatus: "connected",
          });
        }
      }
    } catch {
      // offline fallback
    }
  }

  public getState(): VictoryState {
    return this.state;
  }

  public subscribe(listener: (state: VictoryState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<VictoryState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((cb) => cb(this.state));
  }

  public destroy() {
    this.listeners.clear();
  }

}
