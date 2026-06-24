/**
 * Lays out a puzzle as wrapping rows of words inside a scroll view. Each word is
 * a non-wrapping row of cells; whole words wrap to the next line. The grid owns
 * its scrolling so it can (a) auto-scroll the selected cell into view as the
 * player navigates and (b) render a slim custom scrollbar. Only individual cells
 * re-render on input (see Cell.tsx).
 */

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useGameStore } from '@/store/game-store';
import type { Puzzle } from '@/types';

import { Cell } from './Cell';

// Keep the selected cell at least this far from the viewport edges.
const SCROLL_MARGIN = 56;
const MIN_THUMB = 36;

function PuzzleGridInner({ puzzle }: { puzzle: Puzzle }) {
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const selectedCellId = useGameStore((s) => s.selectedCellId);

  const wordTops = useRef<Record<number, number>>({});
  const wordHeights = useRef<Record<number, number>>({});
  const gridTop = useRef(0);
  const offsetY = useRef(0);
  const [viewport, setViewport] = useState(0);
  const [content, setContent] = useState(0);
  const scrollY = useSharedValue(0);

  // cellId -> word index, for locating the selected cell's row.
  const cellWord = useMemo(() => {
    const m: Record<number, number> = {};
    puzzle.words.forEach((w, wi) => w.forEach((c) => (m[c.id] = wi)));
    return m;
  }, [puzzle]);

  // Scroll the selected cell's row into view when it moves off-screen.
  useEffect(() => {
    if (selectedCellId == null || viewport === 0) return;
    const top = gridTop.current + (wordTops.current[cellWord[selectedCellId]] ?? 0);
    const h = wordHeights.current[cellWord[selectedCellId]] ?? 0;
    const y = offsetY.current;
    if (top < y + SCROLL_MARGIN) {
      scrollRef.current?.scrollTo({ y: Math.max(0, top - SCROLL_MARGIN), animated: true });
    } else if (top + h > y + viewport - SCROLL_MARGIN) {
      scrollRef.current?.scrollTo({ y: top + h - viewport + SCROLL_MARGIN, animated: true });
    }
  }, [selectedCellId, cellWord, viewport]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetY.current = e.nativeEvent.contentOffset.y;
    scrollY.value = e.nativeEvent.contentOffset.y;
  };

  const thumbStyle = useAnimatedStyle(() => {
    const overflow = content - viewport;
    if (overflow <= 4 || viewport === 0) return { opacity: 0, height: 0 };
    const thumbH = Math.max(MIN_THUMB, (viewport / content) * viewport);
    const t = Math.min(1, Math.max(0, scrollY.value / overflow));
    return { opacity: 1, height: thumbH, transform: [{ translateY: t * (viewport - thumbH) }] };
  });

  return (
    <View style={styles.root} onLayout={(e) => setViewport(e.nativeEvent.layout.height)}>
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={(_, h) => setContent(h)}
        contentContainerStyle={styles.content}>
        <View style={styles.grid} onLayout={(e) => (gridTop.current = e.nativeEvent.layout.y)}>
          {puzzle.words.map((word, wi) => (
            <View
              key={wi}
              style={styles.word}
              onLayout={(e: LayoutChangeEvent) => {
                wordTops.current[wi] = e.nativeEvent.layout.y;
                wordHeights.current[wi] = e.nativeEvent.layout.height;
              }}>
              {word.map((cell) => (
                <Cell key={cell.id} cell={cell} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      <Animated.View
        pointerEvents="none"
        style={[styles.scrollbar, { backgroundColor: theme.cellBorder }, thumbStyle]}
      />
    </View>
  );
}

export const PuzzleGrid = memo(PuzzleGridInner);

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start' },
  word: { flexDirection: 'row', marginHorizontal: Spacing.two, marginVertical: Spacing.two },
  scrollbar: { position: 'absolute', right: 3, top: 0, width: 4, borderRadius: 2 },
});
