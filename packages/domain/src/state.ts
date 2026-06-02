import { DEFAULT_ROOM_CONFIG, PLAYER_LIMITS, ROUND_LIMITS } from "./constants";
import { GameRuleError, assertRule } from "./errors";
import type { RandomSource } from "./random";
import { randomItem } from "./random";
import { applyScoreDeltas, scoreRound } from "./scoring";
import type {
  Accusation,
  AvatarId,
  PlayerColor,
  PlayerProfile,
  PrivatePlayerSnapshot,
  PublicRoomSnapshot,
  RoomConfig,
  RoomState,
  RoundState,
  Suspicion
} from "./types";
import { WORD_CATEGORIES, getCategory } from "./words";

export interface CreatePlayerInput {
  id: string;
  nickname: string;
  avatar: AvatarId;
  color: PlayerColor;
  isHost?: boolean;
  now: number;
}

export function normalizeRoomConfig(input: Partial<RoomConfig> = {}): RoomConfig {
  const config = {
    ...DEFAULT_ROOM_CONFIG,
    ...input
  };

  assertRule(
    config.mode === "accusation" || config.mode === "suspicion",
    "INVALID_MODE",
    "Choose Accusation or Suspicion mode."
  );
  assertRule(
    Boolean(getCategory(config.categoryId)),
    "INVALID_CATEGORY",
    "Choose a supported word category."
  );
  assertRule(
    Number.isInteger(config.maxPlayers) &&
      config.maxPlayers >= PLAYER_LIMITS.min &&
      config.maxPlayers <= PLAYER_LIMITS.max,
    "INVALID_MAX_PLAYERS",
    `Choose ${PLAYER_LIMITS.min}-${PLAYER_LIMITS.max} players.`
  );
  assertRule(
    Number.isInteger(config.roundCount) &&
      config.roundCount >= ROUND_LIMITS.minCount &&
      config.roundCount <= ROUND_LIMITS.maxCount,
    "INVALID_ROUND_COUNT",
    `Choose ${ROUND_LIMITS.minCount}-${ROUND_LIMITS.maxCount} rounds.`
  );
  assertRule(
    Number.isInteger(config.roundDurationSeconds) &&
      config.roundDurationSeconds >= ROUND_LIMITS.minDurationSeconds &&
      config.roundDurationSeconds <= ROUND_LIMITS.maxDurationSeconds,
    "INVALID_ROUND_DURATION",
    `Choose a round timer between ${ROUND_LIMITS.minDurationSeconds} and ${ROUND_LIMITS.maxDurationSeconds} seconds.`
  );

  return config;
}

export function createPlayer(input: CreatePlayerInput): PlayerProfile {
  const nickname = input.nickname.trim().replace(/\s+/g, " ");

  assertRule(nickname.length >= 2, "INVALID_NICKNAME", "Nickname must be at least 2 characters.");
  assertRule(nickname.length <= 24, "INVALID_NICKNAME", "Nickname must be 24 characters or less.");

  return {
    id: input.id,
    nickname,
    avatar: input.avatar,
    color: input.color,
    isHost: Boolean(input.isHost),
    ready: false,
    connected: true,
    score: 0,
    joinedAt: input.now
  };
}

export function createRoomState(
  code: string,
  host: PlayerProfile,
  configInput: Partial<RoomConfig>,
  now: number
): RoomState {
  assertRule(host.isHost, "HOST_REQUIRED", "The room creator must be the host.");

  const config = normalizeRoomConfig(configInput);

  return {
    code,
    config,
    phase: "lobby",
    players: [host],
    rounds: [],
    createdAt: now,
    updatedAt: now,
    lastActiveAt: now
  };
}

export function joinRoom(state: RoomState, player: PlayerProfile, now: number): RoomState {
  assertRule(state.phase === "lobby", "ROOM_NOT_JOINABLE", "This room is no longer joinable.");
  assertRule(state.players.length < state.config.maxPlayers, "ROOM_FULL", "This room is full.");
  assertRule(
    !state.players.some((existing) => existing.id === player.id),
    "PLAYER_EXISTS",
    "Player already joined."
  );
  assertRule(
    !state.players.some(
      (existing) => existing.nickname.toLowerCase() === player.nickname.toLowerCase()
    ),
    "NICKNAME_TAKEN",
    "Choose a nickname that is not already in the room."
  );

  return touch(
    {
      ...state,
      players: [...state.players, player]
    },
    now
  );
}

export function setPlayerConnected(
  state: RoomState,
  playerId: string,
  connected: boolean,
  now: number
): RoomState {
  return touch(
    {
      ...state,
      players: state.players.map((player) =>
        player.id === playerId ? { ...player, connected } : player
      )
    },
    now
  );
}

export function setPlayerReady(
  state: RoomState,
  playerId: string,
  ready: boolean,
  now: number
): RoomState {
  assertRule(state.phase === "lobby", "READY_LOCKED", "Ready state can only change in the lobby.");
  assertPlayerExists(state, playerId);

  return touch(
    {
      ...state,
      players: state.players.map((player) =>
        player.id === playerId ? { ...player, ready } : player
      )
    },
    now
  );
}

export function kickPlayer(
  state: RoomState,
  hostPlayerId: string,
  targetPlayerId: string,
  now: number
): RoomState {
  assertHost(state, hostPlayerId);
  assertRule(
    state.phase === "lobby",
    "KICK_LOCKED",
    "Players can only be removed before the game starts."
  );
  assertRule(
    hostPlayerId !== targetPlayerId,
    "CANNOT_KICK_HOST",
    "The host cannot remove themselves."
  );
  assertPlayerExists(state, targetPlayerId);

  return touch(
    {
      ...state,
      players: state.players.filter((player) => player.id !== targetPlayerId)
    },
    now
  );
}

export function cancelRoom(state: RoomState, hostPlayerId: string, now: number): RoomState {
  assertHost(state, hostPlayerId);

  return touch(
    {
      ...state,
      phase: "cancelled"
    },
    now
  );
}

export function canStartGame(state: RoomState): boolean {
  return (
    state.phase === "lobby" &&
    state.players.length >= PLAYER_LIMITS.min &&
    state.players.every((player) => player.ready)
  );
}

export function updateRoomConfig(
  state: RoomState,
  hostPlayerId: string,
  configInput: Partial<RoomConfig>,
  now: number
): RoomState {
  assertHost(state, hostPlayerId);
  assertRule(
    state.phase === "lobby",
    "CONFIG_LOCKED",
    "Room settings can only change in the lobby."
  );

  const config = normalizeRoomConfig({
    ...state.config,
    ...configInput
  });

  assertRule(
    config.maxPlayers >= state.players.length,
    "MAX_PLAYERS_TOO_LOW",
    "Max players cannot be lower than the number already in the room."
  );

  const configChanged = !roomConfigsEqual(state.config, config);

  return touch(
    {
      ...state,
      config,
      players: configChanged
        ? state.players.map((player) => ({ ...player, ready: false }))
        : state.players
    },
    now
  );
}

export function restartGame(state: RoomState, hostPlayerId: string, now: number): RoomState {
  assertHost(state, hostPlayerId);
  assertRule(
    state.phase === "results" || state.phase === "finished",
    "RESTART_LOCKED",
    "A new game can only be set up after a round ends."
  );
  const { currentRoundId: _currentRoundId, ...stateWithoutCurrentRound } = state;

  return touch(
    {
      ...stateWithoutCurrentRound,
      phase: "lobby",
      players: state.players.map((player) => ({ ...player, ready: false })),
      rounds: []
    },
    now
  );
}

export function startNextRound(
  state: RoomState,
  hostPlayerId: string,
  now: number,
  rng: RandomSource
): RoomState {
  assertHost(state, hostPlayerId);
  assertRule(
    state.phase === "lobby" || state.phase === "results",
    "START_LOCKED",
    "The next round cannot start yet."
  );

  if (state.phase === "lobby") {
    assertRule(
      canStartGame(state),
      "PLAYERS_NOT_READY",
      "All players must be ready before the game starts."
    );
  }

  const nextRoundNumber = state.rounds.length + 1;
  assertRule(
    nextRoundNumber <= state.config.roundCount,
    "GAME_ALREADY_FINISHED",
    "All rounds are complete."
  );

  const category = getCategory(state.config.categoryId);
  if (!category) {
    throw new GameRuleError("INVALID_CATEGORY", "The selected category is not available.");
  }

  const impostor = randomItem(state.players, rng);
  const startingSpeaker = randomItem(state.players, rng);
  const secretWord = randomItem(category.words, rng);
  const round: RoundState = {
    id: `round-${nextRoundNumber}`,
    number: nextRoundNumber,
    categoryId: category.id,
    impostorId: impostor.id,
    secretWord,
    startingSpeakerId: startingSpeaker.id,
    startedAt: now,
    endsAt: now + state.config.roundDurationSeconds * 1000,
    suspicions: []
  };

  return touch(
    {
      ...state,
      phase: "round",
      rounds: [...state.rounds, round],
      currentRoundId: round.id
    },
    now
  );
}

export function createSuspicion(
  state: RoomState,
  suspectingPlayerId: string,
  targetPlayerId: string,
  now: number
): RoomState {
  assertRule(
    state.config.mode === "suspicion",
    "SUSPICION_DISABLED",
    "Suspicion is disabled in this mode."
  );
  assertRule(
    state.phase === "round",
    "SUSPICION_LOCKED",
    "Suspicions can only be added during a round."
  );
  assertPlayerExists(state, suspectingPlayerId);
  assertPlayerExists(state, targetPlayerId);
  assertRule(
    suspectingPlayerId !== targetPlayerId,
    "CANNOT_SUSPECT_SELF",
    "You cannot suspect yourself."
  );

  const round = requireCurrentRound(state);
  assertRule(!round.resolution, "ROUND_RESOLVED", "This round is already resolved.");
  assertRule(
    !round.suspicions.some((suspicion) => suspicion.suspectingPlayerId === suspectingPlayerId),
    "SUSPICION_ALREADY_USED",
    "You already used your suspicion this round."
  );

  const suspicion: Suspicion = {
    suspectingPlayerId,
    targetPlayerId,
    createdAt: now
  };

  return replaceCurrentRound(
    state,
    {
      ...round,
      suspicions: [...round.suspicions, suspicion]
    },
    now
  );
}

export function createAccusation(
  state: RoomState,
  accuserId: string,
  accusedId: string,
  now: number
): RoomState {
  assertRule(
    state.phase === "round",
    "ACCUSE_LOCKED",
    "Accusations can only be made during a round."
  );
  assertPlayerExists(state, accuserId);
  assertPlayerExists(state, accusedId);
  assertRule(accuserId !== accusedId, "CANNOT_ACCUSE_SELF", "You cannot accuse yourself.");

  const round = requireCurrentRound(state);
  assertRule(
    accuserId !== round.impostorId,
    "IMPOSTOR_CANNOT_ACCUSE",
    "The impostor cannot accuse players."
  );
  assertRule(!round.resolution, "ROUND_RESOLVED", "This round is already resolved.");

  const accusation: Accusation = {
    accuserId,
    accusedId,
    createdAt: now
  };
  const resolution = scoreRound({
    mode: state.config.mode,
    players: state.players,
    impostorId: round.impostorId,
    secretWord: round.secretWord,
    accusation,
    suspicions: round.suspicions,
    resolvedAt: now
  });

  return applyResolution(state, { ...round, accusation, resolution }, now);
}

export function resolveTimerExpiry(state: RoomState, now: number): RoomState {
  assertRule(state.phase === "round", "TIMER_LOCKED", "Timer expiry only applies during a round.");

  const round = requireCurrentRound(state);
  assertRule(!round.resolution, "ROUND_RESOLVED", "This round is already resolved.");
  assertRule(now >= round.endsAt, "TIMER_NOT_EXPIRED", "The round timer is still running.");

  const resolution = scoreRound({
    mode: state.config.mode,
    players: state.players,
    impostorId: round.impostorId,
    secretWord: round.secretWord,
    suspicions: round.suspicions,
    resolvedAt: now
  });

  return applyResolution(state, { ...round, resolution }, now);
}

export function buildPublicSnapshot(state: RoomState): PublicRoomSnapshot {
  const currentRound = getCurrentRound(state);

  return {
    code: state.code,
    config: state.config,
    phase: state.phase,
    players: state.players.map(
      ({ id, nickname, avatar, color, isHost, ready, connected, score }) => ({
        id,
        nickname,
        avatar,
        color,
        isHost,
        ready,
        connected,
        score
      })
    ),
    ...(currentRound
      ? {
          currentRound: {
            id: currentRound.id,
            number: currentRound.number,
            categoryId: currentRound.categoryId,
            startingSpeakerId: currentRound.startingSpeakerId,
            startedAt: currentRound.startedAt,
            endsAt: currentRound.endsAt,
            suspicions: currentRound.suspicions,
            ...(currentRound.accusation ? { accusation: currentRound.accusation } : {}),
            ...(currentRound.resolution ? { resolution: currentRound.resolution } : {})
          }
        }
      : {}),
    createdAt: state.createdAt,
    updatedAt: state.updatedAt
  };
}

export function buildPrivateSnapshot(state: RoomState, playerId: string): PrivatePlayerSnapshot {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    throw new GameRuleError("PLAYER_NOT_FOUND", "Player is not in this room.");
  }

  const currentRound = getCurrentRound(state);

  if (!currentRound) {
    return {
      playerId,
      isHost: player.isHost
    };
  }

  const role = currentRound.impostorId === playerId ? "impostor" : "non-impostor";
  const roundResolved = Boolean(currentRound.resolution);

  return {
    playerId,
    isHost: player.isHost,
    role,
    visibleWord: role === "impostor" && !roundResolved ? "IMPOSTOR" : currentRound.secretWord,
    ...(roundResolved
      ? {
          secretWord: currentRound.secretWord,
          impostorId: currentRound.impostorId
        }
      : {})
  };
}

export function getCurrentRound(state: RoomState): RoundState | undefined {
  return state.rounds.find((round) => round.id === state.currentRoundId);
}

function applyResolution(state: RoomState, resolvedRound: RoundState, now: number): RoomState {
  const phase = resolvedRound.number >= state.config.roundCount ? "finished" : "results";

  return touch(
    {
      ...state,
      phase,
      rounds: state.rounds.map((round) => (round.id === resolvedRound.id ? resolvedRound : round)),
      players: applyScoreDeltas(state.players, resolvedRound.resolution?.scoreDeltas ?? [])
    },
    now
  );
}

function replaceCurrentRound(state: RoomState, round: RoundState, now: number): RoomState {
  return touch(
    {
      ...state,
      rounds: state.rounds.map((candidate) => (candidate.id === round.id ? round : candidate))
    },
    now
  );
}

function requireCurrentRound(state: RoomState): RoundState {
  const round = getCurrentRound(state);
  if (!round) {
    throw new GameRuleError("ROUND_NOT_FOUND", "Current round not found.");
  }
  return round;
}

function assertHost(state: RoomState, playerId: string): void {
  const player = assertPlayerExists(state, playerId);
  assertRule(player.isHost, "HOST_ONLY", "Only the host can do this.");
}

function assertPlayerExists(state: RoomState, playerId: string): PlayerProfile {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    throw new GameRuleError("PLAYER_NOT_FOUND", "Player is not in this room.");
  }
  return player;
}

function touch(state: RoomState, now: number): RoomState {
  return {
    ...state,
    updatedAt: now,
    lastActiveAt: now
  };
}

function roomConfigsEqual(left: RoomConfig, right: RoomConfig): boolean {
  return (
    left.mode === right.mode &&
    left.categoryId === right.categoryId &&
    left.maxPlayers === right.maxPlayers &&
    left.roundCount === right.roundCount &&
    left.roundDurationSeconds === right.roundDurationSeconds
  );
}

export function assertKnownCategory(categoryId: string): void {
  if (!WORD_CATEGORIES.some((category) => category.id === categoryId)) {
    throw new GameRuleError("INVALID_CATEGORY", "Unknown word category.");
  }
}
