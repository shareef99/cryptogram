/**
 * Offered on the home screen when a streak is one missed day from resetting.
 * The player can watch a rewarded ad to "freeze" (save) it, or let it go.
 */

import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function StreakFreezeModal({
  visible,
  streak,
  loading,
  onSave,
  onDismiss,
}: {
  visible: boolean;
  streak: number;
  loading: boolean;
  onSave: () => void;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.emoji}>🧊</ThemedText>
          <ThemedText style={styles.title}>Don&apos;t lose your streak!</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Your {streak}-day streak is about to break. Watch a quick ad to save it.
          </ThemedText>

          <Pressable
            onPress={onSave}
            disabled={loading}
            style={({ pressed }) => [
              styles.save,
              { backgroundColor: theme.streak, opacity: pressed || loading ? 0.7 : 1 },
            ]}>
            {loading ? (
              <ActivityIndicator color="#1a1205" />
            ) : (
              <Ionicons name="play-circle" size={20} color="#1a1205" />
            )}
            <ThemedText style={styles.saveText}>{loading ? 'Loading ad…' : 'Save my streak'}</ThemedText>
          </Pressable>

          <Pressable onPress={onDismiss} disabled={loading} style={styles.dismiss}>
            <ThemedText themeColor="textSecondary" style={styles.dismissText}>
              No thanks
            </ThemedText>
          </Pressable>
        </ThemedView>
      </View>
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
  card: { width: '100%', maxWidth: 340, borderRadius: Spacing.four, padding: Spacing.five, alignItems: 'center', gap: Spacing.two },
  emoji: { fontSize: 52, lineHeight: 60 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { textAlign: 'center', marginBottom: Spacing.two },
  save: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
  },
  saveText: { fontSize: 18, fontWeight: '800', color: '#1a1205' },
  dismiss: { paddingVertical: Spacing.two },
  dismissText: { fontSize: 15, fontWeight: '600' },
});
