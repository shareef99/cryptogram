/**
 * Deterministic, seeded pseudo-random number generator.
 *
 * The game must NOT use `Math.random()`: a puzzle's cipher is derived from its
 * id so the same puzzle always looks identical across sessions and devices.
 * This module provides a tiny, fast, fully deterministic PRNG (mulberry32) plus
 * a string/number hash to turn a puzzle id (or any seed value) into a 32-bit
 * integer seed.
 */

/**
 * Hash an arbitrary string/number into a 32-bit unsigned integer seed.
 * Based on the xmur3 hash. Stable across platforms.
 */
export function hashSeed(input: string | number): number {
  const str = String(input);
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/**
 * A deterministic random source seeded by a single value.
 * Two `Rng` instances created with the same seed produce identical sequences.
 */
export class Rng {
  private state: number;

  constructor(seed: string | number) {
    // Force a non-zero state; mulberry32 degenerates at state 0.
    this.state = hashSeed(seed) || 0x9e3779b9;
  }

  /** Next float in the half-open interval [0, 1). */
  next(): number {
    // mulberry32
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in the half-open interval [0, maxExclusive). */
  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  /**
   * Return a new array with the items shuffled (Fisher–Yates).
   * Does not mutate the input.
   */
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /** Pick one item from a non-empty array. */
  pick<T>(items: readonly T[]): T {
    return items[this.int(items.length)];
  }
}
