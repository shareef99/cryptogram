/**
 * Bridges the in-memory game store to SQLite: debounced autosave of guesses
 * while playing (so a puzzle can be resumed), and a one-shot "mark solved" when
 * the puzzle is won. Coin/streak rewards layer on top in later phases via
 * `onSolved`.
 */

import { useEffect, useRef } from 'react';

import { getDatabase, markSolved, saveInProgress } from '@/db';
import { useGameStore } from '@/store/game-store';

const AUTOSAVE_MS = 400;

type Options = {
  /** Called once when the puzzle transitions to solved, after it is persisted. */
  onSolved?: (info: { quoteId: number; timeSeconds: number }) => void;
};

export function usePersistProgress(quoteId: number | null, options: Options = {}) {
  const guesses = useGameStore((s) => s.cellGuesses);
  const status = useGameStore((s) => s.status);
  const startedAt = useGameStore((s) => s.startedAt);
  const givenCount = useGameStore((s) => s.givenCount);
  const solvedHandled = useRef(false);
  const onSolvedRef = useRef(options.onSolved);
  onSolvedRef.current = options.onSolved;

  // Reset the one-shot guard whenever a different puzzle loads.
  useEffect(() => {
    solvedHandled.current = false;
  }, [quoteId]);

  // Debounced autosave of in-progress guesses. Skip empty state so merely
  // opening a puzzle doesn't create an "in-progress" row / Continue entry.
  useEffect(() => {
    if (quoteId == null || status !== 'playing' || !startedAt) return;
    // Don't persist until the player has solved at least one non-given cell.
    if (Object.keys(guesses).length <= givenCount) return;
    const handle = setTimeout(() => {
      getDatabase()
        .then((db) => saveInProgress(db, quoteId, guesses, startedAt))
        .catch(() => {});
    }, AUTOSAVE_MS);
    return () => clearTimeout(handle);
  }, [quoteId, guesses, status, startedAt, givenCount]);

  // Mark solved exactly once on win.
  useEffect(() => {
    if (quoteId == null || status !== 'won' || !startedAt || solvedHandled.current) return;
    solvedHandled.current = true;
    const finalGuesses = useGameStore.getState().cellGuesses;
    const timeSeconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
    getDatabase()
      .then((db) =>
        markSolved(db, quoteId, {
          guesses: finalGuesses,
          timeSeconds,
          hintsUsed: 0,
          solvedAt: Date.now(),
        }),
      )
      .then(() => onSolvedRef.current?.({ quoteId, timeSeconds }))
      .catch(() => {});
  }, [quoteId, status, startedAt]);
}
