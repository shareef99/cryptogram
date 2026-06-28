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
  STARTING_REVEAL_FRACTION,
  STARTING_REVEAL_MAX,
  STARTING_REVEAL_MIN,
} from '@/constants/economy';
import { buildPuzzle, letterCells, Rng } from '@/game';
import { sounds } from '@/lib/sounds';
import type { CellGuesses, GameStatus, HintMode, LetterCell, Puzzle, QuoteInput } from '@/types';

export type { CellGuesses, GameStatus, HintMode } from '@/types';

export const MAX_MISTAKES = 3;

type GameState = {
  puzzle: Puzzle | null;
  /** Only correct, locked letters — keyed by cell id. */
  cellGuesses: CellGuesses;
  /** code -> ids of the cells using it. */
  cellsByCode: Record<number, number[]>;
  /** letter -> ids of the cells whose solution is that letter. */
  cellsByLetter: Record<string, number[]>;
  /** How many cells were pre-revealed as a starting foothold (not player progress). */
  givenCount: number;
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
  /** After a loss: keep the filled board, refill lives, and resume (ad continue). */
  revive: () => void;
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

/** Group a puzzle's letter cells by code and by solution letter. */
function buildCellMaps(puzzle: Puzzle) {
  const cellsByCode: Record<number, number[]> = {};
  const cellsByLetter: Record<string, number[]> = {};
  for (const c of letterCells(puzzle)) {
    (cellsByCode[c.code] ??= []).push(c.id);
    (cellsByLetter[c.solution] ??= []).push(c.id);
  }
  return { cellsByCode, cellsByLetter };
}

/**
 * Pre-reveal the most-frequent letters as a starting foothold. Returns the
 * given cells as a guesses map. Deterministic (frequency order, tie-break by
 * code), so a given puzzle always starts the same.
 */
function buildStartingGiven(
  puzzle: Puzzle,
  cellsByCode: Record<number, number[]>,
): CellGuesses {
  const count = Math.min(
    STARTING_REVEAL_MAX,
    Math.max(STARTING_REVEAL_MIN, Math.round(puzzle.codes.length * STARTING_REVEAL_FRACTION)),
  );
  const ranked = [...puzzle.codes].sort(
    (a, b) => cellsByCode[b].length - cellsByCode[a].length || a - b,
  );
  // Reveal ONE (deterministically-chosen) instance per starting letter — a
  // foothold, not a freebie. Seeded by puzzle id so a retry starts identically.
  const rng = new Rng(`given-${puzzle.id}`);
  const given: CellGuesses = {};
  for (const code of ranked.slice(0, count)) {
    given[rng.pick(cellsByCode[code])] = puzzle.codeToSolution[code];
  }
  return given;
}

export const useGameStore = create<GameState>((set, get) => ({
  puzzle: null,
  cellGuesses: {},
  cellsByCode: {},
  cellsByLetter: {},
  givenCount: 0,
  selectedCellId: null,
  mistakes: 0,
  wrongCellId: null,
  status: 'idle',
  startedAt: null,
  hintMode: 'idle',

  load: (quote, resume) => {
    const puzzle = buildPuzzle(quote);
    const { cellsByCode, cellsByLetter } = buildCellMaps(puzzle);
    // Resume restores saved progress (which already includes any givens). A fresh
    // puzzle gets a starting foothold of pre-revealed letters.
    const given = resume ? null : buildStartingGiven(puzzle, cellsByCode);
    const cellGuesses = resume ? { ...resume } : { ...given };
    const solved = allSolved(puzzle, cellGuesses);
    set({
      puzzle,
      cellsByCode,
      cellsByLetter,
      givenCount: given ? Object.keys(given).length : 0,
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
    const { puzzle, cellGuesses, selectedCellId, status } = get();
    if (status !== 'playing' || !puzzle) return;
    const cells = letterCells(puzzle);
    if (cells.length === 0) return;
    const n = cells.length;
    const from = Math.max(0, cells.findIndex((c) => c.id === selectedCellId));
    // Step in `dir`, skipping already-solved cells, until the nearest unfilled one.
    for (let step = 1; step <= n; step++) {
      const cand = cells[(((from + dir * step) % n) + n) % n];
      if (!isCellSolved(cellGuesses, cand)) {
        set({ selectedCellId: cand.id });
        return;
      }
    }
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
      sounds.play(solved ? 'win' : 'correct');
      set({
        cellGuesses: next,
        status: solved ? 'won' : 'playing',
        selectedCellId: solved ? null : nextUnsolvedCellId(puzzle, next, cell.id),
        wrongCellId: null,
      });
    } else {
      const nextMistakes = mistakes + 1;
      sounds.play('wrong');
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
    sounds.play(solved ? 'win' : 'reveal');
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

  revive: () => {
    const { puzzle, cellGuesses, status } = get();
    if (!puzzle || status !== 'lost') return;
    // Keep all solved cells; refill lives and continue from the next blank.
    set({
      mistakes: 0,
      wrongCellId: null,
      status: 'playing',
      selectedCellId: nextUnsolvedCellId(puzzle, cellGuesses, -1),
      hintMode: 'idle',
    });
  },

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
      cellsByCode: {},
      cellsByLetter: {},
      givenCount: 0,
      selectedCellId: null,
      mistakes: 0,
      wrongCellId: null,
      status: 'idle',
      startedAt: null,
      hintMode: 'idle',
    }),
}));
