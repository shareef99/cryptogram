/**
 * Carries the just-solved puzzle's result to the dedicated result screen (so we
 * don't serialize the whole quote through route params).
 */

import { create } from 'zustand';

import type { Difficulty, Milestone, MonthReward } from '@/types';

export type PuzzleResult = {
  quoteId: number;
  quote: string;
  author: string | null;
  coinsEarned: number;
  difficulty: Difficulty;
  milestone: Milestone | null;
  monthReward?: MonthReward | null;
  // For the share card / achievements.
  mistakes: number;
  timeSeconds: number;
  streak: number;
  daily: string | null; // YYYY-MM-DD when this was a daily challenge
};

type ResultState = {
  result: PuzzleResult | null;
  setResult: (r: PuzzleResult) => void;
  clear: () => void;
};

export const useResultStore = create<ResultState>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
  clear: () => set({ result: null }),
}));
