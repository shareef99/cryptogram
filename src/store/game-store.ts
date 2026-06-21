/**
 * Per-puzzle play state (Zustand).
 *
 * Cells subscribe to narrow selector slices (`guesses[code]`, `selectedCode`),
 * so a keystroke re-renders only the affected cells — the core low-end-perf
 * discipline. Persistence/economy live in other stores and react to this one.
 */

import { create } from 'zustand';

import {
  buildPuzzle,
  isCodeCorrect,
  isSolved,
  letterCells,
  pickRandomUnsolvedCode,
  Rng,
  type Guesses,
  type Puzzle,
  type QuoteInput,
} from '@/game';

export type GameStatus = 'idle' | 'playing' | 'won';

/** 'pick' = Hint 1 active: the player taps an unsolved cell to reveal it. */
export type HintMode = 'idle' | 'pick';

type GameState = {
  puzzle: Puzzle | null;
  guesses: Guesses;
  selectedCode: number | null;
  status: GameStatus;
  startedAt: number | null;
  hintMode: HintMode;

  /** Load a quote into play, optionally resuming previous guesses. */
  load: (quote: QuoteInput, initialGuesses?: Guesses) => void;
  /** Select a cipher code (tapping a letter cell); null clears selection. */
  selectCode: (code: number | null) => void;
  /** A cell was pressed: reveal it if in Hint-1 pick mode, else select it. */
  pressCell: (code: number) => void;
  /** Assign a letter to the selected code, then auto-advance. */
  inputLetter: (letter: string) => void;
  /** Clear the selected code's letter. */
  deleteSelected: () => void;
  /** Force a code to its correct letter (hint reveal). */
  reveal: (code: number) => void;
  /** Reveal a random still-unsolved code; returns it (or null if none). */
  revealRandom: () => number | null;
  enterPickMode: () => void;
  exitPickMode: () => void;
  reset: () => void;
};

/** First unsolved letter cell at or after `fromId`, wrapping around. */
function nextUnsolvedCode(puzzle: Puzzle, guesses: Guesses, fromId: number): number | null {
  const cells = letterCells(puzzle);
  if (cells.length === 0) return null;
  const ordered = [...cells.filter((c) => c.id > fromId), ...cells.filter((c) => c.id <= fromId)];
  for (const c of ordered) {
    if (guesses[c.code] !== puzzle.codeToSolution[c.code]) return c.code;
  }
  return null;
}

function selectedCellId(puzzle: Puzzle, code: number | null): number {
  if (code == null) return -1;
  const cell = letterCells(puzzle).find((c) => c.code === code);
  return cell ? cell.id : -1;
}

export const useGameStore = create<GameState>((set, get) => ({
  puzzle: null,
  guesses: {},
  selectedCode: null,
  status: 'idle',
  startedAt: null,
  hintMode: 'idle',

  load: (quote, initialGuesses) => {
    const puzzle = buildPuzzle(quote);
    const guesses = initialGuesses ? { ...initialGuesses } : {};
    const solved = isSolved(puzzle, guesses);
    set({
      puzzle,
      guesses,
      selectedCode: solved ? null : nextUnsolvedCode(puzzle, guesses, -1),
      status: solved ? 'won' : 'playing',
      startedAt: Date.now(),
      hintMode: 'idle',
    });
  },

  selectCode: (code) => {
    if (get().status !== 'playing') return;
    set({ selectedCode: code });
  },

  pressCell: (code) => {
    const { puzzle, guesses, status, hintMode } = get();
    if (status !== 'playing' || !puzzle) return;
    if (hintMode === 'pick') {
      // Reveal the tapped cell only if it isn't already correct.
      if (!isCodeCorrect(puzzle, guesses, code)) {
        get().reveal(code);
      }
      set({ hintMode: 'idle' });
      return;
    }
    set({ selectedCode: code });
  },

  inputLetter: (letter) => {
    const { puzzle, guesses, selectedCode, status } = get();
    if (!puzzle || status !== 'playing' || selectedCode == null) return;
    const upper = letter.toUpperCase();
    if (upper < 'A' || upper > 'Z') return;

    const next: Guesses = { ...guesses, [selectedCode]: upper };
    const solved = isSolved(puzzle, next);
    set({
      guesses: next,
      status: solved ? 'won' : 'playing',
      selectedCode: solved
        ? null
        : (nextUnsolvedCode(puzzle, next, selectedCellId(puzzle, selectedCode)) ?? selectedCode),
    });
  },

  deleteSelected: () => {
    const { guesses, selectedCode, status } = get();
    if (status !== 'playing' || selectedCode == null) return;
    if (!guesses[selectedCode]) return;
    const next = { ...guesses };
    delete next[selectedCode];
    set({ guesses: next });
  },

  reveal: (code) => {
    const { puzzle, guesses } = get();
    if (!puzzle) return;
    const letter = puzzle.codeToSolution[code];
    if (letter === undefined) return;
    const next: Guesses = { ...guesses, [code]: letter };
    const solved = isSolved(puzzle, next);
    set({
      guesses: next,
      status: solved ? 'won' : 'playing',
      selectedCode: solved ? null : nextUnsolvedCode(puzzle, next, selectedCellId(puzzle, code)),
    });
  },

  revealRandom: () => {
    const { puzzle, guesses } = get();
    if (!puzzle) return null;
    // Hint randomness need not be reproducible; vary the seed by progress.
    const rng = new Rng(`${puzzle.id}-${Object.keys(guesses).length}-${Date.now()}`);
    const code = pickRandomUnsolvedCode(puzzle, guesses, rng);
    if (code == null) return null;
    get().reveal(code);
    return code;
  },

  enterPickMode: () => {
    if (get().status === 'playing') set({ hintMode: 'pick' });
  },
  exitPickMode: () => set({ hintMode: 'idle' }),

  reset: () =>
    set({
      puzzle: null,
      guesses: {},
      selectedCode: null,
      status: 'idle',
      startedAt: null,
      hintMode: 'idle',
    }),
}));
