/**
 * The single player profile row: coin balance, scarce Hint-2 inventory, and
 * streak counters. All mutations go through here so the DB stays the source of
 * truth (the player store mirrors it in memory).
 */

import type { SQLiteDatabase } from 'expo-sqlite';

export type PlayerRow = {
  id: number;
  coins: number;
  hint2_count: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
};

export async function getPlayer(db: SQLiteDatabase): Promise<PlayerRow> {
  const row = await db.getFirstAsync<PlayerRow>('SELECT * FROM player WHERE id = 1');
  // The row is seeded at migration time; fall back defensively.
  return (
    row ?? {
      id: 1,
      coins: 0,
      hint2_count: 0,
      current_streak: 0,
      longest_streak: 0,
      last_active_date: null,
    }
  );
}

/** Add (or subtract) coins, clamped at zero. Returns the new balance. */
export async function addCoins(db: SQLiteDatabase, delta: number): Promise<number> {
  await db.runAsync('UPDATE player SET coins = MAX(0, coins + ?) WHERE id = 1', delta);
  return (await getPlayer(db)).coins;
}

/** Spend coins if affordable. Returns true on success, false if insufficient. */
export async function spendCoins(db: SQLiteDatabase, amount: number): Promise<boolean> {
  const res = await db.runAsync(
    'UPDATE player SET coins = coins - ? WHERE id = 1 AND coins >= ?',
    amount,
    amount,
  );
  return res.changes > 0;
}

/** Grant scarce Hint-2 ("Lucky Reveal") inventory. */
export async function addHint2(db: SQLiteDatabase, count: number): Promise<number> {
  await db.runAsync('UPDATE player SET hint2_count = hint2_count + ? WHERE id = 1', count);
  return (await getPlayer(db)).hint2_count;
}

/** Consume one Hint-2 if available. Returns true if one was consumed. */
export async function consumeHint2(db: SQLiteDatabase): Promise<boolean> {
  const res = await db.runAsync(
    'UPDATE player SET hint2_count = hint2_count - 1 WHERE id = 1 AND hint2_count > 0',
  );
  return res.changes > 0;
}
