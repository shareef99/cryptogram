/**
 * Tunable economy & reward values. Centralized so balancing is a one-file edit.
 * See docs/DECISIONS.md D10–D12.
 */

import type { Difficulty } from '@/db';

/** Base coins granted when a puzzle is cleared, by difficulty. */
export const COIN_REWARD: Record<Difficulty, number> = { 1: 10, 2: 20, 3: 30 };

/** Coin cost of Hint 1 ("Reveal") — reveals one chosen/random letter. */
export const HINT1_COST = 15;

/** Streak milestones → rewards (coins + scarce Hint-2 grants). */
export const STREAK_MILESTONES: { day: number; coins: number; hint2: number }[] = [
  { day: 3, coins: 30, hint2: 1 },
  { day: 7, coins: 75, hint2: 2 },
  { day: 14, coins: 150, hint2: 3 },
  { day: 30, coins: 400, hint2: 5 },
];
