/**
 * Pure month-calendar helpers (no DB, no I/O — unit-testable).
 *
 * Dates are local 'YYYY-MM-DD' strings throughout (string comparison is a valid
 * chronological compare for that format), consistent with the streak helpers.
 */

import type { CalendarCell } from '../types/daily';

import { localDateString } from './streak';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** 'YYYY-MM' month key for a date string or (year, month1-12). */
export function monthKey(year: number, month1: number): string {
  return `${year}-${String(month1).padStart(2, '0')}`;
}

/** Human label, e.g. "June 2026". `month1` is 1–12. */
export function monthLabel(year: number, month1: number): string {
  return `${MONTH_NAMES[month1 - 1]} ${year}`;
}

/** Number of days in a month. `month1` is 1–12. */
export function daysInMonth(year: number, month1: number): number {
  return new Date(year, month1, 0).getDate();
}

/**
 * Build a Sunday-first grid for the month: leading blank padding cells to align
 * the 1st under its weekday, then one cell per day. `month1` is 1–12.
 * `today` and `doneDates` decide each day's state.
 */
export function buildMonthGrid(
  year: number,
  month1: number,
  today: string,
  doneDates: ReadonlySet<string>,
): CalendarCell[] {
  const firstWeekday = new Date(year, month1 - 1, 1).getDay(); // 0 = Sunday
  const total = daysInMonth(year, month1);

  const cells: CalendarCell[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ date: null, day: 0, isToday: false, isFuture: false, done: false });
  }
  for (let day = 1; day <= total; day++) {
    const date = `${year}-${String(month1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({
      date,
      day,
      isToday: date === today,
      isFuture: date > today,
      done: doneDates.has(date),
    });
  }
  return cells;
}

/** Step a (year, month1) by `delta` months, wrapping the year. */
export function shiftMonth(year: number, month1: number, delta: number): { year: number; month1: number } {
  const zero = (year * 12 + (month1 - 1)) + delta;
  return { year: Math.floor(zero / 12), month1: (zero % 12) + 1 };
}

/** All elapsed days of a month up to and including `today` (for completion checks). */
export function elapsedDaysOfMonth(year: number, month1: number, today: string): string[] {
  const total = daysInMonth(year, month1);
  const out: string[] = [];
  for (let day = 1; day <= total; day++) {
    const date = `${year}-${String(month1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (date > today) break;
    out.push(date);
  }
  return out;
}

/** Today's local date — convenience wrapper so callers don't import streak too. */
export function todayString(): string {
  return localDateString(new Date());
}
