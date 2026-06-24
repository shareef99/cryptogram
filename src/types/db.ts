/**
 * Database row & query-result types.
 */

export type Difficulty = 1 | 2 | 3 | 4; // 4 = long

/** A row from the `quotes` table (snake_case as stored). */
export type QuoteRow = {
  id: number;
  text: string;
  author: string | null;
  category: string | null;
  difficulty: number;
  letter_count: number;
  length: number;
};

export type QuoteCounts = {
  total: number;
  solved: number;
  byDifficulty: Record<Difficulty, { total: number; solved: number }>;
};

export type ProgressRow = {
  quote_id: number;
  status: 'in_progress' | 'solved';
  guesses: string | null;
  hints_used: number;
  time_seconds: number;
  started_at: number | null;
  solved_at: number | null;
};

export type PlayerRow = {
  id: number;
  coins: number;
  hint2_count: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
};

export type Milestone = { day: number; coins: number; hint2: number };

export type LevelClearedResult = {
  isNewActiveDay: boolean;
  currentStreak: number;
  longestStreak: number;
  /** Set when this clear crossed a streak milestone (reward already granted). */
  milestone: Milestone | null;
};
