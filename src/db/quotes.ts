/**
 * Read-only queries over the bundled `quotes` content.
 *
 * Rows map cleanly onto the game's `QuoteInput`, so `toQuoteInput` hands a row
 * straight to `buildPuzzle`. "Unsolved" joins against the on-device `progress`
 * table (same working DB, no ATTACH needed).
 */

import type { SQLiteDatabase } from 'expo-sqlite';

import type { Difficulty, QuoteCounts, QuoteInput, QuoteRow } from '@/types';

/** Convert a DB row into the shape `buildPuzzle` expects. */
export function toQuoteInput(row: QuoteRow): QuoteInput {
  return { id: row.id, text: row.text, author: row.author ?? undefined };
}

export async function getQuoteById(
  db: SQLiteDatabase,
  id: number,
): Promise<QuoteRow | null> {
  return db.getFirstAsync<QuoteRow>('SELECT * FROM quotes WHERE id = ?', id);
}

/**
 * A random quote the player has not solved yet, optionally constrained to a
 * difficulty. Returns null only when every matching quote is solved.
 */
export async function getRandomUnsolvedQuote(
  db: SQLiteDatabase,
  difficulty?: Difficulty,
): Promise<QuoteRow | null> {
  return db.getFirstAsync<QuoteRow>(
    `SELECT q.* FROM quotes q
       LEFT JOIN progress p ON p.quote_id = q.id AND p.status = 'solved'
      WHERE p.quote_id IS NULL
        AND ($difficulty IS NULL OR q.difficulty = $difficulty)
      ORDER BY RANDOM()
      LIMIT 1`,
    { $difficulty: difficulty ?? null },
  );
}

/** The most recently started, still-in-progress quote (for "Continue"). */
export async function getInProgressQuote(db: SQLiteDatabase): Promise<QuoteRow | null> {
  return db.getFirstAsync<QuoteRow>(
    `SELECT q.* FROM quotes q
       JOIN progress p ON p.quote_id = q.id
      WHERE p.status = 'in_progress'
      ORDER BY p.started_at DESC
      LIMIT 1`,
  );
}

/** Progress summary for the home screen. */
export async function getQuoteCounts(db: SQLiteDatabase): Promise<QuoteCounts> {
  const rows = await db.getAllAsync<{ difficulty: Difficulty; total: number; solved: number }>(
    `SELECT q.difficulty AS difficulty,
            COUNT(*) AS total,
            SUM(CASE WHEN p.status = 'solved' THEN 1 ELSE 0 END) AS solved
       FROM quotes q
       LEFT JOIN progress p ON p.quote_id = q.id
      GROUP BY q.difficulty`,
  );

  const byDifficulty = {
    1: { total: 0, solved: 0 },
    2: { total: 0, solved: 0 },
    3: { total: 0, solved: 0 },
    4: { total: 0, solved: 0 },
  } as Record<Difficulty, { total: number; solved: number }>;

  let total = 0;
  let solved = 0;
  for (const r of rows) {
    byDifficulty[r.difficulty] = { total: r.total, solved: r.solved ?? 0 };
    total += r.total;
    solved += r.solved ?? 0;
  }
  return { total, solved, byDifficulty };
}
