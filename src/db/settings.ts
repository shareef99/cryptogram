/**
 * Key/value settings (theme, sound, ads-removed flag, ...). Booleans are stored
 * as '1'/'0' strings.
 */

import type { SQLiteDatabase } from 'expo-sqlite';

export async function getSetting(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    key,
  );
  return row?.value ?? null;
}

export async function setSetting(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value,
  );
}

export async function getBoolSetting(
  db: SQLiteDatabase,
  key: string,
  fallback = false,
): Promise<boolean> {
  const v = await getSetting(db, key);
  return v === null ? fallback : v === '1';
}

export async function setBoolSetting(
  db: SQLiteDatabase,
  key: string,
  value: boolean,
): Promise<void> {
  await setSetting(db, key, value ? '1' : '0');
}

export const SETTING_KEYS = {
  adsRemoved: 'ads_removed',
  sound: 'sound_enabled',
} as const;
