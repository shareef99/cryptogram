/**
 * Cryptogram cipher generation.
 *
 * A cipher is a bijection between the 26 letters A–Z and the 26 code numbers
 * 1–26: every letter maps to exactly one distinct number, and vice versa. The
 * mapping is generated deterministically from a seed (the puzzle id), so a
 * given puzzle always shows the same numbers.
 *
 * The cipher contains NO information about which letters actually appear in a
 * given quote — it covers the whole alphabet. That keeps puzzles consistent and
 * means we never need to store cipher data; it is regenerated on demand.
 */

import { Rng } from './rng';

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const ALPHABET_SIZE = ALPHABET.length;

export type Cipher = {
  /** letter (A–Z) -> code number (1–26) */
  letterToCode: Record<string, number>;
  /** code number (1–26) -> letter (A–Z) */
  codeToLetter: Record<number, string>;
};

/**
 * Generate a deterministic cipher from a seed.
 *
 * We shuffle the numbers 1..26 and assign them to A..Z in order, guaranteeing a
 * bijection. A standard cryptogram constraint — that no letter maps to "itself"
 * — does not apply here because letters and numbers are different symbol sets.
 */
export function generateCipher(seed: string | number): Cipher {
  const rng = new Rng(seed);
  const codes = rng.shuffle(Array.from({ length: ALPHABET_SIZE }, (_, i) => i + 1));

  const letterToCode: Record<string, number> = {};
  const codeToLetter: Record<number, string> = {};

  for (let i = 0; i < ALPHABET_SIZE; i++) {
    const letter = ALPHABET[i];
    const code = codes[i];
    letterToCode[letter] = code;
    codeToLetter[code] = letter;
  }

  return { letterToCode, codeToLetter };
}

/** True if `ch` is an uppercase letter A–Z. */
export function isLetter(ch: string): boolean {
  return ch.length === 1 && ch >= 'A' && ch <= 'Z';
}

/** Encode a single uppercase letter to its code; throws if not a letter. */
export function encodeLetter(cipher: Cipher, letter: string): number {
  const code = cipher.letterToCode[letter];
  if (code === undefined) {
    throw new Error(`Cannot encode non-letter: ${JSON.stringify(letter)}`);
  }
  return code;
}
