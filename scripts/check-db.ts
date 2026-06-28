/**
 * Validates the generated content DB and the SQL the runtime relies on, using
 * `node:sqlite` (the on-device expo-sqlite code can't run under Node, but the
 * SQL is identical). Works on a COPY so the bundled asset is never mutated.
 *
 * Run:  npx tsx scripts/check-db.ts
 */

import { DatabaseSync } from 'node:sqlite';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SEED_PLAYER_SQL, USER_DATA_MIGRATIONS, USER_TABLES_SQL } from '../src/db/schema';
import { Rng } from '../src/game/rng';
import { buildMonthGrid, elapsedDaysOfMonth } from '../src/lib/calendar';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ASSET = resolve(ROOT, 'assets/db/cryptogram.db');
const COPY = resolve(ROOT, 'tmp/check-db.db');

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) (passed++, console.log(`  ✓ ${name}`));
  else (failed++, console.error(`  ✗ ${name}`));
}

// Same SQL the runtime uses (quotes.ts) — kept in sync intentionally.
const RANDOM_UNSOLVED = `SELECT q.* FROM quotes q
  LEFT JOIN progress p ON p.quote_id = q.id AND p.status = 'solved'
  WHERE p.quote_id IS NULL AND ($difficulty IS NULL OR q.difficulty = $difficulty)
  ORDER BY RANDOM() LIMIT 1`;
const COUNTS = `SELECT q.difficulty AS difficulty, COUNT(*) AS total,
  SUM(CASE WHEN p.status = 'solved' THEN 1 ELSE 0 END) AS solved
  FROM quotes q LEFT JOIN progress p ON p.quote_id = q.id GROUP BY q.difficulty`;

mkdirSync(dirname(COPY), { recursive: true });
copyFileSync(ASSET, COPY);
const db = new DatabaseSync(COPY);

console.log('\nContent');
const total = (db.prepare('SELECT COUNT(*) c FROM quotes').get() as { c: number }).c;
check(`quotes present (${total})`, total > 0);
const version = (db.prepare("SELECT value FROM meta WHERE key='content_version'").get() as { value: string }).value;
check(`meta content_version (${version})`, version === '1');

console.log('\nUser tables migration');
db.exec(USER_TABLES_SQL);
db.exec(SEED_PLAYER_SQL);
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all()
  .map((r) => (r as { name: string }).name);
for (const t of ['quotes', 'meta', 'progress', 'player', 'settings', 'daily_activity']) {
  check(`table ${t} exists`, tables.includes(t));
}
const player = db.prepare('SELECT * FROM player WHERE id=1').get() as { coins: number } | undefined;
check('player row seeded with 0 coins', !!player && player.coins === 0);

// Migrations run against an isolated in-memory DB so they can't perturb the
// content-DB checks. Mirrors migrate.ts, which applies the same SQL at runtime.
console.log('\nUser-data migration (legacy → latest)');
{
  const m = new DatabaseSync(':memory:');
  m.exec(USER_TABLES_SQL);
  m.exec(SEED_PLAYER_SQL);
  // Legacy DB: an in-progress row (old per-code guesses) + a solved row.
  m.prepare(
    "INSERT INTO progress (quote_id, status, guesses) VALUES (1, 'in_progress', '{\"5\":\"E\"}')",
  ).run();
  m.prepare("INSERT INTO progress (quote_id, status, solved_at) VALUES (2, 'solved', 1)").run();
  for (const mig of USER_DATA_MIGRATIONS) m.exec(mig.sql);
  const inProg = (
    m.prepare("SELECT COUNT(*) c FROM progress WHERE status='in_progress'").get() as { c: number }
  ).c;
  const solved = (
    m.prepare("SELECT COUNT(*) c FROM progress WHERE status='solved'").get() as { c: number }
  ).c;
  check('migration clears incompatible in-progress rows', inProg === 0);
  check('migration keeps solved rows', solved === 1);
  m.close();
}

// Content sync merges new quotes additively (by text) so existing ids — and the
// progress keyed to them — survive. Mirrors content-sync.ts.
console.log('\nContent sync (additive merge by text)');
{
  const m = new DatabaseSync(':memory:');
  m.exec(`
    CREATE TABLE quotes (id INTEGER PRIMARY KEY, text TEXT, author TEXT, category TEXT,
      difficulty INTEGER, letter_count INTEGER, length INTEGER);
    CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);
  `);
  m.exec(USER_TABLES_SQL);
  m.prepare("INSERT INTO quotes (text, difficulty, letter_count, length) VALUES (?, 1, 5, 7)").run('OLD ONE');
  m.prepare("INSERT INTO quotes (text, difficulty, letter_count, length) VALUES (?, 1, 5, 7)").run('OLD TWO');
  m.prepare("INSERT INTO meta (key, value) VALUES ('content_version', '1')").run();
  // Player has solved quote id 1.
  m.prepare("INSERT INTO progress (quote_id, status, solved_at) VALUES (1, 'solved', 1)").run();

  const incoming = ['OLD ONE', 'NEW A', 'NEW B']; // bundle: 1 existing + 2 new
  const existing = new Set(
    (m.prepare('SELECT text FROM quotes').all() as { text: string }[]).map((r) => r.text),
  );
  const ins = m.prepare("INSERT INTO quotes (text, difficulty, letter_count, length) VALUES (?, 1, 5, 7)");
  let added = 0;
  for (const t of incoming) if (!existing.has(t)) (ins.run(t), added++);

  check('adds only the new quotes', added === 2);
  check('total quotes after merge is 4', (m.prepare('SELECT COUNT(*) c FROM quotes').get() as { c: number }).c === 4);
  const solvedText = (
    m
      .prepare("SELECT q.text t FROM progress p JOIN quotes q ON q.id = p.quote_id WHERE p.status = 'solved'")
      .get() as { t: string }
  ).t;
  check('solved progress still maps to its original quote', solvedText === 'OLD ONE');
  m.close();
}

console.log('\nDaily challenge');
{
  // Deterministic puzzle-of-the-day over the real quotes table (mirrors db/daily.ts).
  const total = (db.prepare('SELECT COUNT(*) c FROM quotes').get() as { c: number }).c;
  const pool = Math.min(total, 10000);
  const pick = (date: string) => {
    const offset = new Rng(`daily-${date}`).int(pool);
    return (db.prepare('SELECT id FROM quotes ORDER BY id LIMIT 1 OFFSET ?').get(offset) as { id: number }).id;
  };
  const a1 = pick('2026-06-27');
  const a2 = pick('2026-06-27');
  const b = pick('2026-06-28');
  check('daily selection deterministic for a date', a1 === a2);
  check('different dates pick different quotes', a1 !== b);
  check('daily quote id exists', typeof a1 === 'number' && a1 > 0);

  // daily_result round-trip (table created via USER_TABLES_SQL above).
  db.prepare("INSERT INTO daily_result (date, quote_id, mistakes, solved_at) VALUES ('2026-06-20', 42, 1, 123)").run();
  const r = db.prepare("SELECT * FROM daily_result WHERE date = '2026-06-20'").get() as { quote_id: number; mistakes: number };
  check('daily_result round-trips', !!r && r.quote_id === 42 && r.mistakes === 1);

  // Calendar grid for June 2026 (30 days), today = the 27th.
  const grid = buildMonthGrid(2026, 6, '2026-06-27', new Set(['2026-06-20']));
  const dayCells = grid.filter((c) => c.date);
  const firstWeekday = new Date(2026, 5, 1).getDay();
  check('grid has 30 day cells for June', dayCells.length === 30);
  check('leading blanks align the 1st', grid.findIndex((c) => c.date !== null) === firstWeekday);
  check('today flagged', dayCells.find((c) => c.day === 27)?.isToday === true);
  check('future day flagged', dayCells.find((c) => c.day === 28)?.isFuture === true);
  check('solved day marked done', dayCells.find((c) => c.day === 20)?.done === true);
  check('elapsedDaysOfMonth stops at today', elapsedDaysOfMonth(2026, 6, '2026-06-27').length === 27);
}

console.log('\nQueries');
const anyUnsolved = db.prepare(RANDOM_UNSOLVED).get({ difficulty: null }) as { id: number } | undefined;
check('random unsolved returns a quote on fresh DB', !!anyUnsolved && typeof anyUnsolved.id === 'number');

const easy = db.prepare(RANDOM_UNSOLVED).get({ difficulty: 1 }) as { difficulty: number } | undefined;
check('difficulty filter works (easy=1)', !!easy && easy.difficulty === 1);

// Solve one quote, confirm it disappears from unsolved + counts update.
const target = anyUnsolved!.id;
db.prepare(
  "INSERT INTO progress (quote_id, status, solved_at) VALUES (?, 'solved', 1)",
).run(target);

let stillOffered = false;
for (let i = 0; i < 200; i++) {
  const r = db.prepare(RANDOM_UNSOLVED).get({ difficulty: null }) as { id: number } | undefined;
  if (r && r.id === target) {
    stillOffered = true;
    break;
  }
}
check('solved quote no longer offered as unsolved', !stillOffered);

const counts = db.prepare(COUNTS).all() as { total: number; solved: number }[];
const solvedTotal = counts.reduce((s, r) => s + (r.solved ?? 0), 0);
const grandTotal = counts.reduce((s, r) => s + r.total, 0);
check('counts: exactly one solved', solvedTotal === 1);
check('counts: total matches quotes table', grandTotal === total);

db.close();

console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
