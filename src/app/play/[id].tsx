/**
 * Puzzle screen. Loads a quote from the DB (a specific id, or a fresh random
 * unsolved one for "new"), builds the puzzle into the game store, and renders
 * the header + scrollable grid + keyboard. Win state shows a simple banner for
 * now (richer overlay + coins/animations arrive in later phases).
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameHeader } from '@/components/game/GameHeader';
import { HintControls } from '@/components/game/HintControls';
import { Keyboard } from '@/components/game/Keyboard';
import { PuzzleGrid } from '@/components/game/PuzzleGrid';
import { RewardModal } from '@/components/meta/RewardModal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { COIN_REWARD } from '@/constants/economy';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import {
  getDatabase,
  getProgress,
  getQuoteById,
  getRandomUnsolvedQuote,
  parseGuesses,
  recordLevelCleared,
  toQuoteInput,
  type Difficulty,
  type Milestone,
} from '@/db';
import { usePersistProgress } from '@/hooks/use-persist-progress';
import { useTheme } from '@/hooks/use-theme';
import { localDateString } from '@/lib/streak';
import { useGameStore } from '@/store/game-store';
import { usePlayerStore } from '@/store/player-store';

export default function PlayScreen() {
  const { id, difficulty } = useLocalSearchParams<{ id: string; difficulty?: string }>();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [author, setAuthor] = useState<string | null>(null);
  const [quoteId, setQuoteId] = useState<number | null>(null);
  const [puzzleDifficulty, setPuzzleDifficulty] = useState<Difficulty>(1);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [milestone, setMilestone] = useState<Milestone | null>(null);

  const puzzle = useGameStore((s) => s.puzzle);
  const status = useGameStore((s) => s.status);
  const hintMode = useGameStore((s) => s.hintMode);
  const load = useGameStore((s) => s.load);
  const reset = useGameStore((s) => s.reset);
  const awardCoins = usePlayerStore((s) => s.awardCoins);

  usePersistProgress(quoteId, {
    onSolved: async () => {
      const reward = COIN_REWARD[puzzleDifficulty];
      setCoinsEarned(reward);
      await awardCoins(reward);
      try {
        const db = await getDatabase();
        const result = await recordLevelCleared(db, localDateString(new Date()), reward);
        await usePlayerStore.getState().hydrate(); // sync streak + milestone grants
        if (result.milestone) setMilestone(result.milestone);
      } catch {
        /* streak update is best-effort */
      }
    },
  });

  const loadPuzzle = useCallback(
    async (which: string) => {
      setLoading(true);
      setError(null);
      try {
        const db = await getDatabase();
        const diff = difficulty ? (Number(difficulty) as Difficulty) : undefined;
        const row =
          which && which !== 'new'
            ? await getQuoteById(db, Number(which))
            : await getRandomUnsolvedQuote(db, diff);
        if (!row) {
          setError('No more puzzles — you solved them all!');
          return;
        }
        // Resume any saved guesses for this quote.
        const progress = await getProgress(db, row.id);
        setAuthor(row.author);
        setQuoteId(row.id);
        setPuzzleDifficulty(row.difficulty as Difficulty);
        setCoinsEarned(0);
        setMilestone(null);
        load(toQuoteInput(row), parseGuesses(progress?.guesses ?? null));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load puzzle');
      } finally {
        setLoading(false);
      }
    },
    [load, difficulty],
  );

  useEffect(() => {
    loadPuzzle(id);
    return () => reset();
  }, [id, loadPuzzle, reset]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <GameHeader />

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
          <ScrollView
            contentContainerStyle={styles.gridScroll}
            showsVerticalScrollIndicator={false}>
            {puzzle && <PuzzleGrid puzzle={puzzle} />}
          </ScrollView>
        )}

        {status === 'won' && (
          <View style={[styles.winBanner, { backgroundColor: theme.success }]}>
            <ThemedText themeColor="primaryText" style={styles.winTitle}>
              Solved! 🎉
            </ThemedText>
            {author && (
              <ThemedText themeColor="primaryText" style={styles.winAuthor}>
                — {author}
              </ThemedText>
            )}
            <View style={styles.coinsEarned}>
              <ThemedText themeColor="primaryText" style={styles.coinsEarnedText}>
                + {coinsEarned}
              </ThemedText>
              <ThemedText style={[styles.coinDot, { color: theme.coin }]}>●</ThemedText>
            </View>
            <Pressable onPress={() => loadPuzzle('new')} style={[styles.button, styles.winButton]}>
              <ThemedText style={styles.buttonText}>Next puzzle</ThemedText>
            </Pressable>
          </View>
        )}

        {!loading && !error && status === 'playing' && (
          <View style={styles.controls}>
            <HintControls quoteId={quoteId} />
            {hintMode !== 'pick' && <Keyboard />}
          </View>
        )}

        <RewardModal milestone={milestone} onClose={() => setMilestone(null)} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safe: { flex: 1, width: '100%', maxWidth: MaxContentWidth },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.three, padding: Spacing.four },
  errorText: { textAlign: 'center' },
  gridScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.four,
  },
  winBanner: {
    margin: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  winTitle: { fontSize: 24, fontWeight: '800' },
  winAuthor: { fontSize: 16 },
  coinsEarned: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  coinsEarnedText: { fontSize: 20, fontWeight: '800' },
  coinDot: { fontSize: 16 },
  controls: { gap: Spacing.two, paddingBottom: Spacing.one },
  button: {
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'center',
  },
  winButton: { backgroundColor: '#ffffff', marginTop: Spacing.two },
  buttonText: { fontSize: 17, fontWeight: '700' },
});
