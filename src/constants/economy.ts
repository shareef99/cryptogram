/**
 * Tunable economy & reward values. Centralized so balancing is a one-file edit.
 * See docs/DECISIONS.md D10–D12.
 */

import type { Difficulty } from '@/types';

/** Base coins granted when a puzzle is cleared, by difficulty (4 = long). */
export const COIN_REWARD: Record<Difficulty, number> = { 1: 10, 2: 20, 3: 30, 4: 50 };

/** Coin cost of Hint 1 ("Reveal") — reveals one chosen/random letter. */
export const HINT1_COST = 15;

/** Coins granted for watching a rewarded "free coins" ad on the home screen. */
export const COIN_AD_BONUS = 25;

/**
 * How many distinct letters to pre-reveal at the start of a puzzle, to give the
 * player a foothold. We reveal the MOST FREQUENT letters (they unlock the most
 * cells), counting ~20% of the puzzle's distinct letters, clamped to [1, 4].
 * Example: 7 distinct → 1, 13 → 3, 18+ → 4.
 */
export const STARTING_REVEAL_FRACTION = 0.2;
export const STARTING_REVEAL_MIN = 1;
export const STARTING_REVEAL_MAX = 4;

/** Streak milestones → rewards (coins + scarce Hint-2 grants). */
export const STREAK_MILESTONES: { day: number; coins: number; hint2: number }[] = [
  { day: 3, coins: 30, hint2: 1 },
  { day: 7, coins: 75, hint2: 2 },
  { day: 14, coins: 150, hint2: 3 },
  { day: 30, coins: 400, hint2: 5 },
];

/** One-time reward for completing every daily challenge in a calendar month. */
export const DAILY_MONTH_REWARD = { coins: 250, hint2: 3 };
