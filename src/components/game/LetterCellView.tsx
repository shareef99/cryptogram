/**
 * A single letter cell. Subscribes to ONLY its own store slices (by cell id), so
 * a keystroke re-renders just this cell.
 *
 * Feedback model: a correct letter just locks in (colour change, no per-cell
 * celebration). The celebration happens when the WHOLE letter is finished — i.e.
 * every cell sharing this cipher code is filled: each of those cells shakes and
 * its code number fades up and away, staggered by position so it reads as a wave
 * ("you completed a letter"). A wrong guess flashes red and shakes.
 */

import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { CELL_HEIGHT, CELL_WIDTH } from '@/constants/cell-metrics';
import { useTheme } from '@/hooks/use-theme';
import { useGameStore } from '@/store/game-store';
import type { LetterCell } from '@/types';

// Per-cell delay so a completed letter's cells animate one-by-one (a wave).
const STAGGER_MS = 70;

export function LetterCellView({ cell }: { cell: LetterCell }) {
  const theme = useTheme();
  const id = cell.id;
  const letter = useGameStore((s) => s.cellGuesses[id] ?? '');
  const selected = useGameStore((s) => s.selectedCellId === id);
  const highlighted = useGameStore((s) => s.hintMode === 'pick' && !s.cellGuesses[id]);
  const wrong = useGameStore((s) => s.wrongCellId === id);
  // True once every cell sharing this code is filled (the letter is complete).
  const codeDone = useGameStore((s) => {
    const ids = s.cellsByCode[cell.code];
    return !!ids && ids.every((cid) => !!s.cellGuesses[cid]);
  });
  // This cell's position within its code group → its stagger delay.
  const groupIndex = useGameStore((s) => s.cellsByCode[cell.code]?.indexOf(id) ?? 0);
  const pressCell = useGameStore((s) => s.pressCell);

  const shake = useSharedValue(0);
  const codeOpacity = useSharedValue(codeDone ? 0 : 1);
  const codeShift = useSharedValue(codeDone ? -8 : 0);

  // Celebrate when this letter group completes: shake + fade the number up, with
  // a per-cell delay so the group resolves as a wave.
  const prevDone = useRef(codeDone);
  useEffect(() => {
    if (codeDone && !prevDone.current) {
      const delay = groupIndex * STAGGER_MS;
      shake.value = withDelay(
        delay,
        withSequence(
          withTiming(-3, { duration: 55 }),
          withTiming(3, { duration: 55 }),
          withTiming(-2, { duration: 55 }),
          withTiming(0, { duration: 55 }),
        ),
      );
      codeOpacity.value = withDelay(delay, withTiming(0, { duration: 280 }));
      codeShift.value = withDelay(delay, withTiming(-8, { duration: 280 }));
    } else if (!codeDone && prevDone.current) {
      // Group reverted (e.g. restart) — restore the number instantly.
      codeOpacity.value = 1;
      codeShift.value = 0;
    }
    prevDone.current = codeDone;
  }, [codeDone, groupIndex, shake, codeOpacity, codeShift]);

  // Wrong guess: red shake.
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

  const boxStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const codeStyle = useAnimatedStyle(() => ({
    opacity: codeOpacity.value,
    transform: [{ translateY: codeShift.value }],
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
      <Animated.View style={[styles.box, { backgroundColor, borderColor }, boxStyle]}>
        <Text style={[styles.letter, { color: solved ? theme.cellCorrect : theme.cellText }]}>
          {letter}
        </Text>
      </Animated.View>
      <Animated.Text style={[styles.code, { color: theme.cellCode }, codeStyle]}>
        {cell.code}
      </Animated.Text>
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
