/**
 * Content sync: merge newly-shipped quotes into an already-installed device's
 * working database.
 *
 * The bundled content DB is only copied on FIRST launch (see database.ts), so an
 * app update that ships more quotes would otherwise never reach existing users.
 * On launch we compare the bundled CONTENT_VERSION against the version recorded
 * in the working DB's `meta` table; when it's newer we stage a fresh copy of the
 * bundled asset and additively merge its quotes.
 *
 * Merge is **additive and matched by text**: existing quotes keep their ids (so
 * the player's solved-progress, keyed by quote_id, stays intact) and only
 * genuinely new quotes are inserted with fresh ids. Quotes dropped from a newer
 * build are left in place (harmless) rather than deleted.
 */

import * as SQLite from 'expo-sqlite';

import { CONTENT_VERSION } from './schema';

const STAGING_DB = 'cryptogram-content-staging.db';

type IncomingQuote = {
  text: string;
  author: string | null;
  category: string | null;
  difficulty: number;
  letter_count: number;
  length: number;
};

/** Read the content version recorded in the working DB (0 if absent). */
async function getDbContentVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  try {
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM meta WHERE key = 'content_version'",
    );
    const n = row ? Number(row.value) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/**
 * Merge bundled quotes into `db` if the shipped content is newer. Returns the
 * number of quotes added (0 when already up to date). Never throws — a failed
 * sync leaves the existing content usable.
 */
export async function syncContent(db: SQLite.SQLiteDatabase, assetId: number): Promise<number> {
  const dbVersion = await getDbContentVersion(db);
  if (CONTENT_VERSION <= dbVersion) return 0;

  let added = 0;
  try {
    // Stage a fresh copy of the bundled content and read its quotes.
    await SQLite.importDatabaseFromAssetAsync(STAGING_DB, { assetId, forceOverwrite: true });
    const staging = await SQLite.openDatabaseAsync(STAGING_DB);
    try {
      const incoming = await staging.getAllAsync<IncomingQuote>(
        'SELECT text, author, category, difficulty, letter_count, length FROM quotes',
      );
      const existing = new Set(
        (await db.getAllAsync<{ text: string }>('SELECT text FROM quotes')).map((r) => r.text),
      );
      const fresh = incoming.filter((q) => !existing.has(q.text));

      if (fresh.length > 0) {
        await db.withTransactionAsync(async () => {
          const stmt = await db.prepareAsync(
            `INSERT INTO quotes (text, author, category, difficulty, letter_count, length)
             VALUES ($text, $author, $category, $difficulty, $letterCount, $length)`,
          );
          try {
            for (const q of fresh) {
              await stmt.executeAsync({
                $text: q.text,
                $author: q.author,
                $category: q.category,
                $difficulty: q.difficulty,
                $letterCount: q.letter_count,
                $length: q.length,
              });
            }
          } finally {
            await stmt.finalizeAsync();
          }
        });
        added = fresh.length;
      }

      // Record the merged version so the sync is a no-op next launch.
      await db.runAsync(
        `INSERT INTO meta (key, value) VALUES ('content_version', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        String(CONTENT_VERSION),
      );
    } finally {
      await staging.closeAsync();
      await SQLite.deleteDatabaseAsync(STAGING_DB).catch(() => {});
    }
  } catch {
    /* best-effort: keep the current content on any failure */
  }
  return added;
}
