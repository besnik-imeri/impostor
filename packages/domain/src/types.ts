export type GameMode = "accusation" | "suspicion";
export type RoomPhase = "lobby" | "round" | "results" | "finished" | "cancelled";
export type PlayerRole = "impostor" | "non-impostor";
export type ResolutionReason = "accusation" | "timer";
export type RoundOutcome = "impostor-caught" | "impostor-got-away";
export type ArcadeAvatarId =
  | "8-bit-bunny"
  | "arcade-owl"
  | "astro-koala"
  | "cyber-fox"
  | "foggy-frog"
  | "glitch-cat"
  | "master-monkey"
  | "neon-ninja"
  | "pixel-panda"
  | "punky-penguin"
  | "retro-rex"
  | "robo-shark"
  | "turbo-monkey";

export type LegacyAvatarId =
  | "boy-1"
  | "boy-2"
  | "boy-3"
  | "boy-4"
  | "boy-5"
  | "boy-6"
  | "boy-7"
  | "boy-8"
  | "boy-9"
  | "boy-10"
  | "boy-11"
  | "boy-12"
  | "girl-1"
  | "girl-2"
  | "girl-3"
  | "girl-4"
  | "girl-5"
  | "girl-6"
  | "girl-7"
  | "girl-8"
  | "girl-9"
  | "girl-10"
  | "girl-11"
  | "girl-12";

export type AvatarId = ArcadeAvatarId | LegacyAvatarId;

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
  impostorId: string;
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
  impostorId: string;
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
  impostorId?: string;
}
