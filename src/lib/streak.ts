/**
 * Pure streak & local-date helpers (no DB, no I/O — unit-testable).
 *
 * Streaks are computed by comparing local calendar-date strings (YYYY-MM-DD),
 * never raw timestamps, so they're immune to timezone/DST drift.
 */

import type { StreakUpdate } from '../types/streak';

export type { StreakUpdate } from '../types/streak';

/** Local calendar date as 'YYYY-MM-DD'. */
export function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Shift a 'YYYY-MM-DD' string by `n` days (handles month/year rollover). */
export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return localDateString(new Date(y, m - 1, d + n));
}

/**
 * Whether a streak is exactly one missed day from resetting and can still be
 * saved (a "freeze"): there's a live streak and the player was last active the
 * day before yesterday, i.e. they missed only yesterday.
 */
export function streakIsSavable(
  currentStreak: number,
  lastActiveDate: string | null,
  today: string,
): boolean {
  return currentStreak >= 1 && lastActiveDate === addDays(today, -2);
}

/**
 * Given the last active date, current streak, and today's date, compute the new
 * streak. Consecutive days increment; a gap resets to 1; same-day is a no-op.
 */
export function computeStreak(
  lastActive: string | null,
  currentStreak: number,
  today: string,
): StreakUpdate {
  if (lastActive === today) {
    return { streak: Math.max(currentStreak, 1), isNewActiveDay: false };
  }
  if (lastActive && lastActive === addDays(today, -1)) {
    return { streak: currentStreak + 1, isNewActiveDay: true };
  }
  return { streak: 1, isNewActiveDay: true };
}
