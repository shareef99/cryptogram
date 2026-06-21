/**
 * Daily activity logging + streak advancement. Called once per cleared level:
 * records the day, advances/resets the streak from local dates, and grants any
 * streak-milestone reward (coins + scarce Hint-2) atomically.
 */

import type { SQLiteDatabase } from 'expo-sqlite';

import { STREAK_MILESTONES } from '@/constants/economy';
import { computeStreak } from '@/lib/streak';

import { addCoins, addHint2 } from './player';

export type Milestone = { day: number; coins: number; hint2: number };

export type LevelClearedResult = {
  isNewActiveDay: boolean;
  currentStreak: number;
  longestStreak: number;
  /** Set when this clear crossed a streak milestone (reward already granted). */
  milestone: Milestone | null;
};

export async function recordLevelCleared(
  db: SQLiteDatabase,
  today: string,
  coinsEarned: number,
): Promise<LevelClearedResult> {
  // 1. Log the day's activity.
  await db.runAsync(
    `INSERT INTO daily_activity (date, levels_cleared, coins_earned)
       VALUES (?, 1, ?)
     ON CONFLICT(date) DO UPDATE SET
       levels_cleared = levels_cleared + 1,
       coins_earned = coins_earned + excluded.coins_earned`,
    today,
    coinsEarned,
  );

  // 2. Advance the streak from local dates.
  const player = await db.getFirstAsync<{
    current_streak: number;
    longest_streak: number;
    last_active_date: string | null;
  }>('SELECT current_streak, longest_streak, last_active_date FROM player WHERE id = 1');

  const { streak, isNewActiveDay } = computeStreak(
    player?.last_active_date ?? null,
    player?.current_streak ?? 0,
    today,
  );
  const longest = Math.max(player?.longest_streak ?? 0, streak);

  await db.runAsync(
    'UPDATE player SET current_streak = ?, longest_streak = ?, last_active_date = ? WHERE id = 1',
    streak,
    longest,
    today,
  );

  // 3. Grant a milestone reward if this clear advanced the streak onto one.
  let milestone: Milestone | null = null;
  if (isNewActiveDay) {
    milestone = STREAK_MILESTONES.find((m) => m.day === streak) ?? null;
    if (milestone) {
      await addCoins(db, milestone.coins);
      await addHint2(db, milestone.hint2);
    }
  }

  return { isNewActiveDay, currentStreak: streak, longestStreak: longest, milestone };
}
