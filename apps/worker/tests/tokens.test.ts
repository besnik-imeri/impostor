import { describe, expect, it } from "vitest";
import { createRoomToken, verifyRoomToken } from "../src/tokens";

describe("room tokens", () => {
  it("round-trips signed room token payloads", async () => {
    const payload = {
      roomCode: "ABC123",
      playerId: "player_1",
      isHost: true,
      iat: 1000,
      exp: 5000
    };

    const token = await createRoomToken(payload, "secret");
    await expect(verifyRoomToken(token, "secret", 2000)).resolves.toEqual(payload);
  });

  it("rejects tampered signatures", async () => {
    const token = await createRoomToken(
      {
        roomCode: "ABC123",
        playerId: "player_1",
        isHost: false,
        iat: 1000,
        exp: 5000
      },
      "secret"
    );

    await expect(verifyRoomToken(`${token}x`, "secret", 2000)).rejects.toThrow(/signature/i);
  });
});
