/**
 * Database schema constants.
 *
 * The bundled asset DB (`assets/db/cryptogram.db`, built by `scripts/build-db.ts`)
 * ships read-only content: the `quotes` and `meta` tables. On first launch it is
 * copied to a working database; the user-data tables below are then created in
 * that same working copy, so content and progress live in one file and joins
 * (e.g. "next unsolved quote") need no ATTACH.
 */

/** Working database filename (in the on-device SQLite directory). */
export const DB_NAME = 'cryptogram.db';

/** Content schema/version shipped in the bundled asset. Mirrors build-db.ts. */
export const CONTENT_VERSION = 1;

/**
 * User-data tables, created on-device after the content DB is imported.
 * Idempotent: safe to run on every launch.
 */
export const USER_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS progress (
  quote_id     INTEGER PRIMARY KEY,
  status       TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress' | 'solved'
  guesses      TEXT,                                -- JSON: code(number) -> letter
  hints_used   INTEGER NOT NULL DEFAULT 0,
  time_seconds INTEGER NOT NULL DEFAULT 0,
  started_at   INTEGER,
  solved_at    INTEGER
);

CREATE TABLE IF NOT EXISTS player (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  coins           INTEGER NOT NULL DEFAULT 0,
  hint2_count     INTEGER NOT NULL DEFAULT 0,
  current_streak  INTEGER NOT NULL DEFAULT 0,
  longest_streak  INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_activity (
  date           TEXT PRIMARY KEY,   -- local YYYY-MM-DD
  levels_cleared INTEGER NOT NULL DEFAULT 0,
  coins_earned   INTEGER NOT NULL DEFAULT 0
);
`;

/** Ensures the single player profile row exists. */
export const SEED_PLAYER_SQL = `INSERT OR IGNORE INTO player (id) VALUES (1);`;
