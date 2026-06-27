/**
 * Daily challenge data: the deterministic puzzle for a date, and per-date
 * results (for the calendar) + per-month completion-reward bookkeeping.
 *
 * The puzzle for a date is chosen by a date-seeded PRNG over a FIXED pool of the
 * lowest quote ids. The pool is capped so the mapping stays stable as the corpus
 * grows (content sync only appends new quotes with higher ids), which keeps
 * backfilled past days showing the same puzzle they always had.
 */

import type { SQLiteDatabase } from 'expo-sqlite';

import { Rng } from '@/game/rng';
import type { DailyResult, QuoteRow } from '@/types';

/** Stable selection pool: the lowest-id N quotes (well under the bundled corpus). */
const DAILY_POOL = 10000;

/** The deterministic quote for a given local date (same for everyone). */
export async function getDailyQuote(db: SQLiteDatabase, date: string): Promise<QuoteRow | null> {
  const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) c FROM quotes');
  const count = row?.c ?? 0;
  if (count === 0) return null;
  const pool = Math.min(count, DAILY_POOL);
  const offset = new Rng(`daily-${date}`).int(pool);
  return db.getFirstAsync<QuoteRow>('SELECT * FROM quotes ORDER BY id LIMIT 1 OFFSET ?', offset);
}

function mapResult(r: { date: string; quote_id: number; mistakes: number; solved_at: number | null }): DailyResult {
  return { date: r.date, quoteId: r.quote_id, mistakes: r.mistakes, solvedAt: r.solved_at };
}

/** The recorded result for a single date, or null if never solved. */
export async function getDailyResult(db: SQLiteDatabase, date: string): Promise<DailyResult | null> {
  const r = await db.getFirstAsync<{
    date: string; quote_id: number; mistakes: number; solved_at: number | null;
  }>('SELECT * FROM daily_result WHERE date = ?', date);
  return r ? mapResult(r) : null;
}

/** All results within [start, end] inclusive (YYYY-MM-DD) — for the calendar month. */
export async function getDailyResultsInRange(
  db: SQLiteDatabase,
  start: string,
  end: string,
): Promise<DailyResult[]> {
  const rows = await db.getAllAsync<{
    date: string; quote_id: number; mistakes: number; solved_at: number | null;
  }>('SELECT * FROM daily_result WHERE date >= ? AND date <= ? ORDER BY date', start, end);
  return rows.map(mapResult);
}

/** Record (or overwrite) a solved daily for a date. */
export async function recordDailyResult(
  db: SQLiteDatabase,
  date: string,
  quoteId: number,
  mistakes: number,
  solvedAt: number,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO daily_result (date, quote_id, mistakes, solved_at)
       VALUES (?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       quote_id = excluded.quote_id,
       mistakes = excluded.mistakes,
       solved_at = excluded.solved_at`,
    date,
    quoteId,
    mistakes,
    solvedAt,
  );
}

/** Whether this month's completion reward has already been granted. */
export async function isMonthRewardGranted(db: SQLiteDatabase, month: string): Promise<boolean> {
  const r = await db.getFirstAsync<{ month: string }>(
    'SELECT month FROM daily_month_reward WHERE month = ?',
    month,
  );
  return !!r;
}

/** Mark a month's completion reward as granted (idempotent). */
export async function markMonthRewardGranted(db: SQLiteDatabase, month: string): Promise<void> {
  await db.runAsync('INSERT OR IGNORE INTO daily_month_reward (month) VALUES (?)', month);
}
