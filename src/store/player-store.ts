/**
 * Reactive mirror of the single DB player row (coins, scarce Hint-2 inventory,
 * streaks). The DB is the source of truth; every mutation writes through a DB
 * helper and then syncs the in-memory copy so the UI updates immediately.
 */

import { create } from 'zustand';

import {
  addCoins,
  addHint2,
  consumeHint2,
  getDatabase,
  getPlayer,
  spendCoins,
  type PlayerRow,
} from '@/db';

type PlayerState = {
  coins: number;
  hint2Count: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  hydrated: boolean;

  /** Load the player row from the DB into memory (idempotent). */
  hydrate: () => Promise<void>;
  /** Replace in-memory state from a fresh DB row. */
  syncFrom: (row: PlayerRow) => void;
  /** Grant coins (e.g. a level reward). */
  awardCoins: (n: number) => Promise<void>;
  /** Spend coins if affordable; returns success. */
  trySpend: (n: number) => Promise<boolean>;
  /** Grant scarce Hint-2 inventory. */
  grantHint2: (n: number) => Promise<void>;
  /** Consume one Hint-2 if available; returns success. */
  tryConsumeHint2: () => Promise<boolean>;
};

function rowToState(row: PlayerRow) {
  return {
    coins: row.coins,
    hint2Count: row.hint2_count,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastActiveDate: row.last_active_date,
  };
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  coins: 0,
  hint2Count: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  hydrated: false,

  hydrate: async () => {
    const db = await getDatabase();
    set({ ...rowToState(await getPlayer(db)), hydrated: true });
  },

  syncFrom: (row) => set(rowToState(row)),

  awardCoins: async (n) => {
    const db = await getDatabase();
    const coins = await addCoins(db, n);
    set({ coins });
  },

  trySpend: async (n) => {
    const db = await getDatabase();
    const ok = await spendCoins(db, n);
    if (ok) set({ coins: Math.max(0, get().coins - n) });
    return ok;
  },

  grantHint2: async (n) => {
    const db = await getDatabase();
    const hint2Count = await addHint2(db, n);
    set({ hint2Count });
  },

  tryConsumeHint2: async () => {
    const db = await getDatabase();
    const ok = await consumeHint2(db);
    if (ok) set({ hint2Count: Math.max(0, get().hint2Count - 1) });
    return ok;
  },
}));
