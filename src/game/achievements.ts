/**
 * Achievement catalog + evaluation (pure — no DB/I/O, unit-testable).
 *
 * Each definition pairs display info with a `check` over the per-solve stat
 * context. Order here is the display order on the achievements screen. IDs are
 * stable strings persisted in the `achievement` table — never rename them.
 */

import type { Achievement, AchievementContext } from '@/types';

export type AchievementDef = Achievement & { check: (c: AchievementContext) => boolean };

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_solve',
    title: 'First Crack',
    description: 'Solve your first puzzle',
    emoji: '🔓',
    check: (c) => c.totalSolved >= 1,
  },
  {
    id: 'flawless',
    title: 'Flawless',
    description: 'Solve a puzzle with no mistakes',
    emoji: '⭐',
    check: (c) => c.mistakes === 0,
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Solve a puzzle in under 60 seconds',
    emoji: '⚡',
    check: (c) => c.timeSeconds > 0 && c.timeSeconds <= 60,
  },
  {
    id: 'marathoner',
    title: 'Marathoner',
    description: 'Solve a Long puzzle',
    emoji: '📜',
    check: (c) => c.difficulty === 4,
  },
  {
    id: 'solve_10',
    title: 'Getting Warm',
    description: 'Solve 10 puzzles',
    emoji: '🔥',
    check: (c) => c.totalSolved >= 10,
  },
  {
    id: 'solve_50',
    title: 'Codebreaker',
    description: 'Solve 50 puzzles',
    emoji: '🧠',
    check: (c) => c.totalSolved >= 50,
  },
  {
    id: 'solve_100',
    title: 'Cryptomaster',
    description: 'Solve 100 puzzles',
    emoji: '👑',
    check: (c) => c.totalSolved >= 100,
  },
  {
    id: 'streak_7',
    title: 'On a Roll',
    description: 'Reach a 7-day streak',
    emoji: '📅',
    check: (c) => c.longestStreak >= 7,
  },
  {
    id: 'streak_30',
    title: 'Unstoppable',
    description: 'Reach a 30-day streak',
    emoji: '🏆',
    check: (c) => c.longestStreak >= 30,
  },
  {
    id: 'daily_7',
    title: 'Daily Devotee',
    description: 'Complete 7 daily challenges',
    emoji: '🗓️',
    check: (c) => c.dailyCount >= 7,
  },
];

/** Ids of every achievement whose condition is currently satisfied. */
export function evaluateUnlocked(ctx: AchievementContext): string[] {
  return ACHIEVEMENTS.filter((a) => a.check(ctx)).map((a) => a.id);
}
