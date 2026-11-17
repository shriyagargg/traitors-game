import {
  VotingResultsState,
  VoteTallyItem,
  BanishedPlayer,
  GameOutcomeStatus,
} from "@/types/votingResults";
import { getApiBaseUrl, getWsBaseUrl } from "./rooms";
import { getPlayerSession } from "./playerSession";

export class VotingResultsService {
  private state: VotingResultsState;
  private listeners: Set<(state: VotingResultsState) => void> = new Set();
  private socket: WebSocket | null = null;
  private disposed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(roomCode = "A7K4D9", roundNumber = 1) {
    this.state = {
      roomCode: roomCode.toUpperCase(),
      roundNumber: roundNumber,
      phaseType: "Results",
      totalVotes: 0,
      tallies: [],
      banishedPlayer: null,
      isRoleRevealed: false,
      gameOutcome: "CONTINUE_TO_NIGHT",
      traitorsRemaining: 1,
      faithfulRemaining: 3,
      connectionStatus: "mock_preview",
    };

    this.fetchInitialState();
    this.initWebSocket();
  }

  private async fetchInitialState() {
    if (typeof window === "undefined") return;
    const session = getPlayerSession(this.state.roomCode);
    const apiUrl = getApiBaseUrl();

    try {
      const res = await fetch(
        `${apiUrl}/api/v1/game/${this.state.roomCode}/state?player_id=${session.id}&token=${encodeURIComponent(session.token || "")}`
      );
      if (res.ok) {
        const data = await res.json();
        this.syncState(data);
      }
    } catch {
      // Offline fallback
    }
  }

  private syncState(data: any) {
    if (!data) return;

    let banished: BanishedPlayer | null = null;
    if (data.banished_player_id && data.players) {
      const p = data.players.find((pl: any) => pl.id === data.banished_player_id);
      if (p) {
        const isTraitor = p.role === "Traitor";
        banished = {
          id: p.id,
          name: p.name,
          avatarUrl: p.avatar_url || p.avatarUrl || "/images/player_shubh.png",
          votesReceived: (data.vote_tally || []).find((t: any) => t.target_id === p.id)?.votes_count || 0,
          totalVotesCast: data.total_votes_cast || 0,
          role: isTraitor ? "Traitor" : "Faithful",
          isTraitor: isTraitor,
          confession: isTraitor
            ? `I walked among you in the shadows of this chamber. I confess: I am a TRAITOR.`
            : `You have condemned an innocent soul. I was and remain a FAITHFUL.`,
        };
      }
    }

    let outcome: GameOutcomeStatus = "CONTINUE_TO_NIGHT";
    if (data.outcome === "FAITHFUL_VICTORY") outcome = "FAITHFUL_VICTORY";
    else if (data.outcome === "TRAITOR_VICTORY") outcome = "TRAITOR_VICTORY";

    this.updateState({
      roundNumber: data.round_number || this.state.roundNumber,
      banishedPlayer: banished,
      totalVotes: data.total_votes_cast || 0,
      tallies: (data.vote_tally || []).map((t: any) => {
        const target = data.players?.find((player: any) => player.id === t.target_id);
        return {
          targetId: t.target_id,
          targetName: t.target_name,
          targetAvatarUrl: target?.avatar_url || "/images/player_somya.png",
          votesCount: t.votes_count,
          percentage: t.percentage,
          isBanished: t.target_id === data.banished_player_id,
          voters: [], // Individual ballots remain private.
        };
      }),
      gameOutcome: outcome,
      connectionStatus: "connected",
    });
  }

  private initWebSocket() {
    if (typeof window === "undefined") return;
    const session = getPlayerSession(this.state.roomCode);
    const wsUrl = `${getWsBaseUrl()}/api/v1/ws/game/${this.state.roomCode}?player_id=${session.id}&token=${encodeURIComponent(session.token || "")}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        this.socket = ws;
        this.updateState({ connectionStatus: "connected" });
      };

      ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          if (packet.type === "INITIAL_SYNC" && packet.payload) {
            this.syncState(packet.payload);
          } else if (packet.type === "PHASE_CHANGED" && packet.payload) {
            this.syncState(packet.payload);
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
        if (!this.disposed) {
          this.reconnectTimer = setTimeout(() => this.initWebSocket(), 1500);
        }
      };
    } catch {
      this.updateState({ connectionStatus: "mock_preview" });
    }
  }

  public getState(): VotingResultsState {
    return this.state;
  }

  public subscribe(listener: (state: VotingResultsState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<VotingResultsState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((cb) => cb(this.state));
  }

  public revealAllegiance() {
    this.updateState({ isRoleRevealed: true });
  }

  public hideAllegiance() {
    this.updateState({ isRoleRevealed: false });
  }

  public destroy() {
    this.disposed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
