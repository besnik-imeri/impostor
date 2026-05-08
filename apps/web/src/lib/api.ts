import type {
  AvatarId,
  PlayerColor,
  PrivatePlayerSnapshot,
  PublicRoomSnapshot,
  RoomConfig
} from "@imposter/domain";

export interface CreateRoomInput {
  host: {
    nickname: string;
    avatar: AvatarId;
    color: PlayerColor;
  };
  config: Partial<RoomConfig>;
}

export interface JoinRoomInput {
  nickname: string;
  avatar: AvatarId;
  color: PlayerColor;
}

export interface RoomSessionResponse {
  room: PublicRoomSnapshot;
  player: PrivatePlayerSnapshot;
  token: string;
}

export type ClientCommand =
  | { type: "player.ready.set"; requestId?: string; payload: { ready: boolean } }
  | { type: "host.game.start"; requestId?: string; payload?: Record<string, never> }
  | { type: "player.suspect.create"; requestId?: string; payload: { targetPlayerId: string } }
  | { type: "player.accuse.create"; requestId?: string; payload: { accusedPlayerId: string } }
  | { type: "host.player.kick"; requestId?: string; payload: { targetPlayerId: string } }
  | { type: "host.room.cancel"; requestId?: string; payload?: Record<string, never> }
  | { type: "client.heartbeat"; requestId?: string; payload?: Record<string, never> };

export type ServerEvent =
  | { type: "room.snapshot"; payload: PublicRoomSnapshot }
  | { type: "private.snapshot"; payload: PrivatePlayerSnapshot }
  | { type: "phase.changed"; payload: { phase: PublicRoomSnapshot["phase"] } }
  | { type: "player.joined"; payload: { playerId: string } }
  | { type: "player.left"; payload: { playerId: string } }
  | {
      type: "round.resolved";
      payload: NonNullable<NonNullable<PublicRoomSnapshot["currentRound"]>["resolution"]>;
    }
  | { type: "game.finished"; payload: PublicRoomSnapshot }
  | {
      type: "command.rejected";
      requestId?: string;
      payload: { code: string; message: string };
    };

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "" : "");

export async function createRoom(input: CreateRoomInput): Promise<RoomSessionResponse> {
  return postJson("/api/rooms", input);
}

export async function joinRoom(code: string, input: JoinRoomInput): Promise<RoomSessionResponse> {
  return postJson(`/api/rooms/${code.trim().toUpperCase()}/join`, input);
}

export function createRoomSocket(code: string, token: string): WebSocket {
  const base = API_BASE_URL || window.location.origin;
  const url = new URL(`/api/rooms/${code}/socket`, base);
  url.searchParams.set("token", token);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return new WebSocket(url);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    const errorBody = payload as { message?: string; error?: string };
    throw new Error(errorBody.message ?? errorBody.error ?? "Request failed.");
  }

  return payload as T;
}
