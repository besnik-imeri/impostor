import type {
  AvatarId,
  PlayerColor,
  PrivatePlayerSnapshot,
  PublicRoomSnapshot,
  RoomConfig
} from "@imposter/domain";

export interface Env {
  ROOMS: DurableObjectNamespace;
  TOKEN_SECRET?: string;
  ALLOWED_ORIGIN?: string;
  ROOM_IDLE_TTL_SECONDS?: string;
}

export interface CreateRoomRequest {
  host: {
    nickname: string;
    avatar: AvatarId;
    color: PlayerColor;
  };
  config: Partial<RoomConfig>;
}

export interface JoinRoomRequest {
  nickname: string;
  avatar: AvatarId;
  color: PlayerColor;
}

export interface CreateRoomDurableRequest extends CreateRoomRequest {
  code: string;
  hostPlayerId: string;
}

export interface JoinRoomDurableRequest extends JoinRoomRequest {
  playerId: string;
}

export type ClientCommand =
  | {
      type: "player.ready.set";
      requestId?: string;
      payload: { ready: boolean };
    }
  | {
      type: "host.game.start";
      requestId?: string;
      payload?: Record<string, never>;
    }
  | {
      type: "player.suspect.create";
      requestId?: string;
      payload: { targetPlayerId: string };
    }
  | {
      type: "player.accuse.create";
      requestId?: string;
      payload: { accusedPlayerId: string };
    }
  | {
      type: "host.player.kick";
      requestId?: string;
      payload: { targetPlayerId: string };
    }
  | {
      type: "host.room.cancel";
      requestId?: string;
      payload?: Record<string, never>;
    }
  | {
      type: "client.heartbeat";
      requestId?: string;
      payload?: Record<string, never>;
    };

export type ServerEvent =
  | {
      type: "room.snapshot";
      payload: PublicRoomSnapshot;
    }
  | {
      type: "private.snapshot";
      payload: PrivatePlayerSnapshot;
    }
  | {
      type: "phase.changed";
      payload: { phase: PublicRoomSnapshot["phase"] };
    }
  | {
      type: "player.joined";
      payload: { playerId: string };
    }
  | {
      type: "player.left";
      payload: { playerId: string };
    }
  | {
      type: "round.resolved";
      payload: NonNullable<NonNullable<PublicRoomSnapshot["currentRound"]>["resolution"]>;
    }
  | {
      type: "game.finished";
      payload: PublicRoomSnapshot;
    }
  | {
      type: "command.rejected";
      requestId?: string;
      payload: { code: string; message: string };
    };

export interface SocketSession {
  playerId: string;
  isHost: boolean;
}
