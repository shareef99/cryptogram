/**
 * Lightweight runtime checks for the pure game logic.
 *
 * No test framework is installed yet; this script asserts the core invariants
 * and prints a summary. Run with:  npx tsx scripts/check-game.ts
 *
 * These checks guard the properties the rest of the app relies on:
 * determinism, cipher bijection, correct puzzle structure, hint behavior,
 * and win detection.
 */

import {
  ALPHABET,
  ALPHABET_SIZE,
  buildPuzzle,
  conflictingCodes,
  decodedText,
  generateCipher,
  isSolved,
  letterCells,
  pickRandomUnsolvedCode,
  progress,
  revealCode,
  Rng,
  unsolvedCodes,
  type Guesses,
} from '../src/game';
import { ACHIEVEMENTS, evaluateUnlocked } from '../src/game/achievements';

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
  }
}

function eq<T>(name: string, actual: T, expected: T) {
  check(`${name} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`, actual === expected);
}

console.log('\nRNG');
{
  const a = new Rng('puzzle-42');
  const b = new Rng('puzzle-42');
  const c = new Rng('puzzle-43');
  const seqA = [a.next(), a.next(), a.next()];
  const seqB = [b.next(), b.next(), b.next()];
  check('same seed -> identical sequence', JSON.stringify(seqA) === JSON.stringify(seqB));
  check('different seed -> different sequence', c.next() !== seqA[0]);
  check('next() stays in [0,1)', seqA.every((n) => n >= 0 && n < 1));

  const r = new Rng(7);
  const ints = Array.from({ length: 1000 }, () => r.int(6));
  check('int(6) stays in range', ints.every((n) => n >= 0 && n < 6));

  const shuffled = new Rng('x').shuffle([1, 2, 3, 4, 5]);
  check('shuffle preserves multiset', JSON.stringify([...shuffled].sort()) === '[1,2,3,4,5]');
  check(
    'shuffle is deterministic',
    JSON.stringify(new Rng('x').shuffle([1, 2, 3, 4, 5])) === JSON.stringify(shuffled),
  );
}

console.log('\nCipher');
{
  const cipher = generateCipher(123);
  const codes = ALPHABET.split('').map((l) => cipher.letterToCode[l]);
  eq('covers all 26 letters', Object.keys(cipher.letterToCode).length, ALPHABET_SIZE);
  check('codes are 1..26 with no duplicates', JSON.stringify([...codes].sort((a, b) => a - b)) ===
    JSON.stringify(Array.from({ length: 26 }, (_, i) => i + 1)));
  check(
    'bijection round-trips',
    ALPHABET.split('').every((l) => cipher.codeToLetter[cipher.letterToCode[l]] === l),
  );
  check(
    'deterministic for same seed',
    JSON.stringify(generateCipher(123)) === JSON.stringify(cipher),
  );
  check('different seed -> different cipher', JSON.stringify(generateCipher(124)) !== JSON.stringify(cipher));
}

console.log('\nPuzzle');
{
  const puzzle = buildPuzzle({ id: 1, text: "It's ok!", author: 'Tester' });
  eq('normalized + uppercased', puzzle.text, "IT'S OK!");
  eq('word count', puzzle.words.length, 2);
  // "IT'S" -> I, T, ' , S  => 3 letter cells + 1 symbol
  const w0 = puzzle.words[0];
  eq('word0 cell count', w0.length, 4);
  eq('word0 letters', w0.filter((c) => c.kind === 'letter').length, 3);
  eq('word0 has apostrophe symbol', w0.some((c) => c.kind === 'symbol' && c.char === "'"), true);
  eq('letterCount counts only letters', puzzle.letterCount, 5); // I,T,S,O,K
  check(
    'every letter cell code matches its solution in codeToSolution',
    letterCells(puzzle).every((c) => puzzle.codeToSolution[c.code] === c.solution),
  );
  check('codes ascending & distinct', puzzle.codes.every((c, i, a) => i === 0 || c > a[i - 1]));
  // Distinct letters in "ITSOK" = I,T,S,O,K = 5 distinct codes
  eq('distinct codes', puzzle.codes.length, 5);
}

console.log('\nValidation & win detection');
{
  const puzzle = buildPuzzle({ id: 99, text: 'GO NOW' });
  const empty: Guesses = {};
  check('empty puzzle not solved', !isSolved(puzzle, empty));
  eq('progress starts at 0', progress(puzzle, empty), 0);

  // Build the fully-correct guesses from the solution.
  const full: Guesses = {};
  for (const code of puzzle.codes) full[code] = puzzle.codeToSolution[code];
  check('full correct guesses -> solved', isSolved(puzzle, full));
  eq('progress complete', progress(puzzle, full), 1);
  eq('decoded equals original', decodedText(puzzle, full), 'GO NOW');

  // Partial: solve only the first code.
  const partial: Guesses = { [puzzle.codes[0]]: puzzle.codeToSolution[puzzle.codes[0]] };
  check('partial not solved', !isSolved(puzzle, partial));
  check('unsolvedCodes excludes the solved one', !unsolvedCodes(puzzle, partial).includes(puzzle.codes[0]));

  // Conflicts: assign the same letter to two different codes.
  const conflict: Guesses = { [puzzle.codes[0]]: 'X', [puzzle.codes[1]]: 'X' };
  const cc = conflictingCodes(conflict);
  check('detects duplicate-letter conflict', cc.has(puzzle.codes[0]) && cc.has(puzzle.codes[1]));
  check('no conflict when letters differ', conflictingCodes({ [puzzle.codes[0]]: 'A', [puzzle.codes[1]]: 'B' }).size === 0);
}

console.log('\nHints');
{
  const puzzle = buildPuzzle({ id: 5, text: 'HELLO WORLD' });
  const guesses: Guesses = {};
  const rng = new Rng('hint-seed');

  const code = pickRandomUnsolvedCode(puzzle, guesses, rng);
  check('picks an unsolved code on a fresh puzzle', code !== null && puzzle.codes.includes(code));

  const revealed = revealCode(puzzle, guesses, code!);
  check('revealCode does not mutate input', Object.keys(guesses).length === 0);
  check('revealed code now correct', revealed[code!] === puzzle.codeToSolution[code!]);

  // Reveal everything via repeated lucky reveals -> eventually solved & null.
  let g: Guesses = {};
  let safety = 100;
  while (!isSolved(puzzle, g) && safety-- > 0) {
    const c = pickRandomUnsolvedCode(puzzle, g, new Rng(`r-${safety}`));
    if (c === null) break;
    g = revealCode(puzzle, g, c);
  }
  check('repeated reveals solve the puzzle', isSolved(puzzle, g));
  check('pickRandomUnsolvedCode returns null when solved', pickRandomUnsolvedCode(puzzle, g, rng) === null);
}

console.log('\nAchievements');
{
  const base = {
    totalSolved: 0, currentStreak: 0, longestStreak: 0, dailyCount: 0,
    mistakes: 3, timeSeconds: 200, difficulty: 1 as const,
  };
  // Fresh first solve, made a mistake, slow, easy → only "first_solve".
  const first = evaluateUnlocked({ ...base, totalSolved: 1 });
  check('first solve unlocks first_solve', first.includes('first_solve'));
  check('mistakes block flawless', !first.includes('flawless'));
  check('slow time blocks speed_demon', !first.includes('speed_demon'));

  // Flawless + fast + long.
  const ace = evaluateUnlocked({ ...base, totalSolved: 1, mistakes: 0, timeSeconds: 45, difficulty: 4 });
  check('no mistakes unlocks flawless', ace.includes('flawless'));
  check('sub-60s unlocks speed_demon', ace.includes('speed_demon'));
  check('long puzzle unlocks marathoner', ace.includes('marathoner'));

  // Milestone thresholds.
  const veteran = evaluateUnlocked({ ...base, totalSolved: 100, longestStreak: 30, dailyCount: 7 });
  check('100 solves unlocks solve_100', veteran.includes('solve_100'));
  check('30-day streak unlocks streak_30', veteran.includes('streak_30'));
  check('7 dailies unlocks daily_7', veteran.includes('daily_7'));
  check('every achievement id is unique', new Set(ACHIEVEMENTS.map((a) => a.id)).size === ACHIEVEMENTS.length);
}

console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
