/**
 * Types for the Daily challenge — one deterministic puzzle per calendar date,
 * a calendar of past/today/future days, and per-month completion rewards.
 */

/** A recorded attempt at a date's daily puzzle (present row = solved). */
export type DailyResult = {
  date: string; // local YYYY-MM-DD
  quoteId: number;
  mistakes: number;
  solvedAt: number | null;
};

/** One cell in the month calendar grid (blank padding cells have day = 0). */
export type CalendarCell = {
  /** Local YYYY-MM-DD, or null for leading blank padding cells. */
  date: string | null;
  /** Day of month (1–31), or 0 for padding. */
  day: number;
  isToday: boolean;
  /** After today — not yet playable. */
  isFuture: boolean;
  /** The daily for this date has been solved. */
  done: boolean;
};
