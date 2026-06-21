/**
 * Lays out a puzzle as wrapping rows of words. Each word is a non-wrapping row
 * of cells; whole words wrap to the next line. The grid itself is static — only
 * individual cells re-render on input (see Cell.tsx).
 */

import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import type { Puzzle } from '@/game';

import { Cell } from './Cell';

function PuzzleGridInner({ puzzle }: { puzzle: Puzzle }) {
  return (
    <View style={styles.grid}>
      {puzzle.words.map((word, wi) => (
        <View key={wi} style={styles.word}>
          {word.map((cell) => (
            <Cell key={cell.id} cell={cell} />
          ))}
        </View>
      ))}
    </View>
  );
}

export const PuzzleGrid = memo(PuzzleGridInner);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  word: {
    flexDirection: 'row',
    marginHorizontal: Spacing.two,
    marginVertical: Spacing.two,
  },
});
