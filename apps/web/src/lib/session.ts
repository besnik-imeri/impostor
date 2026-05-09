import type { RoomSessionResponse } from "./api";

const STORAGE_KEY = "impostor.room-session";

export interface StoredRoomSession {
  code: string;
  token: string;
  playerId: string;
}

export function storeRoomSession(session: RoomSessionResponse): void {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      code: session.room.code,
      token: session.token,
      playerId: session.player.playerId
    } satisfies StoredRoomSession)
  );
}

export function readStoredRoomSession(): StoredRoomSession | undefined {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as StoredRoomSession;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return undefined;
  }
}

export function clearStoredRoomSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
