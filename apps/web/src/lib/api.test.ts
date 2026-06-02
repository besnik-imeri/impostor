import { afterEach, describe, expect, it } from "vitest";
import { createRoomSocket } from "./api";

const originalWebSocket = globalThis.WebSocket;
const originalWindow = globalThis.window;

class FakeWebSocket {
  constructor(readonly url: string) {}
}

describe("api client", () => {
  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
    globalThis.window = originalWindow;
  });

  it("opens room sockets without putting tokens in the URL", () => {
    globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
    globalThis.window = {
      location: { origin: "https://impostor.localhost" }
    } as Window & typeof globalThis;

    const socket = createRoomSocket("ABC123") as unknown as FakeWebSocket;

    expect(socket.url).toBe("wss://impostor.localhost/api/rooms/ABC123/socket");
    expect(socket.url).not.toContain("token=");
  });
});
