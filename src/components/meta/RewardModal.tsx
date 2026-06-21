/**
 * Celebratory modal shown when a streak milestone is reached, revealing the
 * coins and scarce Hint-2 ("Lucky Reveal") rewards earned.
 */

import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { Milestone } from '@/db';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function RewardModal({
  milestone,
  onClose,
}: {
  milestone: Milestone | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  if (!milestone) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.flame}>🔥</ThemedText>
          <ThemedText style={styles.title}>{milestone.day}-day streak!</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Keep it going — here's your reward
          </ThemedText>

          <View style={styles.rewards}>
            <View style={styles.reward}>
              <ThemedText style={[styles.rewardIcon, { color: theme.coin }]}>●</ThemedText>
              <ThemedText style={styles.rewardValue}>+{milestone.coins}</ThemedText>
            </View>
            <View style={styles.reward}>
              <ThemedText style={styles.rewardIcon}>✨</ThemedText>
              <ThemedText style={styles.rewardValue}>+{milestone.hint2}</ThemedText>
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
  flame: { fontSize: 56 },
  title: { fontSize: 26, fontWeight: '800' },
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
