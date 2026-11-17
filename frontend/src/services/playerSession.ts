/**
 * Persistent Player Session for Multiplayer Gameplay
 * Stores player identity across all phases and browser refreshes.
 */

export interface PlayerSession {
  id: string;
  name: string;
  avatarUrl: string;
  token?: string;
}

const STORAGE_KEY = "agy_player_session";
const ROOM_SESSIONS_KEY = "agy_room_sessions";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getPlayerSession(roomCode?: string): PlayerSession {
  if (!isBrowser()) {
    return {
      id: "p_guest",
      name: "Guest",
      avatarUrl: "/images/player_somya.png",
    };
  }

  try {
    if (roomCode) {
      const savedRooms = JSON.parse(localStorage.getItem(ROOM_SESSIONS_KEY) || "{}");
      const roomSession = savedRooms[roomCode.toUpperCase()];
      if (roomSession?.id && roomSession?.name && roomSession?.token) return roomSession;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.id && parsed.name) {
        return parsed;
      }
    }
  } catch {
    // ignore parse error
  }

  // Generate new anonymous identity if none exists
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newSession: PlayerSession = {
    id: `p_player_${randomSuffix}`,
    name: `Player_${randomSuffix}`,
    avatarUrl: "/images/player_somya.png",
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
  } catch {
    // ignore
  }

  return newSession;
}

export function setPlayerSession(
  name: string,
  avatarUrl: string = "/images/player_somya.png",
  customId?: string,
  token?: string,
  roomCode?: string
): PlayerSession {
  const current = getPlayerSession();
  const cleanName = name.trim() || current.name;
  const id = customId || current.id || `p_${cleanName.toLowerCase().replace(/\s+/g, "_")}`;

  const session: PlayerSession = {
    id,
    name: cleanName,
    avatarUrl: avatarUrl || current.avatarUrl,
    token: token || current.token,
  };

  if (isBrowser()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      if (roomCode && session.token) {
        const rooms = JSON.parse(localStorage.getItem(ROOM_SESSIONS_KEY) || "{}");
        rooms[roomCode.toUpperCase()] = session;
        localStorage.setItem(ROOM_SESSIONS_KEY, JSON.stringify(rooms));
      }
    } catch {
      // ignore
    }
  }

  return session;
}
