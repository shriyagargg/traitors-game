import {
  DiscussionPlayer,
  DiscussionMessage,
  ArchitectAnnouncement,
  DiscussionState,
} from "@/types/discussion";

export const INITIAL_DISCUSSION_PLAYERS: DiscussionPlayer[] = [
  {
    id: "p_somya",
    name: "Somya (You)",
    avatarUrl: "/images/player_somya.png",
    isAlive: true,
    isHost: true,
    isCurrentUser: true,
    isMuted: false,
  },
  {
    id: "p_shubh",
    name: "Shubh",
    avatarUrl: "/images/player_shubh.png",
    isAlive: true,
    isHost: false,
    isCurrentUser: false,
    isMuted: false,
  },
  {
    id: "p_pari",
    name: "Pari",
    avatarUrl: "/images/player_pari.png",
    isAlive: true,
    isHost: false,
    isCurrentUser: false,
    isMuted: false,
  },
  {
    id: "p_arnav",
    name: "Arnav",
    avatarUrl: "/images/player_arnav.png",
    isAlive: true,
    isHost: false,
    isCurrentUser: false,
    isMuted: false,
  },
  {
    id: "p_riya",
    name: "Riya",
    avatarUrl: "/images/player_riya.png",
    isAlive: true,
    isHost: false,
    isCurrentUser: false,
    isMuted: false,
  },
  {
    id: "p_vivaan",
    name: "Vivaan",
    avatarUrl: "/images/player_vivaan.png",
    isAlive: true,
    isHost: false,
    isCurrentUser: false,
    isMuted: false,
  },
  {
    id: "p_ishita",
    name: "Ishita",
    avatarUrl: "/images/player_ishita.png",
    isAlive: true,
    isHost: false,
    isCurrentUser: false,
    isMuted: false,
  },
  {
    id: "p_kabir",
    name: "Kabir",
    avatarUrl: "/images/player_kabir.png",
    isAlive: true,
    isHost: false,
    isCurrentUser: false,
    isMuted: false,
  },
];

export const INITIAL_DISCUSSION_MESSAGES: DiscussionMessage[] = [
  {
    id: "dm_1",
    senderId: "p_shubh",
    senderName: "Shubh",
    avatarUrl: "/images/player_shubh.png",
    timestamp: "10:24 AM",
    text: "That's interesting... someone definitely tried something last night.",
  },
  {
    id: "dm_2",
    senderId: "p_pari",
    senderName: "Pari",
    avatarUrl: "/images/player_pari.png",
    timestamp: "10:25 AM",
    text: "I feel like Kabir has been way too quiet since the last round.",
  },
  {
    id: "dm_3",
    senderId: "p_kabir",
    senderName: "Kabir",
    avatarUrl: "/images/player_kabir.png",
    timestamp: "10:25 AM",
    text: "That's not fair. I was just listening. Doesn't make me a Traitor.",
  },
  {
    id: "dm_4",
    senderId: "p_riya",
    senderName: "Riya",
    avatarUrl: "/images/player_riya.png",
    timestamp: "10:26 AM",
    text: "Shubh, why are you so sure something happened? Do you have any reason?",
  },
  {
    id: "dm_5",
    senderId: "p_vivaan",
    senderName: "Vivaan",
    avatarUrl: "/images/player_vivaan.png",
    timestamp: "10:27 AM",
    text: "I think we should focus on voting out someone who's been inconsistent.",
  },
];

export const INITIAL_ARCHITECT_ANNOUNCEMENT: ArchitectAnnouncement = {
  id: "ann_round_2",
  title: "The Architect",
  message:
    "The night has ended. No player was eliminated. Now, discuss and decide who seems suspicious.",
};

export class DiscussionService {
  private state: DiscussionState;
  private listeners: Set<(state: DiscussionState) => void> = new Set();
  private timerInterval: NodeJS.Timeout | null = null;
  private socket: WebSocket | null = null;

  constructor(roomCode = "A7K4D9", roundNumber = 2) {
    this.state = {
      roomCode: roomCode.toUpperCase(),
      roundNumber: roundNumber,
      phaseName: "Discussion",
      phaseType: "Day",
      timerSeconds: 168, // 02:48 as shown in mockup
      announcement: { ...INITIAL_ARCHITECT_ANNOUNCEMENT },
      players: [...INITIAL_DISCUSSION_PLAYERS],
      messages: [...INITIAL_DISCUSSION_MESSAGES],
      connectionStatus: "mock_preview",
    };

    this.startCountdown();
    this.initWebSocket(roomCode);
    this.fetchArchitectHint(roomCode, roundNumber);
  }

  private async fetchArchitectHint(roomCode: string, roundNumber: number) {
    if (typeof window === "undefined") return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/game/${roomCode}/architect-hint`);
      if (!res.ok) throw new Error("hint endpoint unavailable");
      const data = await res.json();
      const hint: string = data.hint || "";
      if (!hint) return;

      // Inject Architect hint as a system message at the top of the chat
      const hintMsg = {
        id: `msg_architect_hint_${roundNumber}`,
        senderId: "architect",
        senderName: "The Architect",
        avatarUrl: "/images/architect_avatar.png",
        timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        text: `🔮 ${hint}`,
        isArchitect: true,
      };
      this.updateState({
        messages: [hintMsg, ...this.state.messages],
        announcement: {
          ...this.state.announcement,
          message: hint,
        },
      });
    } catch {
      // Backend not running — keep the static mock announcement, no problem
    }
  }

  private initWebSocket(roomCode: string) {
    if (typeof window === "undefined") return;

    try {
      const wsUrl =
        process.env.NEXT_PUBLIC_WS_URL ||
        `ws://localhost:8000/api/v1/ws/game/${roomCode}/discussion`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        this.socket = ws;
        this.updateState({ connectionStatus: "connected" });
      };

      ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          if (packet.type === "DISCUSSION_MESSAGE" && packet.payload) {
            this.updateState({
              messages: [...this.state.messages, packet.payload],
            });
          }
        } catch {
          // ignore malformed packets
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
        const nextSec = this.state.timerSeconds - 1;
        this.updateState({
          timerSeconds: nextSec,
          isTimeUp: nextSec === 0,
        });
      } else {
        this.updateState({ isTimeUp: true });
      }
    }, 1000);
  }

  public fastForward() {
    this.updateState({ timerSeconds: 0, isTimeUp: true });
  }

  public getState(): DiscussionState {
    return this.state;
  }

  public subscribe(listener: (state: DiscussionState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<DiscussionState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((cb) => cb(this.state));
  }

  public sendMessage(text: string) {
    const clean = text.trim();
    if (!clean) return;

    const currentUser =
      this.state.players.find((p) => p.isCurrentUser) || this.state.players[0];

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    const newMsg: DiscussionMessage = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      senderName: "Somya",
      avatarUrl: currentUser.avatarUrl,
      timestamp: timeStr,
      text: clean,
    };

    this.updateState({
      messages: [...this.state.messages, newMsg],
    });

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: "DISCUSSION_MESSAGE",
          payload: newMsg,
        })
      );
    }

    // Simulate realistic social deduction reply from another living council member
    setTimeout(() => {
      const livingOthers = this.state.players.filter(
        (p) => p.isAlive && !p.isCurrentUser
      );
      if (livingOthers.length === 0) return;

      const responder =
        livingOthers[Math.floor(Math.random() * livingOthers.length)];
      const replies = [
        "I hear you, Somya, but we need hard proof before we rush into a vote.",
        "Notice who has been deflecting the conversation since morning. It's telling.",
        "That makes a lot of sense. Arnav was targeted for a reason last night.",
        "We only have a few minutes before the ballot opens. Let's make this count.",
        "I'm watching the quieter players closely today. Silence speaks volumes.",
        "Whoever is responsible for the night murder is trying to divide the council.",
        "I agree with that. The Traitors are definitely trying to steer the vote.",
      ];
      const replyText = replies[Math.floor(Math.random() * replies.length)];
      const replyTime = new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });

      const replyMsg: DiscussionMessage = {
        id: `msg_ai_${Date.now()}`,
        senderId: responder.id,
        senderName: responder.name.replace(" (You)", ""),
        avatarUrl: responder.avatarUrl,
        timestamp: replyTime,
        text: replyText,
      };

      this.updateState({
        messages: [...this.state.messages, replyMsg],
      });
    }, 1200);
  }

  // Demo simulation helper: Toggle player alive/eliminated
  public togglePlayerStatus(playerId: string) {
    const updated = this.state.players.map((p) =>
      p.id === playerId ? { ...p, isAlive: !p.isAlive } : p
    );
    this.updateState({ players: updated });
  }

  public resetTimer() {
    this.updateState({ timerSeconds: 168 });
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
