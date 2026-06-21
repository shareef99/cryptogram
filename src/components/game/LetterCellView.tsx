/**
 * A single letter cell. Subscribes to ONLY its own store slices (by cell id), so
 * a keystroke re-renders just this cell. Correct letters lock in with a pop; a
 * wrong guess flashes red and shakes.
 */

import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { CELL_HEIGHT, CELL_WIDTH } from '@/constants/cell-metrics';
import { useTheme } from '@/hooks/use-theme';
import { useGameStore } from '@/store/game-store';
import type { LetterCell } from '@/types';

export function LetterCellView({ cell }: { cell: LetterCell }) {
  const theme = useTheme();
  const id = cell.id;
  const letter = useGameStore((s) => s.cellGuesses[id] ?? '');
  const selected = useGameStore((s) => s.selectedCellId === id);
  const highlighted = useGameStore((s) => s.hintMode === 'pick' && !s.cellGuesses[id]);
  const wrong = useGameStore((s) => s.wrongCellId === id);
  const pressCell = useGameStore((s) => s.pressCell);

  const scale = useSharedValue(1);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (letter) {
      scale.value = withSequence(withTiming(1.18, { duration: 90 }), withTiming(1, { duration: 130 }));
    }
  }, [letter, scale]);

  useEffect(() => {
    if (wrong) {
      shake.value = withSequence(
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [wrong, shake]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: shake.value }],
  }));

  const solved = letter !== '';
  const backgroundColor = wrong
    ? theme.cellError
    : highlighted
      ? theme.cellHighlight
      : selected
        ? theme.cellSelected
        : theme.cellBackground;
  const borderColor = wrong
    ? theme.cellError
    : highlighted
      ? theme.coin
      : selected
        ? theme.cellSelectedBorder
        : theme.cellBorder;

  return (
    <Pressable onPress={() => pressCell(id)} style={styles.letterCell} hitSlop={4}>
      <Animated.View style={[styles.box, { backgroundColor, borderColor }, animatedStyle]}>
        <Text style={[styles.letter, { color: solved ? theme.cellCorrect : theme.cellText }]}>
          {letter}
        </Text>
      </Animated.View>
      <Text style={[styles.code, { color: theme.cellCode }]}>{cell.code}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  letterCell: { alignItems: 'center', marginHorizontal: 1 },
  box: {
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
    borderWidth: 1.5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { fontSize: 18, fontWeight: '700' },
  code: { fontSize: 10, marginTop: 2, fontVariant: ['tabular-nums'] },
});
