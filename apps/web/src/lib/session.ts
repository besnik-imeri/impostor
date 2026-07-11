import type { RoomSessionResponse } from "./api";

const STORAGE_KEY = "impostor.room-session";

export interface StoredRoomSession {
  code: string;
  playerId: string;
}

export function storeRoomSession(session: RoomSessionResponse): void {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        code: session.room.code,
        playerId: session.player.playerId
      } satisfies StoredRoomSession)
    );
  } catch {
    // A missing sessionStorage entry should not block the live room connection.
  }
}

export function readStoredRoomSession(): StoredRoomSession | undefined {
  let raw: string | null;
  try {
    raw = sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return undefined;
  }

  if (!raw) {
    return undefined;
  }

  try {
    const session = JSON.parse(raw) as Partial<StoredRoomSession>;
    if (typeof session.code !== "string" || typeof session.playerId !== "string") {
      sessionStorage.removeItem(STORAGE_KEY);
      return undefined;
    }

    return {
      code: session.code,
      playerId: session.playerId
    };
  } catch {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
    return undefined;
  }
}

export function clearStoredRoomSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}
