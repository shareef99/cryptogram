/**
 * Home screen: progress summary, coin balance, Continue (resume the most recent
 * in-progress puzzle), and difficulty-aware Play. Data refreshes on focus so it
 * reflects puzzles solved since the last visit.
 */

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoinIcon } from '@/components/CoinIcon';
import { StreakPanel } from '@/components/meta/StreakPanel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getDatabase, getInProgressQuote, getQuoteCounts } from '@/db';
import { useTheme } from '@/hooks/use-theme';
import { usePlayerStore } from '@/store/player-store';
import { useSettingsStore } from '@/store/settings-store';
import { useUiStore } from '@/store/ui-store';
import type { Difficulty, QuoteCounts } from '@/types';

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 1, label: 'Easy' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Hard' },
];

function startPuzzle(difficulty?: Difficulty) {
  router.push({
    pathname: '/play/[id]',
    params: { id: 'new', ...(difficulty ? { difficulty: String(difficulty) } : {}) },
  });
}

export default function HomeScreen() {
  const theme = useTheme();
  const [counts, setCounts] = useState<QuoteCounts | null>(null);
  const [continueId, setContinueId] = useState<number | null>(null);
  const coins = usePlayerStore((s) => s.coins);
  const settingsHydrated = useSettingsStore((s) => s.hydrated);

  // First launch: once settings are loaded, show the how-to overlay a single
  // time and remember it. Runs when hydration flips true (async at startup).
  useEffect(() => {
    if (!settingsHydrated) return;
    const { onboardingSeen, setOnboardingSeen } = useSettingsStore.getState();
    if (!onboardingSeen) {
      useUiStore.getState().showHelp();
      setOnboardingSeen(true).catch(() => {});
    }
  }, [settingsHydrated]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const db = await getDatabase();
          const [c, inProgress] = await Promise.all([
            getQuoteCounts(db),
            getInProgressQuote(db),
          ]);
          if (!active) return;
          setCounts(c);
          setContinueId(inProgress?.id ?? null);
          // Keep coins/streak fresh in case they changed elsewhere.
          usePlayerStore.getState().hydrate();
        } catch {
          /* DB not ready yet — leave defaults */
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const solved = counts?.solved ?? 0;
  const total = counts?.total ?? 0;
  const pct = total > 0 ? (solved / total) * 100 : 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <Pressable
            // Dev-only: long-press to grant coins + Lucky Reveals for testing.
            onLongPress={
              __DEV__
                ? () => {
                    usePlayerStore.getState().awardCoins(100);
                    usePlayerStore.getState().grantHint2(3);
                  }
                : undefined
            }
            style={[styles.coinPill, { backgroundColor: theme.backgroundElement }]}>
            <CoinIcon size={15} />
            <ThemedText style={styles.coinText}>{coins}</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={8}
            style={[styles.settingsButton, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={styles.settingsIcon}>⚙</ThemedText>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <ThemedText type="title" style={styles.title}>
            Cryptogram
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Crack the code. Decode the quote.
          </ThemedText>
        </View>

        <View style={styles.bottom}>
          <StreakPanel />

          <View style={styles.progressRow}>
            <ThemedText themeColor="textSecondary" type="small">
              {solved} of {total} solved
            </ThemedText>
            <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
              <View style={[styles.progressFill, { backgroundColor: theme.primary, width: `${pct}%` }]} />
            </View>
          </View>

          {continueId != null && (
            <Pressable
              onPress={() => router.push({ pathname: '/play/[id]', params: { id: String(continueId) } })}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
              ]}>
              <ThemedText themeColor="primaryText" style={styles.primaryLabel}>
                Continue
              </ThemedText>
            </Pressable>
          )}

          <Pressable
            onPress={() => startPuzzle()}
            style={({ pressed }) => [
              continueId != null ? styles.secondaryButton : styles.primaryButton,
              continueId != null
                ? { borderColor: theme.primary }
                : { backgroundColor: theme.primary },
              { opacity: pressed ? 0.85 : 1 },
            ]}>
            <ThemedText
              themeColor={continueId != null ? 'primary' : 'primaryText'}
              style={styles.primaryLabel}>
              {continueId != null ? 'New puzzle' : 'Play'}
            </ThemedText>
          </Pressable>

          <View style={styles.difficultyRow}>
            {DIFFICULTIES.map((d) => (
              <Pressable
                key={d.value}
                onPress={() => startPuzzle(d.value)}
                style={({ pressed }) => [
                  styles.chip,
                  { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
                ]}>
                <ThemedText type="small">{d.label}</ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.two,
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 999,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: { fontSize: 20 },
  coinIcon: { fontSize: 16 },
  coinText: { fontSize: 16, fontWeight: '700' },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.two },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  bottom: { gap: Spacing.three, paddingBottom: Spacing.four },
  progressRow: { gap: Spacing.two, alignItems: 'center' },
  progressTrack: { width: '100%', height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  primaryButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'center',
  },
  secondaryButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'center',
    borderWidth: 2,
  },
  primaryLabel: { fontSize: 19, fontWeight: '700' },
  difficultyRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
});
