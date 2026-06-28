/**
 * Read-only queries over the bundled `quotes` content.
 *
 * Rows map cleanly onto the game's `QuoteInput`, so `toQuoteInput` hands a row
 * straight to `buildPuzzle`. "Unsolved" joins against the on-device `progress`
 * table (same working DB, no ATTACH needed).
 */

import type { SQLiteDatabase } from 'expo-sqlite';

import type { Difficulty, QuoteCounts, QuoteInput, QuoteRow } from '@/types';

import { getSetting, setSetting, SETTING_KEYS } from './settings';

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

// Letters that are genuinely rare in English; their presence makes a puzzle
// harder (fewer occurrences leak less information). Used to enrich the "hard"
// slot beyond pure length.
const RARE_LETTERS = ['j', 'q', 'x', 'z', 'k'];
const RARE_LIKE = RARE_LETTERS.map(() => 'q.text LIKE ?').join(' OR ');
const RARE_PARAMS = RARE_LETTERS.map((l) => `%${l}%`);

/**
 * A random unsolved "hard" quote: hard-by-length (difficulty 3) OR a non-long
 * puzzle containing rare letters. Excludes the very-long (difficulty 4) tier so
 * the rotation stays brisk. Returns null only when none are left.
 */
export async function getRandomUnsolvedHardQuote(db: SQLiteDatabase): Promise<QuoteRow | null> {
  return db.getFirstAsync<QuoteRow>(
    `SELECT q.* FROM quotes q
       LEFT JOIN progress p ON p.quote_id = q.id AND p.status = 'solved'
      WHERE p.quote_id IS NULL
        AND (q.difficulty = 3 OR (q.difficulty <= 3 AND (${RARE_LIKE})))
      ORDER BY RANDOM() LIMIT 1`,
    ...RARE_PARAMS,
  );
}

// The fixed difficulty rotation: 1 easy → 2 medium → 1 hard, repeating.
const PLAY_SEQUENCE: Difficulty[] = [1, 2, 2, 3];

/**
 * Next puzzle in the auto-rotation. Reads a persisted counter to pick the slot
 * (easy/medium/hard), selects an unsolved quote for it (hard is rare-letter
 * aware), advances the counter, and falls back to any unsolved quote if a slot
 * is exhausted.
 */
export async function getSequencedUnsolvedQuote(db: SQLiteDatabase): Promise<QuoteRow | null> {
  const count = Number((await getSetting(db, SETTING_KEYS.playCount)) ?? '0') || 0;
  const difficulty = PLAY_SEQUENCE[count % PLAY_SEQUENCE.length];

  const row =
    difficulty === 3
      ? await getRandomUnsolvedHardQuote(db)
      : await getRandomUnsolvedQuote(db, difficulty);
  const chosen = row ?? (await getRandomUnsolvedQuote(db));

  await setSetting(db, SETTING_KEYS.playCount, String(count + 1));
  return chosen;
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
