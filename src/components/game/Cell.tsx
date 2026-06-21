/**
 * A single puzzle cell. Letter cells subscribe to ONLY their own store slices
 * (`guesses[code]`, `selectedCode === code`), so a keystroke re-renders just the
 * affected cells, not the whole grid. Symbol cells are static.
 */

import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import { isCodeCorrect, type Cell as PuzzleCell } from '@/game';
import { useTheme } from '@/hooks/use-theme';
import { useGameStore } from '@/store/game-store';

export const CELL_WIDTH = 28;
const CELL_HEIGHT = 34;

function LetterCellView({ code }: { code: number }) {
  const theme = useTheme();
  const letter = useGameStore((s) => s.guesses[code] ?? '');
  const selected = useGameStore((s) => s.selectedCode === code);
  // Highlighted while Hint-1 pick mode is active and this cell isn't yet solved.
  const highlighted = useGameStore((s) =>
    s.hintMode === 'pick' && s.puzzle ? !isCodeCorrect(s.puzzle, s.guesses, code) : false,
  );
  const pressCell = useGameStore((s) => s.pressCell);

  // Quick scale-pop when a letter is placed (runs entirely on the UI thread).
  const scale = useSharedValue(1);
  useEffect(() => {
    if (letter) {
      scale.value = withSequence(
        withTiming(1.18, { duration: 90 }),
        withTiming(1, { duration: 130 }),
      );
    }
  }, [letter, scale]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const backgroundColor = highlighted
    ? theme.cellHighlight
    : selected
      ? theme.cellSelected
      : theme.cellBackground;
  const borderColor = highlighted
    ? theme.coin
    : selected
      ? theme.cellSelectedBorder
      : theme.cellBorder;

  return (
    <Pressable onPress={() => pressCell(code)} style={styles.letterCell} hitSlop={4}>
      <Animated.View style={[styles.box, { backgroundColor, borderColor }, animatedStyle]}>
        <Text style={[styles.letter, { color: theme.cellText }]}>{letter}</Text>
      </Animated.View>
      <Text style={[styles.code, { color: theme.cellCode }]}>{code}</Text>
    </Pressable>
  );
}

function SymbolCellView({ char }: { char: string }) {
  const theme = useTheme();
  return (
    <View style={styles.symbolCell}>
      <Text style={[styles.symbol, { color: theme.textSecondary }]}>{char}</Text>
    </View>
  );
}

/** Renders the correct view for a puzzle cell. */
function CellInner({ cell }: { cell: PuzzleCell }) {
  if (cell.kind === 'symbol') return <SymbolCellView char={cell.char} />;
  return <LetterCellView code={cell.code} />;
}

export const Cell = memo(CellInner);

const styles = StyleSheet.create({
  letterCell: {
    alignItems: 'center',
    marginHorizontal: 1,
  },
  box: {
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
    borderWidth: 1.5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontSize: 18,
    fontWeight: '700',
  },
  code: {
    fontSize: 10,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  symbolCell: {
    height: CELL_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 1,
  },
  symbol: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.two, // align punctuation roughly with letter baseline
  },
});
