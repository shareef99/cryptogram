/**
 * Puzzle screen header: back button and remaining lives (hearts). The letter
 * count is intentionally hidden.
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MAX_MISTAKES, useGameStore } from '@/store/game-store';

function GameHeaderInner() {
  const theme = useTheme();
  const mistakes = useGameStore((s) => s.mistakes);
  const remaining = MAX_MISTAKES - mistakes;

  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back}>
        <Ionicons name="chevron-back" size={28} color={theme.text} />
      </Pressable>

      <Pressable
        onLongPress={__DEV__ ? () => useGameStore.getState().__devSolve() : undefined}
        style={styles.lives}>
        {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
          <Ionicons
            key={i}
            name={i < remaining ? 'heart' : 'heart-outline'}
            size={22}
            color={i < remaining ? theme.danger : theme.cellBorder}
          />
        ))}
      </Pressable>

      <View style={styles.back} />
    </View>
  );
}

export const GameHeader = memo(GameHeaderInner);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  back: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  lives: { flexDirection: 'row', gap: Spacing.one },
});
