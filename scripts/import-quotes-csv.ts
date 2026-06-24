/**
 * Bootstrap importer for the large CSV quotes dataset (data/quotes.csv).
 *
 * Streams the CSV, cleans author + text, normalizes with the SAME normalizeText
 * the game uses, filters to layout-friendly puzzles, caps per author (the raw set
 * is flooded by a few prolific authors), dedupes, and fills balanced length
 * buckets — including a new "long" tier (161–240 chars). The file appears to be
 * roughly popularity-ordered, so first-come selection favours well-known quotes.
 *
 * Emits `data/quotes-bulk.json` ([{ text, author, category }]); build:db bins by
 * length (difficulty 1–3 + 4=long). To ship without it: delete that file + rebuild.
 *
 * Run:  npx tsx scripts/import-quotes-csv.ts [path-to-csv]
 */

import { createReadStream, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isLetter, normalizeText } from '../src/game';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const INPUT = resolve(ROOT, process.argv[2] ?? 'data/quotes.csv');
const OUT = resolve(ROOT, 'data/quotes-bulk.json');

const ALLOWED_PUNCTUATION = new Set([' ', "'", '.', ',', '!', '?', ';', ':', '-', '"', '(', ')']);
const MIN_LENGTH = 12;
const MAX_LENGTH = 240; // long tier ceiling
const MIN_DISTINCT_LETTERS = 5;
const PER_AUTHOR_CAP = 4;

// Bucket targets keyed by difficulty (4 = long). Tuned for a strong, balanced
// corpus without bloating the bundled DB.
const TARGETS: Record<number, number> = { 1: 1500, 2: 3500, 3: 3500, 4: 2500 };

function difficultyFor(len: number): number {
  if (len <= 40) return 1;
  if (len <= 75) return 2;
  if (len <= 160) return 3;
  return 4; // long
}

/** Parse one CSV record (commas/quotes inside "..."; "" is an escaped quote). */
function parseRecord(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

/** Author field often carries a book title after a comma — keep the name only. */
function cleanAuthor(raw: string): string | null {
  const name = (raw.split(',')[0] ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  return name || null;
}

function isClean(t: string): boolean {
  if (t.length < MIN_LENGTH || t.length > MAX_LENGTH) return false;
  const distinct = new Set<string>();
  for (const ch of t) {
    if (isLetter(ch)) {
      distinct.add(ch);
      continue;
    }
    if (!ALLOWED_PUNCTUATION.has(ch)) return false;
  }
  return distinct.size >= MIN_DISTINCT_LETTERS;
}

async function main() {
  const rl = createInterface({ input: createReadStream(INPUT, 'utf8'), crlfDelay: Infinity });

  const out: { text: string; author: string | null; category: string | null }[] = [];
  const seen = new Set<string>();
  const authorCount = new Map<string, number>();
  const bucket: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let scanned = 0;
  let header = true;
  let pending = '';

  const done = () => [1, 2, 3, 4].every((d) => bucket[d] >= TARGETS[d]);

  for await (const line of rl) {
    // Re-assemble records that span newlines inside a quoted field (odd quote count).
    pending = pending ? pending + '\n' + line : line;
    const quotes = (pending.match(/"/g) ?? []).length;
    if (quotes % 2 !== 0) continue; // record not finished
    const record = pending;
    pending = '';

    if (header) {
      header = false;
      continue;
    }
    scanned++;

    const cols = parseRecord(record);
    const text = normalizeText((cols[0] ?? '').normalize('NFD').replace(/[̀-ͯ]/g, ''));
    if (!isClean(text) || seen.has(text)) continue;

    const d = difficultyFor(text.length);
    if (bucket[d] >= TARGETS[d]) continue;

    const author = cleanAuthor(cols[1] ?? '');
    const key = author ?? '∅';
    if ((authorCount.get(key) ?? 0) >= PER_AUTHOR_CAP) continue;

    seen.add(text);
    authorCount.set(key, (authorCount.get(key) ?? 0) + 1);
    bucket[d]++;
    out.push({ text: cols[0].trim(), author, category: d === 4 ? 'long' : null });

    if (done()) break;
  }

  writeFileSync(OUT, JSON.stringify(out, null, 0) + '\n', 'utf8');
  console.log(`\n✅ Imported ${out.length} quotes -> ${OUT}`);
  console.log(`   scanned ${scanned} records`);
  console.log(`   buckets easy/med/hard/long -> ${bucket[1]} / ${bucket[2]} / ${bucket[3]} / ${bucket[4]}`);
  console.log(`   distinct authors kept -> ${authorCount.size} (cap ${PER_AUTHOR_CAP}/author)\n`);
}

main();
