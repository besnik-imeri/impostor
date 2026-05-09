import type {
  Accusation,
  GameMode,
  PlayerProfile,
  RoundOutcome,
  RoundResolution,
  ScoreDelta,
  Suspicion
} from "./types";

interface ScoreRoundInput {
  mode: GameMode;
  players: readonly PlayerProfile[];
  impostorId: string;
  secretWord: string;
  resolvedAt: number;
  accusation?: Accusation;
  suspicions: readonly Suspicion[];
}

class DeltaBuilder {
  private readonly deltas = new Map<string, ScoreDelta>();

  add(playerId: string, points: number, reason: string): void {
    const existing = this.deltas.get(playerId);

    if (existing) {
      existing.points += points;
      existing.reasons.push(reason);
      return;
    }

    this.deltas.set(playerId, {
      playerId,
      points,
      reasons: [reason]
    });
  }

  toArray(players: readonly PlayerProfile[]): ScoreDelta[] {
    const playerOrder = new Map(players.map((player, index) => [player.id, index]));

    return [...this.deltas.values()].sort(
      (left, right) =>
        (playerOrder.get(left.playerId) ?? Number.MAX_SAFE_INTEGER) -
        (playerOrder.get(right.playerId) ?? Number.MAX_SAFE_INTEGER)
    );
  }
}

export function scoreRound(input: ScoreRoundInput): RoundResolution {
  const builder = new DeltaBuilder();
  const nonImpostors = input.players.filter((player) => player.id !== input.impostorId);
  const accusationCorrect = input.accusation?.accusedId === input.impostorId;
  const outcome: RoundOutcome = accusationCorrect ? "impostor-caught" : "impostor-got-away";

  if (input.accusation) {
    if (accusationCorrect) {
      builder.add(input.accusation.accuserId, 2, "Correct accusation");

      if (input.mode === "accusation") {
        for (const player of nonImpostors) {
          if (player.id !== input.accusation.accuserId) {
            builder.add(player.id, 1, "Team found the impostor");
          }
        }
      }

      builder.add(input.impostorId, -2, "Accused as impostor");
    } else {
      builder.add(input.accusation.accuserId, -2, "Wrong accusation");
      builder.add(input.accusation.accusedId, -1, "Wrongfully accused");
      builder.add(input.impostorId, 3, "Impostor got away");
    }
  } else {
    builder.add(input.impostorId, 3, "Timer expired; impostor got away");
  }

  if (input.mode === "suspicion") {
    for (const suspicion of input.suspicions) {
      if (suspicion.suspectingPlayerId === input.impostorId) {
        continue;
      }

      if (suspicion.targetPlayerId === input.impostorId) {
        builder.add(suspicion.suspectingPlayerId, 1, "Suspected the impostor");
        builder.add(input.impostorId, -1, "Was suspected");
      } else {
        builder.add(suspicion.suspectingPlayerId, -1, "Suspected the wrong player");
      }
    }
  }

  const scoreDeltas = builder.toArray(input.players);

  return {
    reason: input.accusation ? "accusation" : "timer",
    outcome,
    resolvedAt: input.resolvedAt,
    impostorId: input.impostorId,
    secretWord: input.secretWord,
    ...(input.accusation
      ? {
          accuserId: input.accusation.accuserId,
          accusedId: input.accusation.accusedId
        }
      : {}),
    correctAccusation: Boolean(accusationCorrect),
    scoreDeltas,
    summary: outcome === "impostor-caught" ? "The impostor was caught." : "The impostor got away."
  };
}

export function applyScoreDeltas(
  players: readonly PlayerProfile[],
  deltas: readonly ScoreDelta[]
): PlayerProfile[] {
  const deltaMap = new Map(deltas.map((delta) => [delta.playerId, delta.points]));

  return players.map((player) => ({
    ...player,
    score: player.score + (deltaMap.get(player.id) ?? 0)
  }));
}
