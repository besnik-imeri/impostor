import type { AvatarId, PlayerColor } from "./types";

export const PRODUCT_NAME = "Imposter";

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
  "comet",
  "spark",
  "mask",
  "moon",
  "pulse",
  "orbit",
  "nova",
  "echo",
  "riddle",
  "cipher",
  "mimic",
  "glimmer"
];

export const PLAYER_COLORS: readonly PlayerColor[] = [
  "#2563eb",
  "#dc2626",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#be123c",
  "#4f46e5",
  "#15803d",
  "#9333ea",
  "#0f766e",
  "#b45309"
];
