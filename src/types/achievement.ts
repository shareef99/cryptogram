/**
 * Achievements — one-time unlockable badges that reward play milestones.
 */

import type { Difficulty } from './db';

/** Display shape of an achievement (the condition lives in game/achievements.ts). */
export type Achievement = {
  id: string;
  title: string;
  description: string;
  emoji: string;
};

/** An unlocked achievement with its unlock time. */
export type UnlockedAchievement = Achievement & { unlockedAt: number };

/** Stats evaluated to decide which achievements are unlocked, on each solve. */
export type AchievementContext = {
  totalSolved: number;
  currentStreak: number;
  longestStreak: number;
  dailyCount: number; // daily challenges completed
  mistakes: number; // this solve
  timeSeconds: number; // this solve
  difficulty: Difficulty; // this solve
};
