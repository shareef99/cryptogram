/**
 * Puzzle screen header: back button (left), remaining lives (center), and the
 * coin balance (right). The three sections use equal-flex side columns so the
 * centered hearts never move when the coin value's width changes on load.
 * The letter count is intentionally hidden.
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
      <View style={[styles.side, styles.left]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.lives}>
        {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
          <Ionicons
            key={i}
            name={i < remaining ? 'heart' : 'heart-outline'}
            size={20}
            color={i < remaining ? theme.danger : theme.cellBorder}
          />
        ))}
      </View>

      <View style={[styles.side, styles.right]}>
        <Pressable
          onLongPress={__DEV__ ? () => useGameStore.getState().__devSolve() : undefined}
          style={styles.coins}>
          <CoinIcon size={18} />
          <ThemedText style={styles.coinText}>{coins}</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

export const GameHeader = memo(GameHeaderInner);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  side: { flex: 1, height: 40, justifyContent: 'center' },
  left: { alignItems: 'flex-start' },
  right: { alignItems: 'flex-end' },
  lives: { flexDirection: 'row', gap: 2 },
  coins: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  coinText: { fontSize: 18, fontWeight: '800' },
});
