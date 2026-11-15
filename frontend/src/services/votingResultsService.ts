import {
  VotingResultsState,
  VoteTallyItem,
  BanishedPlayer,
  GameOutcomeStatus,
  PlayerRole,
} from "@/types/votingResults";

export const INITIAL_TALLIES: VoteTallyItem[] = [
  {
    targetId: "p_shubh",
    targetName: "Shubh",
    targetAvatarUrl: "/images/player_shubh.png",
    votesCount: 4,
    percentage: 67,
    isBanished: true,
    voters: [
      { id: "p_somya", name: "Somya (You)", avatarUrl: "/images/player_somya.png" },
      { id: "p_pari", name: "Pari", avatarUrl: "/images/player_pari.png" },
      { id: "p_riya", name: "Riya", avatarUrl: "/images/player_riya.png" },
      { id: "p_vivaan", name: "Vivaan", avatarUrl: "/images/player_vivaan.png" },
    ],
  },
  {
    targetId: "p_pari",
    targetName: "Pari",
    targetAvatarUrl: "/images/player_pari.png",
    votesCount: 1,
    percentage: 16.5,
    isBanished: false,
    voters: [
      { id: "p_shubh", name: "Shubh", avatarUrl: "/images/player_shubh.png" },
    ],
  },
  {
    targetId: "p_vivaan",
    targetName: "Vivaan",
    targetAvatarUrl: "/images/player_vivaan.png",
    votesCount: 1,
    percentage: 16.5,
    isBanished: false,
    voters: [
      { id: "p_ishita", name: "Ishita", avatarUrl: "/images/player_ishita.png" },
    ],
  },
];

export const INITIAL_BANISHED_PLAYER: BanishedPlayer = {
  id: "p_shubh",
  name: "Shubh",
  avatarUrl: "/images/player_shubh.png",
  votesReceived: 4,
  totalVotesCast: 6,
  role: "Traitor",
  isTraitor: true,
  confession:
    "I walked among you in the shadows of this castle... and I can now confess: I am a TRAITOR.",
};

export class VotingResultsService {
  private state: VotingResultsState;
  private listeners: Set<(state: VotingResultsState) => void> = new Set();
  private socket: WebSocket | null = null;

  constructor(roomCode = "A7K4D9", roundNumber = 2) {
    this.state = {
      roomCode: roomCode.toUpperCase(),
      roundNumber: roundNumber,
      phaseType: "Results",
      totalVotes: 6,
      tallies: INITIAL_TALLIES,
      banishedPlayer: INITIAL_BANISHED_PLAYER,
      isRoleRevealed: false,
      gameOutcome: "CONTINUE_TO_NIGHT",
      traitorsRemaining: 1,
      faithfulRemaining: 4,
      connectionStatus: "mock_preview",
    };

    this.initWebSocket(roomCode);
  }

  private initWebSocket(roomCode: string) {
    if (typeof window === "undefined") return;

    try {
      const wsUrl =
        process.env.NEXT_PUBLIC_WS_URL ||
        `ws://localhost:8000/api/v1/ws/game/${roomCode}/voting-results`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        this.socket = ws;
        this.updateState({ connectionStatus: "connected" });
      };

      ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          if (packet.type === "VOTING_RESULTS_UPDATE" && packet.payload) {
            this.updateState({ ...packet.payload });
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

  public setRoleDemo(role: PlayerRole) {
    const isTraitor = role === "Traitor";
    const confession = isTraitor
      ? "I walked among you in the shadows of this castle... and I can now confess: I am a TRAITOR."
      : "You have banished an innocent brother. I was, and always will be, a FAITHFUL.";

    const traitorsRemaining = isTraitor ? 1 : 2;
    const faithfulRemaining = isTraitor ? 4 : 3;

    this.updateState({
      banishedPlayer: {
        ...this.state.banishedPlayer,
        role: role,
        isTraitor: isTraitor,
        confession: confession,
      },
      traitorsRemaining,
      faithfulRemaining,
    });
  }

  public setOutcomeDemo(outcome: GameOutcomeStatus) {
    this.updateState({ gameOutcome: outcome });
  }

  public destroy() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

