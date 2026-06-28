/**
 * One day in the Daily-challenge calendar. State drives appearance:
 *  - done   → filled (solved that date's puzzle)
 *  - today  → ringed (playable)
 *  - missed → subtle fill (past, not done — backfillable)
 *  - future → dimmed, disabled
 * Blank padding cells (no date) render as an empty spacer.
 */

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { CalendarCell } from '@/types';

export function DayCell({ cell, onPress }: { cell: CalendarCell; onPress: (date: string) => void }) {
  const theme = useTheme();

  if (!cell.date) return <View style={styles.cell} />;

  const playable = !cell.isFuture && !cell.done;
  const innerStyle = cell.done
    ? { backgroundColor: theme.primary }
    : cell.isToday
      ? { borderWidth: 2, borderColor: theme.primary }
      : cell.isFuture
        ? null
        : { backgroundColor: theme.backgroundElement }; // missed / backfillable

  return (
    <View style={styles.cell}>
      <Pressable
        disabled={!playable}
        onPress={() => onPress(cell.date as string)}
        style={({ pressed }) => [styles.inner, innerStyle, pressed && playable && { opacity: 0.7 }]}>
        <ThemedText
          themeColor={cell.done ? 'primaryText' : 'text'}
          style={[styles.day, cell.isFuture && styles.future]}>
          {cell.day}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3 },
  inner: { flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  day: { fontSize: 15, fontWeight: '700' },
  future: { opacity: 0.35 },
});
