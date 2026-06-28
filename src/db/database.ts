/**
 * Database lifecycle: import the bundled content DB on first launch, open the
 * working copy, and ensure the on-device user tables exist.
 *
 * `getDatabase()` is a memoized async singleton — the first caller performs the
 * import + migration; everyone else awaits the same promise.
 */

import * as SQLite from 'expo-sqlite';

import { syncContent } from './content-sync';
import { migrateUserData } from './migrate';
import { DB_NAME, SEED_PLAYER_SQL, USER_TABLES_SQL } from './schema';

// Metro bundles the prebuilt DB as an asset (see metro.config.js → assetExts).
// `require` returns the numeric asset id consumed by expo-sqlite.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DB_ASSET_ID: number = require('../../assets/db/cryptogram.db');

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  // Copy the bundled content DB into the SQLite directory on first launch.
  // No-op on subsequent launches (forceOverwrite defaults to false), so user
  // data created below is preserved.
  await SQLite.importDatabaseFromAssetAsync(DB_NAME, { assetId: DB_ASSET_ID });

  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(USER_TABLES_SQL);
  await db.runAsync(SEED_PLAYER_SQL);
  // Upgrade incompatible user data left by older app versions (e.g. resume
  // guesses from the pre-per-cell model). Safe/no-op once already current.
  await migrateUserData(db);
  // Merge any quotes shipped since this device's DB was created (no-op on first
  // launch and when already current). Keeps user progress intact.
  await syncContent(db, DB_ASSET_ID);
  return db;
}

/** Get the shared, fully-initialized database. */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate().catch((err) => {
      // Reset so a later call can retry rather than reusing a rejected promise.
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

/** For tests / "reset progress": forget the cached handle (does not delete data). */
export function _resetDatabaseHandle(): void {
  dbPromise = null;
}
