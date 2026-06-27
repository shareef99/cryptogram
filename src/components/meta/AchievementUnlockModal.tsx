/**
 * Shown on the result screen when one or more achievements unlock from a solve.
 * Lists each newly unlocked badge; tap anywhere or "Nice!" to dismiss.
 */

import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Achievement } from '@/types';

export function AchievementUnlockModal({
  achievements,
  onClose,
}: {
  achievements: Achievement[];
  onClose: () => void;
}) {
  const theme = useTheme();
  if (achievements.length === 0) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.heading}>
            {achievements.length > 1 ? 'Achievements unlocked!' : 'Achievement unlocked!'}
          </ThemedText>

          <View style={styles.list}>
            {achievements.map((a) => (
              <View key={a.id} style={styles.row}>
                <ThemedText style={styles.emoji}>{a.emoji}</ThemedText>
                <View style={styles.text}>
                  <ThemedText style={styles.title}>{a.title}</ThemedText>
                  <ThemedText themeColor="textSecondary" type="small">
                    {a.description}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>

          <Pressable onPress={onClose} style={[styles.button, { backgroundColor: theme.primary }]}>
            <ThemedText themeColor="primaryText" style={styles.buttonText}>
              Nice!
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
    maxWidth: 360,
    borderRadius: Spacing.four,
    padding: Spacing.five,
    gap: Spacing.three,
  },
  heading: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  list: { gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  emoji: { fontSize: 34 },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontWeight: '700' },
  button: { paddingVertical: Spacing.three, borderRadius: Spacing.four, alignItems: 'center' },
  buttonText: { fontSize: 18, fontWeight: '700' },
});
