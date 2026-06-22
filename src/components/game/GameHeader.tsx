/**
 * Puzzle screen header: back button and remaining lives (hearts). The letter
 * count is intentionally hidden.
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CoinIcon } from '@/components/CoinIcon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MAX_MISTAKES, useGameStore } from '@/store/game-store';
import { usePlayerStore } from '@/store/player-store';

function GameHeaderInner() {
  const theme = useTheme();
  const mistakes = useGameStore((s) => s.mistakes);
  const remaining = MAX_MISTAKES - mistakes;
  const coins = usePlayerStore((s) => s.coins);

  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.side}>
        <Ionicons name="chevron-back" size={28} color={theme.text} />
      </Pressable>

      <Pressable
        onLongPress={__DEV__ ? () => useGameStore.getState().__devSolve() : undefined}
        style={styles.coins}>
        <CoinIcon size={18} />
        <ThemedText style={styles.coinText}>{coins}</ThemedText>
      </Pressable>

      <View style={[styles.side, styles.lives]}>
        {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
          <Ionicons
            key={i}
            name={i < remaining ? 'heart' : 'heart-outline'}
            size={20}
            color={i < remaining ? theme.danger : theme.cellBorder}
          />
        ))}
      </View>
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
  side: { minWidth: 88, height: 40, justifyContent: 'center' },
  coins: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  coinText: { fontSize: 18, fontWeight: '800' },
  lives: { flexDirection: 'row', gap: 2, justifyContent: 'flex-end' },
});
