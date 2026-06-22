/**
 * Validation & derived-state helpers.
 *
 * A puzzle (from `puzzle.ts`) holds the solution; the player's progress is a set
 * of guesses mapping each cipher code to the letter they've assigned it. These
 * helpers combine the two to answer "is this solved?", "which letters are still
 * wrong?", and to support the two hint types.
 */

import type { Guesses, LetterCell, Puzzle } from '../types/game';

import { Rng } from './rng';

/** Normalize a guess slot to an uppercase letter or '' (empty). */
function guessFor(guesses: Guesses, code: number): string {
  const g = guesses[code];
  return g ? g.toUpperCase() : '';
}

/** True if the player has put any letter in this code. */
export function isCodeFilled(guesses: Guesses, code: number): boolean {
  return guessFor(guesses, code) !== '';
}

/** True if this code's guess matches its solution in the puzzle. */
export function isCodeCorrect(puzzle: Puzzle, guesses: Guesses, code: number): boolean {
  return guessFor(guesses, code) === puzzle.codeToSolution[code];
}

/** Convenience: is a specific letter cell currently correct? */
export function isCellCorrect(puzzle: Puzzle, guesses: Guesses, cell: LetterCell): boolean {
  return isCodeCorrect(puzzle, guesses, cell.code);
}

/** Every letter cell's code is guessed correctly. */
export function isSolved(puzzle: Puzzle, guesses: Guesses): boolean {
  return puzzle.codes.every((code) => isCodeCorrect(puzzle, guesses, code));
}

/** Codes that are not yet correct (either blank or wrong). */
export function unsolvedCodes(puzzle: Puzzle, guesses: Guesses): number[] {
  return puzzle.codes.filter((code) => !isCodeCorrect(puzzle, guesses, code));
}

/** Number of distinct codes solved correctly. */
export function solvedCodeCount(puzzle: Puzzle, guesses: Guesses): number {
  return puzzle.codes.length - unsolvedCodes(puzzle, guesses).length;
}

/** Fractional progress in [0, 1] over distinct codes. */
export function progress(puzzle: Puzzle, guesses: Guesses): number {
  if (puzzle.codes.length === 0) return 1;
  return solvedCodeCount(puzzle, guesses) / puzzle.codes.length;
}

/**
 * Codes whose guessed letter collides with another code's guess. In a valid
 * cryptogram each letter belongs to exactly one code, so duplicates are a useful
 * signal to flag in the UI. Blank guesses never conflict.
 */
export function conflictingCodes(guesses: Guesses): Set<number> {
  const byLetter = new Map<string, number[]>();
  for (const key of Object.keys(guesses)) {
    const code = Number(key);
    const letter = guessFor(guesses, code);
    if (!letter) continue;
    const list = byLetter.get(letter);
    if (list) list.push(code);
    else byLetter.set(letter, [code]);
  }
  const out = new Set<number>();
  for (const codes of byLetter.values()) {
    if (codes.length > 1) codes.forEach((c) => out.add(c));
  }
  return out;
}

/**
 * Render the current decoded text, using `blank` for any unfilled letter cell.
 * Symbol cells render literally; words are separated by single spaces.
 */
export function decodedText(puzzle: Puzzle, guesses: Guesses, blank = '·'): string {
  return puzzle.words
    .map((word) =>
      word
        .map((cell) => {
          if (cell.kind === 'symbol') return cell.char;
          const g = guessFor(guesses, cell.code);
          return g || blank;
        })
        .join(''),
    )
    .join(' ');
}

// --- Hint support ---------------------------------------------------------

/**
 * Pick a random still-unsolved code to reveal (Hint 2 "Lucky Reveal", or the
 * "Surprise me" option of Hint 1). Returns null if the puzzle is already solved.
 * Pass an `Rng` so game logic never touches `Math.random` directly.
 */
export function pickRandomUnsolvedCode(
  puzzle: Puzzle,
  guesses: Guesses,
  rng: Rng,
): number | null {
  const candidates = unsolvedCodes(puzzle, guesses);
  if (candidates.length === 0) return null;
  return rng.pick(candidates);
}

/**
 * Produce the guesses that result from revealing a code (placing its correct
 * letter). Returns a NEW guesses object; does not mutate the input.
 */
export function revealCode(puzzle: Puzzle, guesses: Guesses, code: number): Guesses {
  const letter = puzzle.codeToSolution[code];
  if (letter === undefined) return guesses;
  return { ...guesses, [code]: letter };
}
