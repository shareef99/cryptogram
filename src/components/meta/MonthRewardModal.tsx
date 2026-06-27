/**
 * Celebratory modal shown when the player completes every daily challenge in a
 * calendar month, revealing the one-time coins + Hint-2 bonus.
 */

import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { monthLabel } from '@/lib/calendar';
import { useTheme } from '@/hooks/use-theme';
import type { MonthReward } from '@/types';

export function MonthRewardModal({
  reward,
  onClose,
}: {
  reward: MonthReward | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  if (!reward) return null;

  const year = Number(reward.month.slice(0, 4));
  const month1 = Number(reward.month.slice(5, 7));

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.emoji}>🗓️</ThemedText>
          <ThemedText style={styles.title}>{monthLabel(year, month1)} complete!</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Every daily this month — here&apos;s your bonus
          </ThemedText>

          <View style={styles.rewards}>
            <View style={styles.reward}>
              <ThemedText style={[styles.rewardIcon, { color: theme.coin }]}>●</ThemedText>
              <ThemedText style={styles.rewardValue}>+{reward.coins}</ThemedText>
            </View>
            <View style={styles.reward}>
              <ThemedText style={styles.rewardIcon}>✨</ThemedText>
              <ThemedText style={styles.rewardValue}>+{reward.hint2}</ThemedText>
            </View>
          </View>

          <Pressable onPress={onClose} style={[styles.button, { backgroundColor: theme.primary }]}>
            <ThemedText themeColor="primaryText" style={styles.buttonText}>
              Claim
            </ThemedText>
          </Pressable>
        </ThemedView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Spacing.four,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  emoji: { fontSize: 56 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  rewards: { flexDirection: 'row', gap: Spacing.five, marginVertical: Spacing.three },
  reward: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  rewardIcon: { fontSize: 22 },
  rewardValue: { fontSize: 22, fontWeight: '800' },
  button: {
    alignSelf: 'stretch',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'center',
  },
  buttonText: { fontSize: 18, fontWeight: '700' },
});
