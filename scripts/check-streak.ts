/**
 * Checks the pure streak/date logic and the daily_activity upsert SQL.
 * Run:  npx tsx scripts/check-streak.ts
 */

import { DatabaseSync } from 'node:sqlite';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { addDays, computeStreak, localDateString } from '../src/lib/streak';
import { USER_TABLES_SQL, SEED_PLAYER_SQL } from '../src/db/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) (passed++, console.log(`  ✓ ${name}`));
  else (failed++, console.error(`  ✗ ${name}`));
}

console.log('\nDate math');
check('localDateString formats', localDateString(new Date(2026, 0, 5)) === '2026-01-05');
check('addDays forward across month', addDays('2026-01-31', 1) === '2026-02-01');
check('addDays backward across year', addDays('2026-01-01', -1) === '2025-12-31');

console.log('\ncomputeStreak');
check('first ever active day -> 1', computeStreak(null, 0, '2026-06-22').streak === 1);
check('first ever active day is new', computeStreak(null, 0, '2026-06-22').isNewActiveDay === true);
check('consecutive day increments', computeStreak('2026-06-21', 4, '2026-06-22').streak === 5);
check('same day is no-op', computeStreak('2026-06-22', 5, '2026-06-22').isNewActiveDay === false);
check('same day keeps streak', computeStreak('2026-06-22', 5, '2026-06-22').streak === 5);
check('gap resets to 1', computeStreak('2026-06-19', 9, '2026-06-22').streak === 1);
check('gap is a new active day', computeStreak('2026-06-19', 9, '2026-06-22').isNewActiveDay === true);

console.log('\ndaily_activity upsert SQL');
{
  const copy = resolve(ROOT, 'tmp/check-streak.db');
  mkdirSync(dirname(copy), { recursive: true });
  copyFileSync(resolve(ROOT, 'assets/db/cryptogram.db'), copy);
  const db = new DatabaseSync(copy);
  db.exec(USER_TABLES_SQL);
  db.exec(SEED_PLAYER_SQL);

  const upsert = `INSERT INTO daily_activity (date, levels_cleared, coins_earned)
      VALUES (?, 1, ?)
    ON CONFLICT(date) DO UPDATE SET
      levels_cleared = levels_cleared + 1,
      coins_earned = coins_earned + excluded.coins_earned`;
  db.prepare(upsert).run('2026-06-22', 10);
  db.prepare(upsert).run('2026-06-22', 20);
  const row = db.prepare('SELECT * FROM daily_activity WHERE date = ?').get('2026-06-22') as {
    levels_cleared: number;
    coins_earned: number;
  };
  check('two clears same day accumulate count', row.levels_cleared === 2);
  check('two clears same day accumulate coins', row.coins_earned === 30);
  db.close();
}

console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
