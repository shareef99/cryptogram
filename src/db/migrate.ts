/**
 * User-data migrations. The bundled content DB carries its own PRAGMA
 * `user_version`, so changes to on-device user data are versioned separately in
 * the `settings` table under `user_data_version`.
 *
 * `migrateUserData` upgrades the user tables from their stored version up to
 * USER_DATA_VERSION, running each pending migration once, in order. It runs on
 * every launch (after the user tables exist) and is a no-op once current.
 */

import type { SQLiteDatabase } from 'expo-sqlite';

import { USER_DATA_MIGRATIONS, USER_DATA_VERSION } from './schema';
import { SETTING_KEYS, getSetting, setSetting } from './settings';

/** Stored user-data version; absent or invalid is treated as 1 (pre-versioning). */
async function getUserDataVersion(db: SQLiteDatabase): Promise<number> {
  const raw = await getSetting(db, SETTING_KEYS.userDataVersion);
  const n = raw == null ? 1 : Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/** Upgrade on-device user data from its stored version to USER_DATA_VERSION. */
export async function migrateUserData(db: SQLiteDatabase): Promise<void> {
  const from = await getUserDataVersion(db);
  if (from >= USER_DATA_VERSION) return;

  for (const m of USER_DATA_MIGRATIONS) {
    if (m.toVersion > from) await db.execAsync(m.sql);
  }
  await setSetting(db, SETTING_KEYS.userDataVersion, String(USER_DATA_VERSION));
}
