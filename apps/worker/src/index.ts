import {
  GameRuleError,
  buildPrivateSnapshot,
  buildPublicSnapshot,
  cancelRoom,
  createAccusation,
  createPlayer,
  createRoomState,
  createSuspicion,
  joinRoom,
  kickPlayer,
  resolveTimerExpiry,
  setPlayerConnected,
  setPlayerReady,
  startNextRound
} from "@impostor/domain";
import type { RoomState } from "@impostor/domain";
import { emptyResponse, jsonResponse, readJson } from "./http";
import { createId, generateRoomCode } from "./ids";
import type {
  ClientCommand,
  CreateRoomDurableRequest,
  CreateRoomRequest,
  Env,
  JoinRoomDurableRequest,
  JoinRoomRequest,
  ServerEvent,
  SocketSession
} from "./protocol";
import { createRoomToken, verifyRoomToken } from "./tokens";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "room";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return emptyResponse(request, env, { status: 204 });
    }

    const url = new URL(request.url);
    const match = url.pathname.match(/^\/api\/rooms(?:\/([^/]+)(?:\/([^/]+))?)?$/u);

    if (!match) {
      return jsonResponse(request, env, { error: "Not found." }, { status: 404 });
    }

    try {
      const [, roomCode, action] = match;

      if (!roomCode && request.method === "POST") {
        return await createRoom(request, env);
      }

      if (roomCode && action === "join" && request.method === "POST") {
        return await joinExistingRoom(request, env, roomCode);
      }

      if (roomCode && action === "socket" && request.method === "GET") {
        return await forwardToRoom(request, env, roomCode);
      }

      return jsonResponse(request, env, { error: "Unsupported route." }, { status: 404 });
    } catch (error) {
      return jsonResponse(request, env, errorBody(error), {
        status: error instanceof GameRuleError ? 400 : 500
      });
    }
  }
};

export class RoomDurableObject {
  private room: RoomState | undefined;
  private schemaReady = false;

  constructor(
    private readonly ctx: DurableObjectState,
    private readonly env: Env
  ) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (request.method === "POST" && url.pathname === "/create") {
        const body = await readJson<CreateRoomDurableRequest>(request);
        const now = Date.now();
        const existing = await this.loadRoom();

        if (existing && existing.phase !== "cancelled") {
          return jsonResponse(
            request,
            this.env,
            { error: "Room code already exists." },
            { status: 409 }
          );
        }

        const host = createPlayer({
          id: body.hostPlayerId,
          nickname: body.host.nickname,
          avatar: body.host.avatar,
          color: body.host.color,
          isHost: true,
          now
        });
        this.room = createRoomState(body.code, host, body.config, now);
        await this.saveRoom();
        await this.scheduleAlarm();

        const token = await createRoomToken(
          {
            roomCode: body.code,
            playerId: host.id,
            isHost: true,
            iat: now,
            exp: now + TOKEN_TTL_MS
          },
          getTokenSecret(this.env)
        );

        return jsonResponse(request, this.env, {
          room: buildPublicSnapshot(this.room),
          player: buildPrivateSnapshot(this.room, host.id),
          token
        });
      }

      if (request.method === "POST" && url.pathname === "/join") {
        const body = await readJson<JoinRoomDurableRequest>(request);
        const now = Date.now();
        const room = await this.requireRoom();
        const player = createPlayer({
          id: body.playerId,
          nickname: body.nickname,
          avatar: body.avatar,
          color: body.color,
          now
        });
        this.room = joinRoom(room, player, now);
        await this.saveRoom();
        await this.broadcast({ type: "player.joined", payload: { playerId: player.id } });
        await this.broadcastSnapshots();

        const token = await createRoomToken(
          {
            roomCode: room.code,
            playerId: player.id,
            isHost: false,
            iat: now,
            exp: now + TOKEN_TTL_MS
          },
          getTokenSecret(this.env)
        );

        return jsonResponse(request, this.env, {
          room: buildPublicSnapshot(this.room),
          player: buildPrivateSnapshot(this.room, player.id),
          token
        });
      }

      if (request.method === "GET" && url.pathname === "/socket") {
        return await this.handleSocket(request);
      }

      return jsonResponse(request, this.env, { error: "Not found." }, { status: 404 });
    } catch (error) {
      return jsonResponse(request, this.env, errorBody(error), {
        status: error instanceof GameRuleError ? 400 : 500
      });
    }
  }

  async webSocketMessage(webSocket: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const session = webSocket.deserializeAttachment() as SocketSession | undefined;

    if (!session) {
      webSocket.close(1008, "Missing session.");
      return;
    }

    if (typeof message !== "string") {
      await this.sendTo(webSocket, {
        type: "command.rejected",
        payload: { code: "INVALID_MESSAGE", message: "Messages must be JSON strings." }
      });
      return;
    }

    let command: ClientCommand;
    try {
      command = JSON.parse(message) as ClientCommand;
    } catch {
      await this.sendTo(webSocket, {
        type: "command.rejected",
        payload: { code: "INVALID_JSON", message: "Command must be valid JSON." }
      });
      return;
    }

    try {
      const previousPhase = this.room?.phase;
      const previousRound = this.room?.rounds.find(
        (round) => round.id === this.room?.currentRoundId
      );
      const previousResolvedAt = previousRound?.resolution?.resolvedAt;
      await this.applyCommand(command, session);
      await this.saveRoom();
      await this.scheduleAlarm();

      const room = await this.requireRoom();
      if (previousPhase !== room.phase) {
        await this.broadcast({ type: "phase.changed", payload: { phase: room.phase } });
      }

      const currentRound = room.rounds.find((round) => round.id === room.currentRoundId);
      if (currentRound?.resolution && currentRound.resolution.resolvedAt !== previousResolvedAt) {
        await this.broadcast({ type: "round.resolved", payload: currentRound.resolution });
      }

      if (room.phase === "finished") {
        await this.broadcast({ type: "game.finished", payload: buildPublicSnapshot(room) });
      }

      await this.broadcastSnapshots();
    } catch (error) {
      await this.sendTo(webSocket, {
        type: "command.rejected",
        ...(command.requestId ? { requestId: command.requestId } : {}),
        payload: errorBody(error)
      });
    }
  }

  async webSocketClose(webSocket: WebSocket): Promise<void> {
    const session = webSocket.deserializeAttachment() as SocketSession | undefined;
    if (!session) {
      return;
    }

    const room = await this.loadRoom();
    if (!room) {
      return;
    }

    this.room = setPlayerConnected(room, session.playerId, false, Date.now());
    await this.saveRoom();
    await this.broadcast({ type: "player.left", payload: { playerId: session.playerId } });
    await this.broadcastSnapshots();
  }

  async alarm(): Promise<void> {
    const room = await this.loadRoom();
    if (!room) {
      return;
    }

    const now = Date.now();
    const currentRound = room.rounds.find((round) => round.id === room.currentRoundId);

    if (
      room.phase === "round" &&
      currentRound &&
      !currentRound.resolution &&
      now >= currentRound.endsAt
    ) {
      this.room = resolveTimerExpiry(room, now);
      await this.saveRoom();
      const resolvedRound = this.room.rounds.find(
        (round) => round.id === this.room?.currentRoundId
      );
      if (resolvedRound?.resolution) {
        await this.broadcast({ type: "round.resolved", payload: resolvedRound.resolution });
      }
      await this.broadcastSnapshots();
      await this.scheduleAlarm();
      return;
    }

    if (now - room.lastActiveAt >= this.idleTtlMs()) {
      this.ctx.storage.sql.exec("DELETE FROM room_state WHERE id = ?", STORAGE_KEY);
      this.room = undefined;
      return;
    }

    await this.scheduleAlarm();
  }

  private async handleSocket(request: Request): Promise<Response> {
    if (request.headers.get("upgrade") !== "websocket") {
      return jsonResponse(
        request,
        this.env,
        { error: "Expected WebSocket upgrade." },
        { status: 426 }
      );
    }

    const token = readToken(request);
    const payload = await verifyRoomToken(token, getTokenSecret(this.env));
    const room = await this.requireRoom();

    if (
      payload.roomCode !== room.code ||
      !room.players.some((player) => player.id === payload.playerId)
    ) {
      return jsonResponse(
        request,
        this.env,
        { error: "Token does not match this room." },
        { status: 403 }
      );
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    const session: SocketSession = {
      playerId: payload.playerId,
      isHost: payload.isHost
    };

    server.serializeAttachment(session);
    this.ctx.acceptWebSocket(server, [payload.playerId]);
    this.room = setPlayerConnected(room, payload.playerId, true, Date.now());
    await this.saveRoom();
    await this.sendTo(server, { type: "room.snapshot", payload: buildPublicSnapshot(this.room) });
    await this.sendTo(server, {
      type: "private.snapshot",
      payload: buildPrivateSnapshot(this.room, payload.playerId)
    });
    await this.broadcastSnapshots();

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  private async applyCommand(command: ClientCommand, session: SocketSession): Promise<void> {
    const room = await this.requireRoom();
    const now = Date.now();

    switch (command.type) {
      case "player.ready.set":
        this.room = setPlayerReady(room, session.playerId, Boolean(command.payload.ready), now);
        return;
      case "host.game.start":
        this.room = startNextRound(room, session.playerId, now, cryptoRandom);
        return;
      case "player.suspect.create":
        this.room = createSuspicion(room, session.playerId, command.payload.targetPlayerId, now);
        return;
      case "player.accuse.create":
        this.room = createAccusation(room, session.playerId, command.payload.accusedPlayerId, now);
        return;
      case "host.player.kick":
        this.room = kickPlayer(room, session.playerId, command.payload.targetPlayerId, now);
        return;
      case "host.room.cancel":
        this.room = cancelRoom(room, session.playerId, now);
        return;
      case "client.heartbeat":
        this.room = { ...room, lastActiveAt: now };
        return;
      default:
        throw new GameRuleError("UNKNOWN_COMMAND", "Unknown command.");
    }
  }

  private async loadRoom(): Promise<RoomState | undefined> {
    if (this.room) {
      return this.room;
    }

    await this.ensureSchema();
    const row = this.ctx.storage.sql
      .exec<{ state: string }>("SELECT state FROM room_state WHERE id = ?", STORAGE_KEY)
      .toArray()[0];

    if (!row) {
      return undefined;
    }

    this.room = JSON.parse(row.state) as RoomState;
    return this.room;
  }

  private async requireRoom(): Promise<RoomState> {
    const room = await this.loadRoom();

    if (!room) {
      throw new GameRuleError("ROOM_NOT_FOUND", "Room not found.");
    }

    return room;
  }

  private async saveRoom(): Promise<void> {
    if (!this.room) {
      return;
    }

    await this.ensureSchema();
    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO room_state (id, state, updated_at) VALUES (?, ?, ?)",
      STORAGE_KEY,
      JSON.stringify(this.room),
      Date.now()
    );
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaReady) {
      return;
    }

    this.ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS room_state (id TEXT PRIMARY KEY, state TEXT NOT NULL, updated_at INTEGER NOT NULL)"
    );
    this.schemaReady = true;
  }

  private async scheduleAlarm(): Promise<void> {
    const room = await this.loadRoom();
    if (!room) {
      return;
    }

    const currentRound = room.rounds.find((round) => round.id === room.currentRoundId);
    if (room.phase === "round" && currentRound && !currentRound.resolution) {
      await this.ctx.storage.setAlarm(currentRound.endsAt);
      return;
    }

    await this.ctx.storage.setAlarm(room.lastActiveAt + this.idleTtlMs());
  }

  private idleTtlMs(): number {
    const seconds = Number(this.env.ROOM_IDLE_TTL_SECONDS ?? "86400");
    return Number.isFinite(seconds) ? seconds * 1000 : 24 * 60 * 60 * 1000;
  }

  private async broadcastSnapshots(): Promise<void> {
    const room = await this.requireRoom();
    await this.broadcast({ type: "room.snapshot", payload: buildPublicSnapshot(room) });

    for (const webSocket of this.ctx.getWebSockets()) {
      const session = webSocket.deserializeAttachment() as SocketSession | undefined;
      if (!session) {
        continue;
      }

      await this.sendTo(webSocket, {
        type: "private.snapshot",
        payload: buildPrivateSnapshot(room, session.playerId)
      });
    }
  }

  private async broadcast(event: ServerEvent): Promise<void> {
    for (const webSocket of this.ctx.getWebSockets()) {
      await this.sendTo(webSocket, event);
    }
  }

  private async sendTo(webSocket: WebSocket, event: ServerEvent): Promise<void> {
    try {
      webSocket.send(JSON.stringify(event));
    } catch {
      webSocket.close(1011, "Unable to send event.");
    }
  }
}

async function createRoom(request: Request, env: Env): Promise<Response> {
  const body = await readJson<CreateRoomRequest>(request);
  const hostPlayerId = createId("player");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateRoomCode();
    const id = env.ROOMS.idFromName(code);
    const response = await env.ROOMS.get(id).fetch(
      new Request("https://room/create", {
        method: "POST",
        body: JSON.stringify({
          ...body,
          code,
          hostPlayerId
        } satisfies CreateRoomDurableRequest)
      })
    );

    if (response.status !== 409) {
      return withCors(response, request, env);
    }
  }

  return jsonResponse(request, env, { error: "Could not allocate a room code." }, { status: 503 });
}

async function joinExistingRoom(request: Request, env: Env, roomCode: string): Promise<Response> {
  const body = await readJson<JoinRoomRequest>(request);
  const id = env.ROOMS.idFromName(roomCode.toUpperCase());
  const response = await env.ROOMS.get(id).fetch(
    new Request("https://room/join", {
      method: "POST",
      body: JSON.stringify({
        ...body,
        playerId: createId("player")
      } satisfies JoinRoomDurableRequest)
    })
  );

  return withCors(response, request, env);
}

async function forwardToRoom(request: Request, env: Env, roomCode: string): Promise<Response> {
  const id = env.ROOMS.idFromName(roomCode.toUpperCase());
  const roomUrl = new URL(request.url);
  roomUrl.pathname = "/socket";

  return env.ROOMS.get(id).fetch(new Request(roomUrl, request));
}

function withCors(response: Response, request: Request, env: Env): Response {
  if (response.webSocket) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set(
    "access-control-allow-origin",
    request.headers.get("origin") ?? env.ALLOWED_ORIGIN ?? "http://localhost:5173"
  );
  headers.set("access-control-allow-methods", "GET,POST,OPTIONS");
  headers.set("access-control-allow-headers", "content-type,authorization");
  headers.set("vary", "origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
    webSocket: response.webSocket
  });
}

function readToken(request: Request): string {
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token");
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : undefined;
  const token = queryToken ?? bearerToken;

  if (!token) {
    throw new GameRuleError("TOKEN_REQUIRED", "A room token is required.");
  }

  return token;
}

function getTokenSecret(env: Env): string {
  if (env.TOKEN_SECRET) {
    return env.TOKEN_SECRET;
  }

  return "local-development-only-change-before-deploy";
}

function cryptoRandom(): number {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return (bytes[0] ?? 0) / 4294967296;
}

function errorBody(error: unknown): { code: string; message: string } {
  if (error instanceof GameRuleError) {
    return { code: error.code, message: error.message };
  }

  if (error instanceof Error) {
    return { code: "INTERNAL_ERROR", message: error.message };
  }

  return { code: "INTERNAL_ERROR", message: "Unexpected error." };
}
