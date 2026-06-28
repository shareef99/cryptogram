/**
 * Achievement persistence + unlock detection. Only unlocked ids are stored; the
 * catalog (and conditions) live in game/achievements.ts.
 */

import type { SQLiteDatabase } from 'expo-sqlite';

import { ACHIEVEMENTS } from '@/game/achievements';
import type { Achievement, Difficulty, UnlockedAchievement } from '@/types';

/** Set of unlocked achievement ids. */
export async function getUnlockedIds(db: SQLiteDatabase): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM achievement');
  return new Set(rows.map((r) => r.id));
}

/** Unlocked achievements joined with their catalog display info (newest first). */
export async function getUnlockedAchievements(db: SQLiteDatabase): Promise<UnlockedAchievement[]> {
  const rows = await db.getAllAsync<{ id: string; unlocked_at: number }>(
    'SELECT id, unlocked_at FROM achievement',
  );
  const at = new Map(rows.map((r) => [r.id, r.unlocked_at]));
  return ACHIEVEMENTS.filter((a) => at.has(a.id))
    .map((a) => ({ id: a.id, title: a.title, description: a.description, emoji: a.emoji, unlockedAt: at.get(a.id)! }))
    .sort((x, y) => y.unlockedAt - x.unlockedAt);
}

type PerSolve = {
  mistakes: number;
  timeSeconds: number;
  difficulty: Difficulty;
  currentStreak: number;
  longestStreak: number;
};

/**
 * Evaluate the catalog against current stats + this solve, unlock any newly
 * satisfied achievements, and return their display info (for the unlock modal).
 */
export async function checkAndUnlockAchievements(
  db: SQLiteDatabase,
  perSolve: PerSolve,
): Promise<Achievement[]> {
  const totalSolved =
    (await db.getFirstAsync<{ c: number }>("SELECT COUNT(*) c FROM progress WHERE status = 'solved'"))?.c ?? 0;
  const dailyCount =
    (await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) c FROM daily_result WHERE solved_at IS NOT NULL'))?.c ?? 0;

  const ctx = { ...perSolve, totalSolved, dailyCount };
  const unlocked = await getUnlockedIds(db);
  const newly = ACHIEVEMENTS.filter((a) => !unlocked.has(a.id) && a.check(ctx));
  if (newly.length === 0) return [];

  const now = Date.now();
  for (const a of newly) {
    await db.runAsync('INSERT OR IGNORE INTO achievement (id, unlocked_at) VALUES (?, ?)', a.id, now);
  }
  return newly.map((a) => ({ id: a.id, title: a.title, description: a.description, emoji: a.emoji }));
}
