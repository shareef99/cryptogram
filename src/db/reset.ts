/**
 * Reset all user progress & economy back to a fresh start. Content (quotes) and
 * settings are preserved. Used by the "Reset progress" action in Settings.
 */

import type { SQLiteDatabase } from 'expo-sqlite';

import { SEED_PLAYER_SQL } from './schema';

export async function resetProgress(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DELETE FROM progress;
    DELETE FROM daily_activity;
    DELETE FROM player;
  `);
  await db.runAsync(SEED_PLAYER_SQL);
}
