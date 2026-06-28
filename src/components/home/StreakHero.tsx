/**
 * Home streak hero: the primary retention hook. Big flame + current streak,
 * progress toward the next milestone reward, and a loss-aversion nudge. Reads
 * the player store so it updates the instant a streak advances.
 */

import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { STREAK_MILESTONES } from '@/constants/economy';
import { Spacing } from '@/constants/theme';
import { getDatabase } from '@/db';
import { useTheme } from '@/hooks/use-theme';
import { addDays, localDateString } from '@/lib/streak';
import { usePlayerStore } from '@/store/player-store';

function nextMilestoneDay(streak: number): number | null {
  return STREAK_MILESTONES.find((m) => m.day > streak)?.day ?? null;
}

// Dev-only: prime the streak to one short of the next milestone so the next
// solve crosses one (long-press the hero).
async function devPrimeMilestone() {
  const db = await getDatabase();
  const yesterday = addDays(localDateString(new Date()), -1);
  await db.runAsync('UPDATE player SET current_streak = 2, last_active_date = ? WHERE id = 1', yesterday);
  await usePlayerStore.getState().hydrate();
}

function StreakHeroInner() {
  const theme = useTheme();
  const streak = usePlayerStore((s) => s.currentStreak);
  const nextDay = nextMilestoneDay(streak);
  const pct = nextDay ? Math.min(100, (streak / nextDay) * 100) : 100;

  const subtitle =
    streak === 0
      ? 'Solve one today to start a streak'
      : nextDay
        ? `${nextDay - streak} day${nextDay - streak === 1 ? '' : 's'} to your next reward`
        : 'Top streak tier — keep it alive!';

  return (
    <Pressable
      onLongPress={__DEV__ ? () => devPrimeMilestone() : undefined}
      style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={[styles.flameCircle, { backgroundColor: `${theme.streak}22` }]}>
        <ThemedText style={styles.flame}>🔥</ThemedText>
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <ThemedText style={styles.count}>{streak}</ThemedText>
          <ThemedText style={styles.dayLabel}>day{streak === 1 ? '' : 's'}</ThemedText>
        </View>
        <ThemedText themeColor="textSecondary" type="small" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
        <View style={[styles.track, { backgroundColor: theme.cellBorder }]}>
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: theme.streak }]} />
        </View>
      </View>
    </Pressable>
  );
}

export const StreakHero = memo(StreakHeroInner);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
  flameCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  flame: { fontSize: 30, lineHeight: 38 },
  body: { flex: 1, gap: Spacing.one + 2 },
  topRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two },
  count: { fontSize: 30, fontWeight: '900', lineHeight: 32 },
  dayLabel: { fontSize: 16, fontWeight: '700' },
  subtitle: {},
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 2 },
  fill: { height: '100%', borderRadius: 3 },
});
