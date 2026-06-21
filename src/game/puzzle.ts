/**
 * Puzzle construction.
 *
 * Turns a raw quote ({ id, text }) into a structured, render-ready puzzle:
 * words of cells, where each letter cell carries its solution letter and the
 * cipher code shown to the player, and each non-letter is a display-only symbol
 * cell. The cipher is derived from the quote id so the puzzle is reproducible.
 *
 * This module is pure data: it holds the SOLUTION but not the player's current
 * guesses. Guess state lives in the game store; see `validate.ts` for helpers
 * that combine a puzzle with a set of guesses.
 */

import { generateCipher, isLetter, type Cipher } from './cipher';

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
  /** Total number of letter cells (used for progress/scoring). */
  letterCount: number;
};

/**
 * Light normalization so real-world quotes render cleanly:
 * uppercase, and fold common unicode punctuation to ASCII. Heavier filtering
 * happens at data-build time; this keeps runtime robust.
 */
export function normalizeText(text: string): string {
  return text
    .replace(/[‘’ʼ]/g, "'") // curly/right single quotes -> '
    .replace(/[“”]/g, '"') // curly double quotes -> "
    .replace(/[–—]/g, '-') // en/em dash -> -
    .replace(/…/g, '...') // ellipsis -> ...
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim()
    .toUpperCase();
}

/**
 * Build a full puzzle from a quote. Deterministic for a given quote id.
 */
export function buildPuzzle(quote: QuoteInput, cipherOverride?: Cipher): Puzzle {
  const text = normalizeText(quote.text);
  const cipher = cipherOverride ?? generateCipher(quote.id);

  const words: Word[] = [];
  const codeToSolution: Record<number, string> = {};
  const codeSet = new Set<number>();

  let current: Word = [];
  let id = 0;
  let letterCount = 0;

  const flush = () => {
    if (current.length > 0) {
      words.push(current);
      current = [];
    }
  };

  for (const ch of text) {
    if (ch === ' ') {
      flush();
      continue;
    }
    if (isLetter(ch)) {
      const code = cipher.letterToCode[ch];
      current.push({ kind: 'letter', id: id++, solution: ch, code });
      codeToSolution[code] = ch;
      codeSet.add(code);
      letterCount++;
    } else {
      current.push({ kind: 'symbol', id: id++, char: ch });
    }
  }
  flush();

  return {
    id: quote.id,
    text,
    author: quote.author,
    words,
    codeToSolution,
    codes: Array.from(codeSet).sort((a, b) => a - b),
    letterCount,
  };
}

/** Flatten the puzzle's words into a single ordered list of cells. */
export function allCells(puzzle: Puzzle): Cell[] {
  return puzzle.words.flat();
}

/** All letter cells, in order. */
export function letterCells(puzzle: Puzzle): LetterCell[] {
  return allCells(puzzle).filter((c): c is LetterCell => c.kind === 'letter');
}
