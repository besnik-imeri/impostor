import { describe, expect, it } from "vitest";
import { createPlayer, scoreRound } from "../src";
import type { Accusation, PlayerProfile, Suspicion } from "../src";

const now = Date.UTC(2026, 4, 8, 20, 0, 0);

function players(): PlayerProfile[] {
  return [
    createPlayer({
      id: "p1",
      nickname: "Alex",
      avatar: "boy-1",
      color: "#2563eb",
      now
    }),
    createPlayer({
      id: "p2",
      nickname: "Blair",
      avatar: "girl-1",
      color: "#dc2626",
      now
    }),
    createPlayer({
      id: "p3",
      nickname: "Casey",
      avatar: "boy-2",
      color: "#059669",
      now
    }),
    createPlayer({
      id: "p4",
      nickname: "Devon",
      avatar: "girl-2",
      color: "#d97706",
      now
    })
  ];
}

function pointsByPlayer(deltas: ReturnType<typeof scoreRound>["scoreDeltas"]) {
  return Object.fromEntries(deltas.map((delta) => [delta.playerId, delta.points]));
}

describe("scoreRound", () => {
  it("scores a correct Accusation round", () => {
    const accusation: Accusation = {
      accuserId: "p1",
      accusedId: "p2",
      createdAt: now
    };
    const result = scoreRound({
      mode: "accusation",
      players: players(),
      impostorId: "p2",
      secretWord: "Pizza",
      accusation,
      suspicions: [],
      resolvedAt: now
    });

    expect(result.outcome).toBe("impostor-caught");
    expect(pointsByPlayer(result.scoreDeltas)).toEqual({
      p1: 2,
      p2: -2,
      p3: 1,
      p4: 1
    });
  });

  it("scores a wrong Accusation round as impostor got away", () => {
    const accusation: Accusation = {
      accuserId: "p1",
      accusedId: "p3",
      createdAt: now
    };
    const result = scoreRound({
      mode: "accusation",
      players: players(),
      impostorId: "p2",
      secretWord: "Pizza",
      accusation,
      suspicions: [],
      resolvedAt: now
    });

    expect(result.outcome).toBe("impostor-got-away");
    expect(pointsByPlayer(result.scoreDeltas)).toEqual({
      p1: -2,
      p2: 3,
      p3: -1
    });
  });

  it("scores timer expiry as impostor got away", () => {
    const result = scoreRound({
      mode: "accusation",
      players: players(),
      impostorId: "p2",
      secretWord: "Pizza",
      suspicions: [],
      resolvedAt: now
    });

    expect(result.reason).toBe("timer");
    expect(result.outcome).toBe("impostor-got-away");
    expect(pointsByPlayer(result.scoreDeltas)).toEqual({
      p2: 3
    });
  });

  it("scores Suspicion mode without team bonus for other non-impostors", () => {
    const accusation: Accusation = {
      accuserId: "p1",
      accusedId: "p2",
      createdAt: now
    };
    const suspicions: Suspicion[] = [
      {
        suspectingPlayerId: "p1",
        targetPlayerId: "p2",
        createdAt: now
      },
      {
        suspectingPlayerId: "p3",
        targetPlayerId: "p4",
        createdAt: now
      },
      {
        suspectingPlayerId: "p2",
        targetPlayerId: "p3",
        createdAt: now
      }
    ];
    const result = scoreRound({
      mode: "suspicion",
      players: players(),
      impostorId: "p2",
      secretWord: "Pizza",
      accusation,
      suspicions,
      resolvedAt: now
    });

    expect(pointsByPlayer(result.scoreDeltas)).toEqual({
      p1: 3,
      p2: -3,
      p3: -1
    });
  });

  it("scores Suspicion timer expiry with suspicion marks and impostor getaway", () => {
    const suspicions: Suspicion[] = [
      {
        suspectingPlayerId: "p1",
        targetPlayerId: "p2",
        createdAt: now
      },
      {
        suspectingPlayerId: "p3",
        targetPlayerId: "p4",
        createdAt: now
      }
    ];
    const result = scoreRound({
      mode: "suspicion",
      players: players(),
      impostorId: "p2",
      secretWord: "Pizza",
      suspicions,
      resolvedAt: now
    });

    expect(result.outcome).toBe("impostor-got-away");
    expect(pointsByPlayer(result.scoreDeltas)).toEqual({
      p1: 1,
      p2: 2,
      p3: -1
    });
  });
});
