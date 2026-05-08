export type GameMode = "accusation" | "suspicion";
export type RoomPhase = "lobby" | "round" | "results" | "finished" | "cancelled";
export type PlayerRole = "imposter" | "non-imposter";
export type ResolutionReason = "accusation" | "timer";
export type RoundOutcome = "imposter-caught" | "imposter-got-away";
export type AvatarId =
  | "comet"
  | "spark"
  | "mask"
  | "moon"
  | "pulse"
  | "orbit"
  | "nova"
  | "echo"
  | "riddle"
  | "cipher"
  | "mimic"
  | "glimmer";

export type PlayerColor = `#${string}`;

export interface RoomConfig {
  mode: GameMode;
  categoryId: string;
  maxPlayers: number;
  roundCount: number;
  roundDurationSeconds: number;
}

export interface PlayerProfile {
  id: string;
  nickname: string;
  avatar: AvatarId;
  color: PlayerColor;
  isHost: boolean;
  ready: boolean;
  connected: boolean;
  score: number;
  joinedAt: number;
}

export interface Accusation {
  accuserId: string;
  accusedId: string;
  createdAt: number;
}

export interface Suspicion {
  suspectingPlayerId: string;
  targetPlayerId: string;
  createdAt: number;
}

export interface ScoreDelta {
  playerId: string;
  points: number;
  reasons: string[];
}

export interface RoundResolution {
  reason: ResolutionReason;
  outcome: RoundOutcome;
  resolvedAt: number;
  imposterId: string;
  secretWord: string;
  accuserId?: string;
  accusedId?: string;
  correctAccusation: boolean;
  scoreDeltas: ScoreDelta[];
  summary: string;
}

export interface RoundState {
  id: string;
  number: number;
  categoryId: string;
  imposterId: string;
  secretWord: string;
  startingSpeakerId: string;
  startedAt: number;
  endsAt: number;
  accusation?: Accusation;
  suspicions: Suspicion[];
  resolution?: RoundResolution;
}

export interface RoomState {
  code: string;
  config: RoomConfig;
  phase: RoomPhase;
  players: PlayerProfile[];
  rounds: RoundState[];
  currentRoundId?: string;
  createdAt: number;
  updatedAt: number;
  lastActiveAt: number;
}

export interface PublicPlayerSnapshot {
  id: string;
  nickname: string;
  avatar: AvatarId;
  color: PlayerColor;
  isHost: boolean;
  ready: boolean;
  connected: boolean;
  score: number;
}

export interface PublicRoundSnapshot {
  id: string;
  number: number;
  categoryId: string;
  startingSpeakerId: string;
  startedAt: number;
  endsAt: number;
  suspicions: Suspicion[];
  accusation?: Accusation;
  resolution?: RoundResolution;
}

export interface PublicRoomSnapshot {
  code: string;
  config: RoomConfig;
  phase: RoomPhase;
  players: PublicPlayerSnapshot[];
  currentRound?: PublicRoundSnapshot;
  createdAt: number;
  updatedAt: number;
}

export interface PrivatePlayerSnapshot {
  playerId: string;
  isHost: boolean;
  role?: PlayerRole;
  visibleWord?: string;
  secretWord?: string;
  imposterId?: string;
}
