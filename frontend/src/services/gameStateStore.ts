/** Optional client cache for transient UI details; authoritative game state lives on the server. */
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
const EMPTY: GameState = { roomCode: "", roundNumber: 0, currentRole: "faithful", eliminatedPlayerIds: [], lastMorningAnnouncement: null, lastArchitectHint: null, gameOutcome: "CONTINUE_TO_NIGHT" };
function browser() { return typeof window !== "undefined"; }
export function loadGameState(roomCode?: string): GameState {
 if (!browser()) return { ...EMPTY, roomCode: roomCode?.toUpperCase() || "" };
 try { const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as GameState | null;
  if (!parsed || (roomCode && parsed.roomCode !== roomCode.toUpperCase())) return { ...EMPTY, roomCode: roomCode?.toUpperCase() || "" };
  return parsed;
 } catch { return { ...EMPTY, roomCode: roomCode?.toUpperCase() || "" }; }
}
export function saveGameState(partial: Partial<GameState>): GameState {
 const updated = { ...loadGameState(partial.roomCode), ...partial };
 if (browser()) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {} }
 return updated;
}
export function advanceRound(): GameState { const state=loadGameState(); return saveGameState({ roundNumber: state.roundNumber + 1 }); }
export function markPlayerEliminated(playerId: string): GameState { return saveGameState({ eliminatedPlayerIds: [...new Set([...loadGameState().eliminatedPlayerIds, playerId])] }); }
export function resetGameState(roomCode: string): GameState { const state={...EMPTY, roomCode:roomCode.toUpperCase()}; if(browser()){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{}} return state; }
