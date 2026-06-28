/**
 * Builds the Wordle-style share text for a solved puzzle (pure, testable).
 *
 * The daily variant names the date so friends can compare the same puzzle; the
 * casual variant names the difficulty. Both lead with streak/flawless/time
 * brag-bait and end with the app link for discovery.
 */

import { SHARE_URL } from '@/constants/links';
import type { Difficulty } from '@/types';

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const DIFFICULTY_LABEL: Record<Difficulty, string> = { 1: 'Easy', 2: 'Medium', 3: 'Hard', 4: 'Long' };

function shortDate(date: string): string {
  const m = Number(date.slice(5, 7));
  const d = Number(date.slice(8, 10));
  return `${SHORT_MONTHS[m - 1]} ${d}`;
}

function clockTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export type ShareInfo = {
  daily: string | null; // YYYY-MM-DD if this was a daily, else null
  difficulty: Difficulty;
  streak: number;
  mistakes: number;
  timeSeconds: number;
};

export function buildShareText({ daily, difficulty, streak, mistakes, timeSeconds }: ShareInfo): string {
  const heading = daily
    ? `🧩 Cryptogram — Daily ${shortDate(daily)}`
    : `🧩 Cryptogram — ${DIFFICULTY_LABEL[difficulty]}`;

  const badges = [
    mistakes === 0 ? '⭐ Flawless' : `❌ ${mistakes} mistake${mistakes === 1 ? '' : 's'}`,
    `⏱ ${clockTime(timeSeconds)}`,
    streak > 0 ? `🔥 ${streak}-day streak` : null,
  ].filter(Boolean);

  return `${heading}\n${badges.join('  ·  ')}\n\nCrack the code: ${SHARE_URL}`;
}
