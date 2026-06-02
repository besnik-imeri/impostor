import { DEFAULT_ROOM_CONFIG } from "@impostor/domain";
import { describe, expect, it } from "vitest";
import { isValidRoomConfigDraft } from "./room-config";

describe("room config draft validation", () => {
  it("accepts a valid room config draft", () => {
    expect(isValidRoomConfigDraft(DEFAULT_ROOM_CONFIG, 3)).toBe(true);
  });

  it("rejects max players lower than the current player count", () => {
    expect(isValidRoomConfigDraft({ ...DEFAULT_ROOM_CONFIG, maxPlayers: 3 }, 4)).toBe(false);
  });

  it("rejects malformed numeric values", () => {
    expect(isValidRoomConfigDraft({ ...DEFAULT_ROOM_CONFIG, roundCount: Number.NaN }, 3)).toBe(
      false
    );
    expect(isValidRoomConfigDraft({ ...DEFAULT_ROOM_CONFIG, roundDurationSeconds: 42.5 }, 3)).toBe(
      false
    );
  });
});
