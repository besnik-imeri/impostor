import { describe, expect, it } from "vitest";
import {
  canStartGame,
  createAccusation,
  createPlayer,
  createRoomState,
  createSeededRng,
  createSuspicion,
  joinRoom,
  resolveTimerExpiry,
  setPlayerReady,
  startNextRound
} from "../src";
import type { RoomState } from "../src";

const now = Date.UTC(2026, 4, 8, 20, 0, 0);

function player(id: string, nickname: string, isHost = false) {
  return createPlayer({
    id,
    nickname,
    avatar: "boy-1",
    color: "#2563eb",
    isHost,
    now
  });
}

function readyLobby(): RoomState {
  let state = createRoomState(
    "ABCD12",
    player("host", "Host", true),
    {
      mode: "suspicion",
      categoryId: "food",
      maxPlayers: 6,
      roundCount: 2,
      roundDurationSeconds: 120
    },
    now
  );
  state = joinRoom(state, player("p2", "Blair"), now);
  state = joinRoom(state, player("p3", "Casey"), now);
  state = joinRoom(state, player("p4", "Devon"), now);

  for (const joinedPlayer of state.players) {
    state = setPlayerReady(state, joinedPlayer.id, true, now);
  }

  return state;
}

describe("room state", () => {
  it("requires minimum players and ready state before start", () => {
    let state = createRoomState("ABCD12", player("host", "Host", true), {}, now);
    state = joinRoom(state, player("p2", "Blair"), now);

    expect(canStartGame(state)).toBe(false);

    state = joinRoom(state, player("p3", "Casey"), now);
    for (const joinedPlayer of state.players) {
      state = setPlayerReady(state, joinedPlayer.id, true, now);
    }

    expect(canStartGame(state)).toBe(true);
  });

  it("selects one impostor, one word, and a starting speaker when a round starts", () => {
    const state = startNextRound(readyLobby(), "host", now, createSeededRng(42));
    const round = state.rounds[0];

    expect(state.phase).toBe("round");
    expect(round?.impostorId).toBeTruthy();
    expect(round?.secretWord).toBeTruthy();
    expect(round?.startingSpeakerId).toBeTruthy();
    expect(state.players.some((candidate) => candidate.id === round?.startingSpeakerId)).toBe(true);
  });

  it("allows one non-retractable suspicion per player in Suspicion mode", () => {
    let state = startNextRound(readyLobby(), "host", now, createSeededRng(11));
    state = createSuspicion(state, "p2", "host", now + 1);

    expect(state.rounds[0]?.suspicions).toHaveLength(1);
    expect(() => createSuspicion(state, "p2", "p3", now + 2)).toThrow(/already used/i);
  });

  it("first valid accusation resolves the round and rejects later accusations", () => {
    let state = startNextRound(readyLobby(), "host", now, createSeededRng(2));
    const impostorId = state.rounds[0]?.impostorId;
    expect(impostorId).toBeTruthy();

    state = createAccusation(state, "p2", impostorId as string, now + 10);

    expect(state.phase).toBe("results");
    expect(state.rounds[0]?.resolution?.outcome).toBe("impostor-caught");
    expect(() => createAccusation(state, "p3", "p4", now + 11)).toThrow(/during a round/i);
  });

  it("timer expiry resolves as impostor got away", () => {
    let state = startNextRound(readyLobby(), "host", now, createSeededRng(7));
    const endsAt = state.rounds[0]?.endsAt ?? now;
    state = resolveTimerExpiry(state, endsAt);

    expect(state.phase).toBe("results");
    expect(state.rounds[0]?.resolution?.reason).toBe("timer");
    expect(state.rounds[0]?.resolution?.outcome).toBe("impostor-got-away");
  });
});
