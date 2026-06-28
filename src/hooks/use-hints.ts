/**
 * Coordinates the two hint types across the game store and the player economy.
 *
 * Hint 1 ("Reveal"): pay coins up front, then enter pick mode — tap a highlighted
 * cell to reveal it, or "Surprise me" for a random one. Cancelling refunds. When
 * coins fall short, the same action instead offers a rewarded-ad reveal (random,
 * no pick mode → no refund edge cases).
 * Hint 2 ("Lucky Reveal"): consume one scarce inventory item, reveal at random.
 * When the inventory is empty, the action offers a rewarded ad to earn one.
 */

import { useCallback, useState } from 'react';

import { REWARDED_FREE_HINT_UNIT_ID, REWARDED_LUCKY_UNIT_ID, showRewarded } from '@/ads';
import { HINT1_COST, HINT2_REVEAL_COUNT } from '@/constants/economy';
import { getDatabase, incrementHints } from '@/db';
import { haptics } from '@/lib/haptics';
import { useGameStore } from '@/store/game-store';
import { usePlayerStore } from '@/store/player-store';

export function useHints(quoteId: number | null) {
  const coins = usePlayerStore((s) => s.coins);
  const hint2Count = usePlayerStore((s) => s.hint2Count);
  const trySpend = usePlayerStore((s) => s.trySpend);
  const awardCoins = usePlayerStore((s) => s.awardCoins);
  const tryConsumeHint2 = usePlayerStore((s) => s.tryConsumeHint2);
  const grantHint2 = usePlayerStore((s) => s.grantHint2);

  const hintMode = useGameStore((s) => s.hintMode);
  const enterPickMode = useGameStore((s) => s.enterPickMode);
  const exitPickMode = useGameStore((s) => s.exitPickMode);
  const revealRandom = useGameStore((s) => s.revealRandom);

  const [adLoading, setAdLoading] = useState(false);
  const canAffordReveal = coins >= HINT1_COST;

  const bumpHints = useCallback(() => {
    if (quoteId != null) {
      getDatabase()
        .then((db) => incrementHints(db, quoteId))
        .catch(() => {});
    }
  }, [quoteId]);

  /** Hint 1: pay, then enter pick mode (reveal happens on cell tap / surprise). */
  const startReveal = useCallback(async () => {
    if (await trySpend(HINT1_COST)) {
      bumpHints();
      enterPickMode();
    }
  }, [trySpend, bumpHints, enterPickMode]);

  /** In pick mode: reveal a random cell instead of choosing. */
  const surprise = useCallback(() => {
    revealRandom();
    exitPickMode();
  }, [revealRandom, exitPickMode]);

  /** In pick mode: back out and refund the cost. */
  const cancelReveal = useCallback(async () => {
    exitPickMode();
    await awardCoins(HINT1_COST);
  }, [exitPickMode, awardCoins]);

  /** Hint 2: consume a Lucky Reveal and reveal several random cells at once. */
  const luckyReveal = useCallback(async () => {
    if (await tryConsumeHint2()) {
      haptics.light();
      bumpHints();
      // Reveal up to HINT2_REVEAL_COUNT cells (fewer if the puzzle's nearly done).
      for (let i = 0; i < HINT2_REVEAL_COUNT; i++) {
        if (revealRandom() === null) break;
      }
    }
  }, [tryConsumeHint2, bumpHints, revealRandom]);

  /** Free Hint (ad): can't afford coins → watch an ad to reveal a random cell. */
  const revealViaAd = useCallback(async () => {
    setAdLoading(true);
    const earned = await showRewarded(REWARDED_FREE_HINT_UNIT_ID);
    setAdLoading(false);
    if (earned) {
      haptics.light();
      bumpHints();
      revealRandom();
    }
  }, [bumpHints, revealRandom]);

  /** Lucky Reveal (ad): empty inventory → watch an ad to earn one Hint 2. */
  const earnLuckyViaAd = useCallback(async () => {
    setAdLoading(true);
    const earned = await showRewarded(REWARDED_LUCKY_UNIT_ID);
    setAdLoading(false);
    if (earned) {
      haptics.success();
      await grantHint2(1);
    }
  }, [grantHint2]);

  /** Bulb action: pay coins if affordable, otherwise the ad reveal. */
  const onRevealPress = useCallback(() => {
    if (canAffordReveal) startReveal();
    else revealViaAd();
  }, [canAffordReveal, startReveal, revealViaAd]);

  /** Sparkles action: use a Lucky Reveal if held, otherwise earn one via ad. */
  const onLuckyPress = useCallback(() => {
    if (hint2Count > 0) luckyReveal();
    else earnLuckyViaAd();
  }, [hint2Count, luckyReveal, earnLuckyViaAd]);

  return {
    coins,
    hint2Count,
    hintMode,
    canAffordReveal,
    revealCost: HINT1_COST,
    adLoading,
    startReveal,
    surprise,
    cancelReveal,
    luckyReveal,
    onRevealPress,
    onLuckyPress,
  };
}
