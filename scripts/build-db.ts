/**
 * Build the bundled puzzle database.
 *
 * Reads `data/quotes-source.json`, normalizes + validates each quote (reusing
 * the SAME `normalizeText` the game uses at runtime, so stored text matches what
 * is rendered), computes derived columns, and emits `assets/db/cryptogram.db`.
 *
 * The output is a standard SQLite file, opened on-device by expo-sqlite via
 * `importDatabaseFromAssetAsync` (copy-on-first-launch). User data (progress,
 * player, settings, daily activity) is created on-device and lives in the same
 * working copy; this script only writes read-only content (`quotes` + `meta`).
 *
 * Run:  pnpm build:db
 */

import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isLetter, normalizeText } from '../src/game';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
// Sources are merged in order; later files supplement earlier ones (dedup by
// normalized text below). `quotes-bulk.json` is an optional bootstrap corpus
// (see scripts/import-quotes-csv.ts) — delete it + rebuild to ship curated only.
const SOURCES = ['data/quotes-source.json', 'data/quotes-bulk.json'].map((p) => resolve(ROOT, p));
const OUT = resolve(ROOT, 'assets/db/cryptogram.db');

const CONTENT_VERSION = 1;

// Characters allowed in a puzzle after normalization: letters, space, and a
// small set of punctuation. Anything else → the quote is skipped (keeps puzzles
// clean and easy to lay out). Digits are intentionally excluded.
const ALLOWED_PUNCTUATION = new Set([' ', "'", '.', ',', '!', '?', ';', ':', '-', '"', '(', ')']);

const MIN_LENGTH = 12;
const MAX_LENGTH = 240; // 161–240 form the "long" tier (difficulty 4)
const MIN_DISTINCT_LETTERS = 5;

type SourceQuote = { text: string; author?: string; category?: string };

type BuiltQuote = {
  id: number;
  text: string;
  author: string | null;
  category: string | null;
  difficulty: number;
  letterCount: number;
  length: number;
};

function distinctLetters(text: string): number {
  const set = new Set<string>();
  for (const ch of text) if (isLetter(ch)) set.add(ch);
  return set.size;
}

function difficultyFor(length: number): number {
  if (length <= 40) return 1; // easy / short
  if (length <= 75) return 2; // medium
  if (length <= 160) return 3; // hard
  return 4; // long (its own category)
}

/** Returns the offending character if the text contains a disallowed one. */
function firstDisallowedChar(text: string): string | null {
  for (const ch of text) {
    if (isLetter(ch)) continue;
    if (ALLOWED_PUNCTUATION.has(ch)) continue;
    return ch;
  }
  return null;
}

function build() {
  const source: SourceQuote[] = [];
  for (const file of SOURCES) {
    if (!existsSync(file)) continue;
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as unknown;
    if (!Array.isArray(parsed)) throw new Error(`${file} must be a JSON array`);
    source.push(...(parsed as SourceQuote[]));
  }
  if (source.length === 0) throw new Error('No source quotes found.');

  const built: BuiltQuote[] = [];
  const seen = new Set<string>();
  const skipped: { text: string; reason: string }[] = [];
  let nextId = 1;

  for (const entry of source) {
    const text = normalizeText(entry.text ?? '');

    if (text.length < MIN_LENGTH) {
      skipped.push({ text, reason: `too short (${text.length} < ${MIN_LENGTH})` });
      continue;
    }
    if (text.length > MAX_LENGTH) {
      skipped.push({ text, reason: `too long (${text.length} > ${MAX_LENGTH})` });
      continue;
    }
    const bad = firstDisallowedChar(text);
    if (bad) {
      skipped.push({ text, reason: `disallowed char ${JSON.stringify(bad)}` });
      continue;
    }
    const letterCount = distinctLetters(text);
    if (letterCount < MIN_DISTINCT_LETTERS) {
      skipped.push({ text, reason: `too few distinct letters (${letterCount})` });
      continue;
    }
    if (seen.has(text)) {
      skipped.push({ text, reason: 'duplicate' });
      continue;
    }
    seen.add(text);

    built.push({
      id: nextId++,
      text,
      author: entry.author?.trim() || null,
      category: entry.category?.trim() || null,
      difficulty: difficultyFor(text.length),
      letterCount,
      length: text.length,
    });
  }

  if (built.length === 0) throw new Error('No valid quotes to write.');

  // Emit the database.
  mkdirSync(dirname(OUT), { recursive: true });
  rmSync(OUT, { force: true });
  const db = new DatabaseSync(OUT);

  db.exec(`
    PRAGMA journal_mode = DELETE;
    CREATE TABLE quotes (
      id INTEGER PRIMARY KEY,
      text TEXT NOT NULL,
      author TEXT,
      category TEXT,
      difficulty INTEGER NOT NULL,
      letter_count INTEGER NOT NULL,
      length INTEGER NOT NULL
    );
    CREATE INDEX idx_quotes_difficulty ON quotes(difficulty);
    CREATE TABLE meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const insert = db.prepare(
    `INSERT INTO quotes (id, text, author, category, difficulty, letter_count, length)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  db.exec('BEGIN');
  for (const q of built) {
    insert.run(q.id, q.text, q.author, q.category, q.difficulty, q.letterCount, q.length);
  }
  db.exec('COMMIT');

  const setMeta = db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)');
  setMeta.run('content_version', String(CONTENT_VERSION));
  setMeta.run('quote_count', String(built.length));

  db.exec(`PRAGMA user_version = ${CONTENT_VERSION};`);

  // Summary.
  const byDifficulty = [1, 2, 3, 4].map(
    (d) => `${d}:${built.filter((q) => q.difficulty === d).length}`,
  );
  db.close();

  console.log(`\n✅ Wrote ${built.length} quotes -> ${OUT}`);
  console.log(`   difficulty distribution (easy:med:hard) -> ${byDifficulty.join('  ')}`);
  console.log(`   content_version = ${CONTENT_VERSION}`);
  if (skipped.length) {
    console.log(`\n⚠️  Skipped ${skipped.length}:`);
    for (const s of skipped) console.log(`   - ${s.reason}: ${s.text.slice(0, 50)}`);
  }
  console.log('');
}

build();
