/**
 * Home screen — engagement-first layout. Hierarchy is ordered by what brings
 * players back: streak (loss-aversion) → daily challenge (the habit) → continue
 * / quick play → stats (progress + achievements). Data refreshes on focus.
 */

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoinIcon } from '@/components/CoinIcon';
import { DailyCard } from '@/components/home/DailyCard';
import { StatTile } from '@/components/home/StatTile';
import { StreakHero } from '@/components/home/StreakHero';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getDailyResult, getDatabase, getInProgressQuote, getQuoteCounts, getUnlockedIds } from '@/db';
import { ACHIEVEMENTS } from '@/game/achievements';
import { useTheme } from '@/hooks/use-theme';
import { todayString } from '@/lib/calendar';
import { usePlayerStore } from '@/store/player-store';
import { useSettingsStore } from '@/store/settings-store';
import { useUiStore } from '@/store/ui-store';

// Difficulty is no longer player-selected — Play auto-rotates easy/medium/hard
// (see getSequencedUnsolvedQuote).
function startPuzzle() {
  router.push({ pathname: '/play/[id]', params: { id: 'new' } });
}

export default function HomeScreen() {
  const theme = useTheme();
  const [solved, setSolved] = useState(0);
  const [continueId, setContinueId] = useState<number | null>(null);
  const [dailyDone, setDailyDone] = useState(false);
  const [achUnlocked, setAchUnlocked] = useState(0);
  const coins = usePlayerStore((s) => s.coins);
  const longestStreak = usePlayerStore((s) => s.longestStreak);
  const settingsHydrated = useSettingsStore((s) => s.hydrated);

  // First launch: show the how-to overlay once, then remember it.
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
          const today = todayString();
          const [counts, inProgress, dailyRes, unlocked] = await Promise.all([
            getQuoteCounts(db),
            getInProgressQuote(db),
            getDailyResult(db, today),
            getUnlockedIds(db),
          ]);
          if (!active) return;
          setSolved(counts.solved);
          setContinueId(inProgress?.id ?? null);
          setDailyDone(dailyRes?.solvedAt != null);
          setAchUnlocked(unlocked.size);
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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.brand}>
            <ThemedText style={styles.title}>Cryptogram</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Crack the code. Decode the quote.
            </ThemedText>
          </View>

          <StreakHero />
          <DailyCard done={dailyDone} />

          {continueId != null && (
            <Pressable
              onPress={() => router.push({ pathname: '/play/[id]', params: { id: String(continueId) } })}
              style={({ pressed }) => [
                styles.continueButton,
                { borderColor: theme.primary, opacity: pressed ? 0.85 : 1 },
              ]}>
              <ThemedText themeColor="primary" style={styles.continueLabel}>
                Continue last puzzle
              </ThemedText>
            </Pressable>
          )}

          <Pressable
            onPress={() => startPuzzle()}
            style={({ pressed }) => [
              styles.playButton,
              { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
            ]}>
            <ThemedText themeColor="primaryText" style={styles.playLabel}>
              {continueId != null ? 'New puzzle' : 'Play'}
            </ThemedText>
          </Pressable>

          <View style={styles.statsRow}>
            <StatTile emoji="📚" value={String(solved)} label="Solved" />
            <StatTile
              emoji="🏅"
              value={`${achUnlocked}/${ACHIEVEMENTS.length}`}
              label="Badges"
              onPress={() => router.push('/achievements')}
            />
            <StatTile emoji="🔥" value={String(longestStreak)} label="Best streak" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safe: { flex: 1, width: '100%', maxWidth: MaxContentWidth, paddingHorizontal: Spacing.four },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 999,
  },
  coinText: { fontSize: 16, fontWeight: '700' },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: { fontSize: 20 },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.five },
  brand: { alignItems: 'center', gap: 2, paddingTop: Spacing.three, paddingBottom: Spacing.one },
  title: { fontSize: 38, lineHeight: 44, fontWeight: '900', textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  continueButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'center',
    borderWidth: 2,
  },
  continueLabel: { fontSize: 17, fontWeight: '700' },
  playButton: { paddingVertical: Spacing.three, borderRadius: Spacing.four, alignItems: 'center' },
  playLabel: { fontSize: 19, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: Spacing.three, paddingTop: Spacing.one },
});
