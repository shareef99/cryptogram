/**
 * Pure streak & local-date helpers (no DB, no I/O — unit-testable).
 *
 * Streaks are computed by comparing local calendar-date strings (YYYY-MM-DD),
 * never raw timestamps, so they're immune to timezone/DST drift.
 */

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

export type StreakUpdate = {
  /** The streak length after accounting for today. */
  streak: number;
  /** True if today is the first active day recorded (i.e. streak advanced). */
  isNewActiveDay: boolean;
};

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
