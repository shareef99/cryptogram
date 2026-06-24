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
