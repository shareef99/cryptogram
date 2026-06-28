/**
 * Puzzle screen. Loads a quote from the DB (a specific id, or a fresh random
 * unsolved one for "new"), builds the puzzle into the game store, and renders
 * the header + scrollable grid + keyboard. On solve it records rewards and
 * routes to the result screen; running out of lives shows a lost banner.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlayBanner } from '@/ads';
import { GameHeader } from '@/components/game/GameHeader';
import { HintFabs } from '@/components/game/HintFabs';
import { HintPickBar } from '@/components/game/HintPickBar';
import { Keyboard } from '@/components/game/Keyboard';
import { PuzzleGrid } from '@/components/game/PuzzleGrid';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { COIN_REWARD } from '@/constants/economy';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import {
  checkAndUnlockAchievements,
  getDailyQuote,
  getDatabase,
  getProgress,
  getQuoteById,
  getRandomUnsolvedQuote,
  getSequencedUnsolvedQuote,
  grantMonthRewardIfComplete,
  parseGuesses,
  recordDailyResult,
  recordLevelCleared,
  toQuoteInput,
} from '@/db';
import { useHints } from '@/hooks/use-hints';
import { usePersistProgress } from '@/hooks/use-persist-progress';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { localDateString } from '@/lib/streak';
import { useGameStore } from '@/store/game-store';
import { usePlayerStore } from '@/store/player-store';
import { useResultStore } from '@/store/result-store';
import type { Achievement, Difficulty } from '@/types';

export default function PlayScreen() {
  const { id, difficulty, daily } = useLocalSearchParams<{
    id: string;
    difficulty?: string;
    daily?: string; // YYYY-MM-DD when playing the daily challenge for that date
  }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [author, setAuthor] = useState<string | null>(null);
  const [quoteId, setQuoteId] = useState<number | null>(null);
  const [puzzleDifficulty, setPuzzleDifficulty] = useState<Difficulty>(1);

  const puzzle = useGameStore((s) => s.puzzle);
  const status = useGameStore((s) => s.status);
  const load = useGameStore((s) => s.load);
  const reset = useGameStore((s) => s.reset);
  const hints = useHints(quoteId);
  const awardCoins = usePlayerStore((s) => s.awardCoins);

  usePersistProgress(quoteId, {
    onSolved: async ({ timeSeconds }) => {
      haptics.success();
      const reward = COIN_REWARD[puzzleDifficulty];
      const mistakes = useGameStore.getState().mistakes;
      await awardCoins(reward);
      let milestone = null;
      let monthReward = null;
      let streak = 0;
      let achievements: Achievement[] = [];
      try {
        const db = await getDatabase();
        const r = await recordLevelCleared(db, localDateString(new Date()), reward);
        milestone = r.milestone;
        streak = r.currentStreak;
        // Daily challenge: log the result so the calendar marks it done, then
        // check whether that completed the whole month (one-time bonus).
        if (daily && quoteId != null) {
          await recordDailyResult(db, daily, quoteId, useGameStore.getState().mistakes, Date.now());
          monthReward = await grantMonthRewardIfComplete(db, daily);
        }
        achievements = await checkAndUnlockAchievements(db, {
          mistakes,
          timeSeconds,
          difficulty: puzzleDifficulty,
          currentStreak: r.currentStreak,
          longestStreak: r.longestStreak,
        });
        await usePlayerStore.getState().hydrate(); // reflect all coin/hint2 grants
      } catch {
        /* streak update is best-effort */
      }
      useResultStore.getState().setResult({
        quoteId: quoteId ?? 0,
        quote: useGameStore.getState().puzzle?.text ?? '',
        author,
        coinsEarned: reward,
        difficulty: puzzleDifficulty,
        milestone,
        monthReward,
        mistakes,
        timeSeconds,
        streak,
        daily: daily ?? null,
        achievements,
      });
      router.replace('/result');
    },
  });

  const loadPuzzle = useCallback(
    async (which: string, opts?: { fresh?: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const db = await getDatabase();
        const diff = difficulty ? (Number(difficulty) as Difficulty) : undefined;
        // Daily mode resolves the deterministic puzzle for its date; otherwise a
        // specific quote (resume/restart) or a fresh random unsolved one.
        const row = daily
          ? await getDailyQuote(db, daily)
          : which && which !== 'new'
            ? await getQuoteById(db, Number(which))
            : diff
              ? await getRandomUnsolvedQuote(db, diff)
              : await getSequencedUnsolvedQuote(db);
        if (!row) {
          setError('No more puzzles — you solved them all!');
          return;
        }
        // A fresh restart (or the daily, which is always replayed from scratch)
        // ignores saved guesses so the puzzle begins from its foothold again.
        const progress = daily || opts?.fresh ? null : await getProgress(db, row.id);
        setAuthor(row.author);
        setQuoteId(row.id);
        setPuzzleDifficulty(row.difficulty as Difficulty);
        // Resume saved progress if any; otherwise let load() pre-fill a foothold.
        const resume = progress?.guesses ? parseGuesses(progress.guesses) : undefined;
        load(toQuoteInput(row), resume);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load puzzle');
      } finally {
        setLoading(false);
      }
    },
    [load, difficulty, daily],
  );

  useEffect(() => {
    loadPuzzle(id);
    return () => reset();
  }, [id, loadPuzzle, reset]);

  return (
    <ThemedView style={styles.container}>
      {/* Insets from the hook (not the SafeAreaView component) so the header's
          top padding is stable — the component re-measures its rect during the
          screen-push transition and would briefly shift the header. */}
      <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <GameHeader />

        <View style={styles.gridArea}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
              <Pressable onPress={() => router.back()} style={[styles.button, { backgroundColor: theme.primary }]}>
                <ThemedText themeColor="primaryText" style={styles.buttonText}>
                  Back
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            puzzle && <PuzzleGrid puzzle={puzzle} />
          )}

          {!loading && !error && status === 'playing' && hints.hintMode !== 'pick' && (
            <View style={styles.floatingHints} pointerEvents="box-none">
              <HintFabs hints={hints} />
            </View>
          )}
        </View>

        {status === 'lost' && (
          <Animated.View
            entering={ZoomIn.springify().damping(14)}
            style={[styles.banner, { backgroundColor: theme.danger }]}>
            <ThemedText themeColor="primaryText" style={styles.bannerTitle}>
              Out of guesses 😕
            </ThemedText>
            <ThemedText themeColor="primaryText" style={styles.bannerSub}>
              Better luck on the next one!
            </ThemedText>
            <Pressable
              onPress={() => loadPuzzle(quoteId != null ? String(quoteId) : 'new', { fresh: true })}
              style={[styles.button, styles.whiteButton]}>
              <ThemedText style={[styles.buttonText, { color: theme.danger }]}>Try again</ThemedText>
            </Pressable>
            <Pressable onPress={() => router.replace('/')} style={[styles.button, styles.bannerGhost]}>
              <ThemedText themeColor="primaryText" style={styles.buttonText}>
                Back home
              </ThemedText>
            </Pressable>
          </Animated.View>
        )}

        {!loading && !error && status === 'playing' && (
          <View style={styles.controls}>
            {hints.hintMode === 'pick' ? (
              <HintPickBar onSurprise={hints.surprise} onCancel={hints.cancelReveal} />
            ) : (
              <Keyboard />
            )}
          </View>
        )}

        <PlayBanner />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safe: { flex: 1, width: '100%', maxWidth: MaxContentWidth },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.three, padding: Spacing.four },
  errorText: { textAlign: 'center' },
  gridArea: { flex: 1, position: 'relative' },
  floatingHints: { position: 'absolute', right: Spacing.three, bottom: Spacing.three },
  banner: {
    margin: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  bannerTitle: { fontSize: 24, fontWeight: '800' },
  bannerSub: { fontSize: 16 },
  controls: { gap: Spacing.three, paddingVertical: Spacing.two },
  button: {
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'center',
  },
  whiteButton: { backgroundColor: '#ffffff', marginTop: Spacing.two },
  bannerGhost: { backgroundColor: 'rgba(255,255,255,0.18)' },
  buttonText: { fontSize: 17, fontWeight: '700' },
});
