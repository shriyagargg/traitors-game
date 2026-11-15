/**
 * gameStateStore.ts
 * Lightweight localStorage-backed store for cross-page game state.
 * Keeps round number, eliminated players, and player role in sync
 * as the game loop progresses: Discussion → Voting → Results → Night → Morning → Discussion.
 */

export interface GameState {
  roomCode: string;
  roundNumber: number;
  currentRole: "traitor" | "doctor" | "detective" | "faithful";
  eliminatedPlayerIds: string[];
  lastMorningAnnouncement: string | null;
  lastArchitectHint: string | null;
  gameOutcome: "CONTINUE_TO_NIGHT" | "FAITHFUL_VICTORY" | "TRAITOR_VICTORY";
}

const STORAGE_KEY = "agy_traitors_game_state";

const DEFAULT_STATE: GameState = {
  roomCode: "A7K4D9",
  roundNumber: 2,
  currentRole: "traitor",
  eliminatedPlayerIds: [],
  lastMorningAnnouncement: null,
  lastArchitectHint: null,
  gameOutcome: "CONTINUE_TO_NIGHT",
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadGameState(roomCode?: string): GameState {
  if (!isBrowser()) return { ...DEFAULT_STATE, roomCode: roomCode || DEFAULT_STATE.roomCode };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, roomCode: roomCode || DEFAULT_STATE.roomCode };
    const parsed: GameState = JSON.parse(raw);
    // If a specific room is requested and doesn't match, return defaults for that room
    if (roomCode && parsed.roomCode !== roomCode.toUpperCase()) {
      return { ...DEFAULT_STATE, roomCode: roomCode.toUpperCase() };
    }
    return parsed;
  } catch {
    return { ...DEFAULT_STATE, roomCode: roomCode || DEFAULT_STATE.roomCode };
  }
}

export function saveGameState(partial: Partial<GameState>): GameState {
  if (!isBrowser()) return { ...DEFAULT_STATE, ...partial };
  const current = loadGameState();
  const updated: GameState = { ...current, ...partial };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // quota exceeded or private mode — silently fail
  }
  return updated;
}

export function advanceRound(): GameState {
  const current = loadGameState();
  return saveGameState({ roundNumber: current.roundNumber + 1 });
}

export function markPlayerEliminated(playerId: string): GameState {
  const current = loadGameState();
  const ids = Array.from(new Set([...current.eliminatedPlayerIds, playerId]));
  return saveGameState({ eliminatedPlayerIds: ids });
}

export function resetGameState(roomCode: string): GameState {
  const fresh: GameState = { ...DEFAULT_STATE, roomCode: roomCode.toUpperCase() };
  if (isBrowser()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch { /* ignore */ }
  }
  return fresh;
}

