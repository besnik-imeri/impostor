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
  imposterId: string;
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
  const nonImposters = input.players.filter((player) => player.id !== input.imposterId);
  const accusationCorrect = input.accusation?.accusedId === input.imposterId;
  const outcome: RoundOutcome = accusationCorrect ? "imposter-caught" : "imposter-got-away";

  if (input.accusation) {
    if (accusationCorrect) {
      builder.add(input.accusation.accuserId, 2, "Correct accusation");

      if (input.mode === "accusation") {
        for (const player of nonImposters) {
          if (player.id !== input.accusation.accuserId) {
            builder.add(player.id, 1, "Team found the imposter");
          }
        }
      }

      builder.add(input.imposterId, -2, "Accused as imposter");
    } else {
      builder.add(input.accusation.accuserId, -2, "Wrong accusation");
      builder.add(input.accusation.accusedId, -1, "Wrongfully accused");
      builder.add(input.imposterId, 3, "Imposter got away");
    }
  } else {
    builder.add(input.imposterId, 3, "Timer expired; imposter got away");
  }

  if (input.mode === "suspicion") {
    for (const suspicion of input.suspicions) {
      if (suspicion.suspectingPlayerId === input.imposterId) {
        continue;
      }

      if (suspicion.targetPlayerId === input.imposterId) {
        builder.add(suspicion.suspectingPlayerId, 1, "Suspected the imposter");
        builder.add(input.imposterId, -1, "Was suspected");
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
    imposterId: input.imposterId,
    secretWord: input.secretWord,
    ...(input.accusation
      ? {
          accuserId: input.accusation.accuserId,
          accusedId: input.accusation.accusedId
        }
      : {}),
    correctAccusation: Boolean(accusationCorrect),
    scoreDeltas,
    summary: outcome === "imposter-caught" ? "The imposter was caught." : "The imposter got away."
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
