/**
 * One achievement row: emoji badge, title + description, and lock state.
 * Locked rows are dimmed with a lock icon; unlocked rows show in full colour.
 */

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Achievement } from '@/types';

export function AchievementRow({ achievement, unlocked }: { achievement: Achievement; unlocked: boolean }) {
  const theme = useTheme();
  return (
    <ThemedView type="backgroundElement" style={[styles.row, !unlocked && styles.locked]}>
      <View style={[styles.badge, { backgroundColor: unlocked ? theme.primary : theme.cellBorder }]}>
        <ThemedText style={styles.emoji}>{achievement.emoji}</ThemedText>
      </View>
      <View style={styles.text}>
        <ThemedText style={styles.title}>{achievement.title}</ThemedText>
        <ThemedText themeColor="textSecondary" type="small">
          {achievement.description}
        </ThemedText>
      </View>
      <Ionicons
        name={unlocked ? 'checkmark-circle' : 'lock-closed'}
        size={22}
        color={unlocked ? theme.success : theme.cellBorder}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  locked: { opacity: 0.55 },
  badge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontWeight: '700' },
});
