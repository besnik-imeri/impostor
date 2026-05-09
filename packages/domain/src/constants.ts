import type { AvatarId, PlayerColor } from "./types";

export const PRODUCT_NAME = "Impostor";

export const PLAYER_LIMITS = {
  min: 3,
  max: 12,
  defaultMax: 6
} as const;

export const ROUND_LIMITS = {
  minCount: 1,
  maxCount: 10,
  defaultCount: 3,
  minDurationSeconds: 30,
  maxDurationSeconds: 600,
  defaultDurationSeconds: 120
} as const;

export const DEFAULT_ROOM_CONFIG = {
  mode: "accusation",
  categoryId: "everyday",
  maxPlayers: PLAYER_LIMITS.defaultMax,
  roundCount: ROUND_LIMITS.defaultCount,
  roundDurationSeconds: ROUND_LIMITS.defaultDurationSeconds
} as const;

export const AVATARS: readonly AvatarId[] = [
  "boy-1",
  "boy-2",
  "boy-3",
  "boy-4",
  "boy-5",
  "boy-6",
  "boy-7",
  "boy-8",
  "boy-9",
  "boy-10",
  "boy-11",
  "boy-12",
  "girl-1",
  "girl-2",
  "girl-3",
  "girl-4",
  "girl-5",
  "girl-6",
  "girl-7",
  "girl-8",
  "girl-9",
  "girl-10",
  "girl-11",
  "girl-12"
];

export const PLAYER_COLORS: readonly PlayerColor[] = [
  "#276ef1",
  "#e4475d",
  "#13a47a",
  "#f28c28",
  "#7c3aed",
  "#0f9bb7",
  "#c9184a",
  "#4f46e5",
  "#198754",
  "#9333ea",
  "#0f766e",
  "#b45309"
];
