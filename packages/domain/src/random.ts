export type RandomSource = () => number;

export function createSeededRng(seed: number): RandomSource {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let result = state;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(maxExclusive: number, rng: RandomSource): number {
  return Math.floor(rng() * maxExclusive);
}

export function randomItem<T>(items: readonly T[], rng: RandomSource): T {
  if (items.length === 0) {
    throw new Error("Cannot pick from an empty list.");
  }

  return items[randomInt(items.length, rng)] as T;
}

export function shuffle<T>(items: readonly T[], rng: RandomSource): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1, rng);
    [copy[index], copy[swapIndex]] = [copy[swapIndex] as T, copy[index] as T];
  }

  return copy;
}
