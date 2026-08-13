import type { ArcadeAvatarId, PlayerColor } from "./types";

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

export const AVATARS: readonly ArcadeAvatarId[] = [
  "8-bit-bunny",
  "arcade-owl",
  "astro-koala",
  "cyber-fox",
  "foggy-frog",
  "glitch-cat",
  "master-monkey",
  "neon-ninja",
  "pixel-panda",
  "punky-penguin",
  "retro-rex",
  "robo-shark",
  "turbo-monkey"
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
