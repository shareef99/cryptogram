/**
 * Game store value types (status, hint mode, per-cell guesses).
 */

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

/** 'pick' = Hint 1 active: the player taps an unsolved cell to reveal it. */
export type HintMode = 'idle' | 'pick';

/** cellId -> the correct letter locked into that cell. */
export type CellGuesses = Record<number, string>;
