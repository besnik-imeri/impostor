import { PLAYER_LIMITS, ROUND_LIMITS, WORD_CATEGORIES, type RoomConfig } from "@impostor/domain";

export function isValidRoomConfigDraft(config: RoomConfig, currentPlayers: number): boolean {
  return (
    (config.mode === "accusation" || config.mode === "suspicion") &&
    WORD_CATEGORIES.some((category) => category.id === config.categoryId) &&
    isIntegerInRange(
      config.maxPlayers,
      Math.max(PLAYER_LIMITS.min, currentPlayers),
      PLAYER_LIMITS.max
    ) &&
    isIntegerInRange(config.roundCount, ROUND_LIMITS.minCount, ROUND_LIMITS.maxCount) &&
    isIntegerInRange(
      config.roundDurationSeconds,
      ROUND_LIMITS.minDurationSeconds,
      ROUND_LIMITS.maxDurationSeconds
    )
  );
}

function isIntegerInRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}
