/**
 * Per-puzzle play state (Zustand) — validated, per-cell input.
 *
 * The player selects a cell and types a letter; it's checked immediately against
 * that cell's solution. Correct letters lock into the cell (only that cell — no
 * auto-fill of same-code cells). A wrong letter flashes, clears, and costs one of
 * three lives; running out ends the puzzle. Cells subscribe to narrow selector
 * slices so a keystroke re-renders only the affected cells.
 */

import { create } from 'zustand';

import {
  buildPuzzle,
  letterCells,
  Rng,
  type LetterCell,
  type Puzzle,
  type QuoteInput,
} from '@/game';

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

/** 'pick' = Hint 1 active: the player taps an unsolved cell to reveal it. */
export type HintMode = 'idle' | 'pick';

export const MAX_MISTAKES = 3;

/** cellId -> the correct letter locked into that cell. */
export type CellGuesses = Record<number, string>;

type GameState = {
  puzzle: Puzzle | null;
  /** Only correct, locked letters — keyed by cell id. */
  cellGuesses: CellGuesses;
  selectedCellId: number | null;
  mistakes: number;
  /** Cell that just received a wrong guess (drives the red flash); cleared shortly after. */
  wrongCellId: number | null;
  status: GameStatus;
  startedAt: number | null;
  hintMode: HintMode;

  load: (quote: QuoteInput, resume?: CellGuesses) => void;
  selectCell: (cellId: number) => void;
  /** A cell was pressed: reveal it in Hint-1 pick mode, else select it. */
  pressCell: (cellId: number) => void;
  /** Move selection to the previous/next letter cell, wrapping around. */
  moveSelection: (dir: -1 | 1) => void;
  /** Validate a typed letter against the selected cell. */
  inputLetter: (letter: string) => void;
  /** Lock a cell's correct letter (hint reveal). */
  revealCell: (cellId: number) => void;
  /** Reveal a random still-unsolved cell; returns its id (or null). */
  revealRandom: () => number | null;
  enterPickMode: () => void;
  exitPickMode: () => void;
  /** Dev-only: instantly solve the current puzzle. */
  __devSolve: () => void;
  reset: () => void;
};

function isCellSolved(guesses: CellGuesses, cell: LetterCell): boolean {
  return guesses[cell.id] === cell.solution;
}

function allSolved(puzzle: Puzzle, guesses: CellGuesses): boolean {
  return letterCells(puzzle).every((c) => isCellSolved(guesses, c));
}

/** First unsolved letter cell after `fromId` (by position), wrapping around. */
function nextUnsolvedCellId(puzzle: Puzzle, guesses: CellGuesses, fromId: number): number | null {
  const cells = letterCells(puzzle);
  if (cells.length === 0) return null;
  const ordered = [...cells.filter((c) => c.id > fromId), ...cells.filter((c) => c.id <= fromId)];
  const target = ordered.find((c) => !isCellSolved(guesses, c));
  return target ? target.id : null;
}

export const useGameStore = create<GameState>((set, get) => ({
  puzzle: null,
  cellGuesses: {},
  selectedCellId: null,
  mistakes: 0,
  wrongCellId: null,
  status: 'idle',
  startedAt: null,
  hintMode: 'idle',

  load: (quote, resume) => {
    const puzzle = buildPuzzle(quote);
    const cellGuesses = resume ? { ...resume } : {};
    const solved = allSolved(puzzle, cellGuesses);
    set({
      puzzle,
      cellGuesses,
      selectedCellId: solved ? null : nextUnsolvedCellId(puzzle, cellGuesses, -1),
      mistakes: 0,
      wrongCellId: null,
      status: solved ? 'won' : 'playing',
      startedAt: Date.now(),
      hintMode: 'idle',
    });
  },

  selectCell: (cellId) => {
    if (get().status !== 'playing') return;
    set({ selectedCellId: cellId });
  },

  pressCell: (cellId) => {
    const { puzzle, cellGuesses, status, hintMode } = get();
    if (status !== 'playing' || !puzzle) return;
    if (hintMode === 'pick') {
      if (!cellGuesses[cellId]) get().revealCell(cellId);
      set({ hintMode: 'idle' });
      return;
    }
    set({ selectedCellId: cellId });
  },

  moveSelection: (dir) => {
    const { puzzle, selectedCellId, status } = get();
    if (status !== 'playing' || !puzzle) return;
    const cells = letterCells(puzzle);
    if (cells.length === 0) return;
    const idx = cells.findIndex((c) => c.id === selectedCellId);
    const nextIdx = (idx + dir + cells.length) % cells.length;
    set({ selectedCellId: cells[nextIdx].id });
  },

  inputLetter: (letter) => {
    const { puzzle, cellGuesses, selectedCellId, status, mistakes } = get();
    if (!puzzle || status !== 'playing' || selectedCellId == null) return;
    const upper = letter.toUpperCase();
    if (upper < 'A' || upper > 'Z') return;

    const cell = letterCells(puzzle).find((c) => c.id === selectedCellId);
    if (!cell || cellGuesses[cell.id]) return; // already solved cell

    if (upper === cell.solution) {
      const next: CellGuesses = { ...cellGuesses, [cell.id]: upper };
      const solved = allSolved(puzzle, next);
      set({
        cellGuesses: next,
        status: solved ? 'won' : 'playing',
        selectedCellId: solved ? null : nextUnsolvedCellId(puzzle, next, cell.id),
        wrongCellId: null,
      });
    } else {
      const nextMistakes = mistakes + 1;
      set({
        mistakes: nextMistakes,
        wrongCellId: cell.id,
        status: nextMistakes >= MAX_MISTAKES ? 'lost' : 'playing',
      });
      // Clear the flash marker shortly after so the animation can replay.
      setTimeout(() => {
        if (get().wrongCellId === cell.id) set({ wrongCellId: null });
      }, 500);
    }
  },

  revealCell: (cellId) => {
    const { puzzle, cellGuesses } = get();
    if (!puzzle) return;
    const cell = letterCells(puzzle).find((c) => c.id === cellId);
    if (!cell || cellGuesses[cellId]) return;
    const next: CellGuesses = { ...cellGuesses, [cellId]: cell.solution };
    const solved = allSolved(puzzle, next);
    set({
      cellGuesses: next,
      status: solved ? 'won' : 'playing',
      selectedCellId: solved ? null : nextUnsolvedCellId(puzzle, next, cellId),
    });
  },

  revealRandom: () => {
    const { puzzle, cellGuesses } = get();
    if (!puzzle) return null;
    const unsolved = letterCells(puzzle).filter((c) => !isCellSolved(cellGuesses, c));
    if (unsolved.length === 0) return null;
    const rng = new Rng(`${puzzle.id}-${Object.keys(cellGuesses).length}-${Date.now()}`);
    const cell = rng.pick(unsolved);
    get().revealCell(cell.id);
    return cell.id;
  },

  enterPickMode: () => {
    if (get().status === 'playing') set({ hintMode: 'pick' });
  },
  exitPickMode: () => set({ hintMode: 'idle' }),

  __devSolve: () => {
    const { puzzle } = get();
    if (!puzzle) return;
    const guesses: CellGuesses = {};
    for (const c of letterCells(puzzle)) guesses[c.id] = c.solution;
    set({ cellGuesses: guesses, status: 'won', selectedCellId: null, hintMode: 'idle' });
  },

  reset: () =>
    set({
      puzzle: null,
      cellGuesses: {},
      selectedCellId: null,
      mistakes: 0,
      wrongCellId: null,
      status: 'idle',
      startedAt: null,
      hintMode: 'idle',
    }),
}));
