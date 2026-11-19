/**
 * Persistent Player Session for Multiplayer Gameplay
 * Separates user account identity from per-room player session tokens.
 */

export interface PlayerSession {
  id: string;
  name: string;
  avatarUrl: string;
  token?: string;
  accountToken?: string;
  email?: string;
}

const STORAGE_KEY = "agy_player_session";
const ROOM_SESSIONS_KEY = "agy_room_sessions";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") return "http://localhost:8000";
    return "";
  }
  return "http://localhost:8000";
}

/**
 * Returns the current authenticated account session.
 */
export function getAccountSession(): PlayerSession {
  if (!isBrowser()) {
    return { id: "", name: "", avatarUrl: "" };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.id && parsed.name) {
        return parsed;
      }
    }
  } catch {}
  return { id: "", name: "", avatarUrl: "" };
}

/**
 * Returns player session for a specific room, or falls back to the account session.
 */
export function getPlayerSession(roomCode?: string): PlayerSession {
  if (!isBrowser()) {
    return { id: "", name: "", avatarUrl: "" };
  }

  const account = getAccountSession();

  try {
    if (roomCode) {
      const code = roomCode.toUpperCase();
      const savedRooms = JSON.parse(localStorage.getItem(ROOM_SESSIONS_KEY) || "{}");
      const roomSession = savedRooms[code];
      if (roomSession?.id && roomSession?.token) {
        return {
          ...roomSession,
          accountToken: roomSession.accountToken || account.accountToken,
          email: roomSession.email || account.email,
        };
      }
    }
  } catch {}

  return account;
}

/**
 * Saves the authenticated account session.
 */
export function saveAccountSession(
  user: { id: string; username: string; email: string; avatar_url?: string },
  accountToken: string
): PlayerSession {
  const session: PlayerSession = {
    id: user.id,
    name: user.username,
    email: user.email,
    avatarUrl: user.avatar_url || "",
    accountToken,
  };
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
  return session;
}

/**
 * Saves a player session specifically for a room.
 */
export function saveRoomSession(roomCode: string, session: PlayerSession): PlayerSession {
  if (!isBrowser()) return session;
  try {
    const code = roomCode.toUpperCase();
    const rooms = JSON.parse(localStorage.getItem(ROOM_SESSIONS_KEY) || "{}");
    rooms[code] = session;
    localStorage.setItem(ROOM_SESSIONS_KEY, JSON.stringify(rooms));
  } catch {}
  return session;
}

/**
 * Clears player sessions (on logout).
 */
export function clearPlayerSession() {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ROOM_SESSIONS_KEY);
}

/**
 * Updates player session. If roomCode is provided, saves to ROOM_SESSIONS_KEY.
 */
export function setPlayerSession(
  name: string,
  avatarUrl: string = "",
  customId?: string,
  token?: string,
  roomCode?: string,
  userId?: string,
  accountToken?: string
): PlayerSession {
  const account = getAccountSession();
  const cleanName = name.trim() || account.name;

  const session: PlayerSession = {
    id: customId || account.id,
    name: cleanName,
    avatarUrl: avatarUrl || account.avatarUrl,
    token: token,
    accountToken: accountToken || account.accountToken,
    email: account.email,
  };

  if (isBrowser()) {
    try {
      if (roomCode && token) {
        saveRoomSession(roomCode, session);
      }
      // If we don't have an active account session yet, or this is an account update
      if (!account.id || (userId && userId === account.id)) {
        const updatedAccount: PlayerSession = {
          id: userId || account.id || session.id,
          name: cleanName,
          avatarUrl: avatarUrl || account.avatarUrl,
          accountToken: accountToken || account.accountToken,
          email: account.email,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAccount));
      }
    } catch {}
  }

  return session;
}

/**
 * Ensures the player has a valid room session token for a given room.
 * If not present in localStorage, contacts the backend join endpoint using the user's account token.
 */
export async function ensureRoomSession(roomCode: string): Promise<PlayerSession> {
  const code = roomCode.toUpperCase();
  const existing = getPlayerSession(code);
  if (existing.token && existing.id) {
    return existing;
  }

  const account = getAccountSession();
  if (!account.accountToken) {
    return existing;
  }

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/game/${code}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${account.accountToken}`,
      },
      body: JSON.stringify({}),
    });

    if (res.ok) {
      const data = await res.json();
      const playerId = data.player_id || data.playerId;
      const sessionToken = data.session_token || data.sessionToken;

      if (playerId && sessionToken) {
        const newSession: PlayerSession = {
          id: playerId,
          name: account.name,
          avatarUrl: account.avatarUrl,
          token: sessionToken,
          accountToken: account.accountToken,
          email: account.email,
        };
        saveRoomSession(code, newSession);
        return newSession;
      }
    }
  } catch {}

  return existing;
}

/**
 * Returns the authenticated account session, if one exists.
 */
