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

/**
 * Version of the bundled content (quotes). The single source of truth — both
 * build-db.ts (stamps it into the asset's `meta`) and the runtime content sync
 * import this. **Bump it whenever you rebuild the DB with new/changed quotes**:
 * on the next launch after an app update, `syncContent` merges the new quotes
 * into already-installed devices (which keep their old DB otherwise).
 */
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

CREATE TABLE IF NOT EXISTS daily_result (
  date      TEXT PRIMARY KEY,   -- local YYYY-MM-DD of the daily challenge
  quote_id  INTEGER NOT NULL,   -- the deterministic quote for that date
  mistakes  INTEGER NOT NULL DEFAULT 0,
  solved_at INTEGER             -- epoch ms when solved (null = started, not solved)
);

CREATE TABLE IF NOT EXISTS daily_month_reward (
  month TEXT PRIMARY KEY        -- 'YYYY-MM' once its completion reward is granted
);

CREATE TABLE IF NOT EXISTS achievement (
  id          TEXT PRIMARY KEY, -- matches a definition in game/achievements.ts
  unlocked_at INTEGER NOT NULL  -- epoch ms
);
`;

/** Ensures the single player profile row exists. */
export const SEED_PLAYER_SQL = `INSERT OR IGNORE INTO player (id) VALUES (1);`;

/**
 * On-device user-data format version. Bumped whenever the shape of stored user
 * data changes in a way that needs a migration (e.g. the meaning of
 * `progress.guesses`). Tracked in the `settings` table (`user_data_version`) —
 * deliberately distinct from the bundled content DB's PRAGMA `user_version`,
 * which versions the shipped quotes.
 */
export const USER_DATA_VERSION = 2;

/**
 * Ordered, append-only user-data migrations. On launch, every migration whose
 * `toVersion` is above the DB's stored version runs once, in order. A DB with no
 * stored version is treated as v1 (legacy / pre-versioning). Each `sql` must be
 * harmless to run against empty tables (fresh installs replay all of them).
 */
export const USER_DATA_MIGRATIONS: { toVersion: number; description: string; sql: string }[] = [
  {
    toVersion: 2,
    description:
      'Gameplay moved from a per-code substitution model to per-cell validated ' +
      'input. Old in-progress guesses are keyed by cipher code, which the per-cell ' +
      'resume path misreads as cell ids (corrupt board). Drop those in-progress ' +
      'rows; solved rows (status/stats/streak history) are preserved.',
    sql: `DELETE FROM progress WHERE status = 'in_progress';`,
  },
];
