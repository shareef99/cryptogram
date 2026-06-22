/**
 * Per-quote progress: the player's current guesses (for resume), solved status,
 * hints used, and timing.
 */

import type { SQLiteDatabase } from 'expo-sqlite';

import type { Guesses, ProgressRow } from '@/types';

export async function getProgress(
  db: SQLiteDatabase,
  quoteId: number,
): Promise<ProgressRow | null> {
  return db.getFirstAsync<ProgressRow>('SELECT * FROM progress WHERE quote_id = ?', quoteId);
}

/** Parse the stored guesses JSON back into a Guesses map (string keys work as numeric indices). */
export function parseGuesses(json: string | null): Guesses {
  if (!json) return {};
  try {
    return JSON.parse(json) as Guesses;
  } catch {
    return {};
  }
}

/** Create or update the in-progress row with the latest guesses. No-op if already solved. */
export async function saveInProgress(
  db: SQLiteDatabase,
  quoteId: number,
  guesses: Guesses,
  startedAt: number,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO progress (quote_id, status, guesses, started_at)
       VALUES (?, 'in_progress', ?, ?)
     ON CONFLICT(quote_id) DO UPDATE SET
       guesses = excluded.guesses
     WHERE progress.status != 'solved'`,
    quoteId,
    JSON.stringify(guesses),
    startedAt,
  );
}

/** Mark a quote solved. Idempotent. Returns true if this call was the first solve. */
export async function markSolved(
  db: SQLiteDatabase,
  quoteId: number,
  opts: { guesses: Guesses; timeSeconds: number; hintsUsed: number; solvedAt: number },
): Promise<boolean> {
  const existing = await getProgress(db, quoteId);
  if (existing?.status === 'solved') return false;

  await db.runAsync(
    `INSERT INTO progress (quote_id, status, guesses, hints_used, time_seconds, solved_at)
       VALUES (?, 'solved', ?, ?, ?, ?)
     ON CONFLICT(quote_id) DO UPDATE SET
       status = 'solved',
       guesses = excluded.guesses,
       hints_used = excluded.hints_used,
       time_seconds = excluded.time_seconds,
       solved_at = excluded.solved_at`,
    quoteId,
    JSON.stringify(opts.guesses),
    opts.hintsUsed,
    opts.timeSeconds,
    opts.solvedAt,
  );
  return true;
}

/** Increment the hint counter for a quote's in-progress row. */
export async function incrementHints(db: SQLiteDatabase, quoteId: number): Promise<void> {
  await db.runAsync(
    `UPDATE progress SET hints_used = hints_used + 1 WHERE quote_id = ?`,
    quoteId,
  );
}
