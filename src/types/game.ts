/**
 * Core game-domain types (cipher, puzzle structure, guesses). Pure type
 * declarations — no imports — so `src/game` can reference them with a relative
 * path and stay runnable by the tsx check scripts.
 */

/** A bijection between letters A–Z and code numbers 1–26. */
export type Cipher = {
  /** letter (A–Z) -> code number (1–26) */
  letterToCode: Record<string, number>;
  /** code number (1–26) -> letter (A–Z) */
  codeToLetter: Record<number, string>;
};

/** Raw quote handed to `buildPuzzle`. */
export type QuoteInput = {
  id: number;
  text: string;
  author?: string;
};

export type LetterCell = {
  kind: 'letter';
  /** Stable position index across the whole puzzle (0-based). */
  id: number;
  /** Correct uppercase letter A–Z. */
  solution: string;
  /** Cipher code shown to the player (1–26). */
  code: number;
};

export type SymbolCell = {
  kind: 'symbol';
  id: number;
  /** Literal character to render (punctuation, digit, etc.). */
  char: string;
};

export type Cell = LetterCell | SymbolCell;
export type Word = Cell[];

export type Puzzle = {
  id: number;
  /** Normalized, uppercased display text. */
  text: string;
  author?: string;
  /** Words (split on spaces); each word is a sequence of cells. */
  words: Word[];
  /** code (1–26) -> correct letter, for every code used in this puzzle. */
  codeToSolution: Record<number, string>;
  /** Distinct codes used in this puzzle, ascending. */
  codes: number[];
  /** Total number of letter cells. */
  letterCount: number;
};

/** code (1–26) -> the letter the player has assigned to it (legacy per-code). */
export type Guesses = Record<number, string>;
