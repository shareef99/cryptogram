/**
 * Home streak panel: current streak + progress toward the next milestone.
 * Reads from the player store, so it updates as soon as a streak advances.
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
  const next = STREAK_MILESTONES.find((m) => m.day > streak);
  return next?.day ?? null;
}

// Dev-only: prime the streak to one short of the next milestone (last active
// yesterday), so the next solve crosses a milestone for testing.
async function devPrimeMilestone() {
  const db = await getDatabase();
  const yesterday = addDays(localDateString(new Date()), -1);
  await db.runAsync('UPDATE player SET current_streak = 2, last_active_date = ? WHERE id = 1', yesterday);
  await usePlayerStore.getState().hydrate();
}

function StreakPanelInner() {
  const theme = useTheme();
  const streak = usePlayerStore((s) => s.currentStreak);
  const nextDay = nextMilestoneDay(streak);

  return (
    <Pressable
      onLongPress={__DEV__ ? () => devPrimeMilestone() : undefined}
      style={[styles.panel, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText style={styles.flame}>🔥</ThemedText>
      <View style={styles.text}>
        <ThemedText style={styles.streak}>
          {streak} day{streak === 1 ? '' : 's'}
        </ThemedText>
        <ThemedText themeColor="textSecondary" type="small">
          {streak === 0
            ? 'Solve one today to start a streak'
            : nextDay
              ? `${nextDay - streak} day${nextDay - streak === 1 ? '' : 's'} to your next reward`
              : 'Top streak tier — keep going!'}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export const StreakPanel = memo(StreakPanelInner);

const styles = StyleSheet.create({
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
  },
  flame: { fontSize: 28 },
  text: { flex: 1, gap: 2 },
  streak: { fontSize: 18, fontWeight: '800' },
});
