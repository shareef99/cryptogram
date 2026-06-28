/**
 * A compact stat tile for the home stats row (solved count, achievements, best
 * streak). Tappable when an onPress is given (e.g. achievements → its screen).
 */

import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { Pressable } from 'react-native';

export function StatTile({
  emoji,
  value,
  label,
  onPress,
}: {
  emoji: string;
  value: string;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.wrap, pressed && onPress ? styles.pressed : null]}>
      <ThemedView type="backgroundElement" style={styles.tile}>
        <ThemedText style={styles.emoji}>{emoji}</ThemedText>
        <ThemedText style={styles.value}>{value}</ThemedText>
        <ThemedText themeColor="textSecondary" type="small" style={styles.label}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  pressed: { opacity: 0.7 },
  tile: {
    borderRadius: Spacing.four,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    gap: 2,
  },
  emoji: { fontSize: 20, lineHeight: 26 },
  value: { fontSize: 20, fontWeight: '800' },
  label: { textAlign: 'center' },
});
