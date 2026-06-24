/**
 * Bootstrap importer: turn a raw open quotes dataset into our source format.
 *
 * ⚠️ BOOTSTRAP ONLY. The imported corpus has an undocumented data license, so it
 * is for development / closed-testing volume — NOT the shippable production
 * corpus (see DECISIONS D8). To drop it before a public release: delete
 * `data/quotes-quotable.json` and re-run `pnpm build:db`.
 *
 * Reads a raw dataset (array of {quoteText, quoteAuthor} or {text, author}),
 * strips diacritics, normalizes with the SAME normalizeText the game uses,
 * filters to clean/layout-friendly puzzles, dedupes, and writes
 * `data/quotes-quotable.json` ([{ text, author, category }]).
 *
 * Run:  npx tsx scripts/import-quotable.ts <raw.json>   (default: tmp/mirror-quotes.json)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isLetter, normalizeText } from '../src/game';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const INPUT = resolve(ROOT, process.argv[2] ?? 'tmp/mirror-quotes.json');
const OUT = resolve(ROOT, 'data/quotes-quotable.json');

// Mirrors build-db.ts (the source of truth, which re-validates on build).
const ALLOWED_PUNCTUATION = new Set([' ', "'", '.', ',', '!', '?', ';', ':', '-', '"', '(', ')']);
const MIN_LENGTH = 12;
const MAX_LENGTH = 140;
const MIN_DISTINCT_LETTERS = 5;

type RawQuote = { quoteText?: string; text?: string; quoteAuthor?: string; author?: string };
type SourceQuote = { text: string; author: string | null; category: string };

/** Decompose accents and drop combining marks: "café" -> "cafe". */
function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function isClean(normalized: string): boolean {
  if (normalized.length < MIN_LENGTH || normalized.length > MAX_LENGTH) return false;
  const distinct = new Set<string>();
  for (const ch of normalized) {
    if (isLetter(ch)) {
      distinct.add(ch);
      continue;
    }
    if (!ALLOWED_PUNCTUATION.has(ch)) return false; // digit / stray symbol -> skip
  }
  return distinct.size >= MIN_DISTINCT_LETTERS;
}

function main() {
  const raw = JSON.parse(readFileSync(INPUT, 'utf8')) as RawQuote[];
  if (!Array.isArray(raw)) throw new Error(`${INPUT} is not a JSON array`);

  const out: SourceQuote[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  for (const entry of raw) {
    const rawText = entry.quoteText ?? entry.text ?? '';
    const cleaned = stripDiacritics(rawText);
    const normalized = normalizeText(cleaned); // exactly what build-db will store
    if (!isClean(normalized) || seen.has(normalized)) {
      skipped++;
      continue;
    }
    seen.add(normalized);
    const author = stripDiacritics((entry.quoteAuthor ?? entry.author ?? '').trim());
    out.push({ text: cleaned.trim(), author: author || null, category: 'classic' });
  }

  writeFileSync(OUT, JSON.stringify(out, null, 0) + '\n', 'utf8');
  console.log(`\n✅ Imported ${out.length} quotes -> ${OUT}  (skipped ${skipped})\n`);
}

main();
