import { describe, expect, it } from "vitest";
import { createRoomSessionCookie, readRoomSessionToken } from "../src/index";
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

  it("creates scoped HttpOnly room session cookies", async () => {
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

    const cookie = createRoomSessionCookie("abc123", token);

    expect(cookie).toContain("impostor_room_session=");
    expect(cookie).toContain("Path=/api/rooms/ABC123");
    expect(cookie).toContain("Max-Age=86400");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
  });

  it("reads room session cookies and rejects missing cookie auth", async () => {
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
    const request = new Request("https://impostor.localhost/api/rooms/ABC123/socket", {
      headers: {
        cookie: createRoomSessionCookie("ABC123", token)
      }
    });

    expect(readRoomSessionToken(request)).toBe(token);
    expect(() =>
      readRoomSessionToken(new Request("https://impostor.localhost/api/rooms/ABC123/socket"))
    ).toThrow(/token/i);
  });
});
