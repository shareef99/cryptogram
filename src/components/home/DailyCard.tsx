/**
 * Home Daily-Challenge call-to-action. Bold (primary-filled) and inviting until
 * today's puzzle is solved, then a calm "done" state that still links to the
 * calendar for backfilling and history.
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function DailyCard({ done }: { done: boolean }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => router.push('/daily')}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: done ? theme.backgroundElement : theme.primary, opacity: pressed ? 0.9 : 1 },
      ]}>
      <ThemedText style={styles.emoji}>🗓️</ThemedText>
      <View style={styles.text}>
        <ThemedText
          themeColor={done ? 'text' : 'primaryText'}
          style={styles.title}>
          Daily Challenge
        </ThemedText>
        <ThemedText
          themeColor={done ? 'textSecondary' : 'primaryText'}
          type="small"
          style={!done && styles.subOnPrimary}>
          {done ? 'Done — come back tomorrow ✓' : "Today's puzzle · keep your streak"}
        </ThemedText>
      </View>
      <Ionicons
        name={done ? 'chevron-forward' : 'play'}
        size={22}
        color={done ? theme.textSecondary : theme.primaryText}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  emoji: { fontSize: 28, lineHeight: 34 },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 18, fontWeight: '800' },
  subOnPrimary: { opacity: 0.9 },
});
