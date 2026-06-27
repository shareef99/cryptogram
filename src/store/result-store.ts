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
