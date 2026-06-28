/**
 * A transient "halfway there" toast that appears once, just below the header,
 * the first time a puzzle crosses 50% filled — a small dopamine beat mid-solve.
 * Resets per puzzle. Non-interactive (doesn't block taps).
 */

import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { letterCells } from '@/game';
import { useTheme } from '@/hooks/use-theme';
import { useGameStore } from '@/store/game-store';

export function HalfwayBanner() {
  const theme = useTheme();
  const status = useGameStore((s) => s.status);
  const puzzleId = useGameStore((s) => s.puzzle?.id ?? null);
  const fraction = useGameStore((s) => {
    if (!s.puzzle) return 0;
    const total = letterCells(s.puzzle).length;
    return total ? Object.keys(s.cellGuesses).length / total : 0;
  });

  const [visible, setVisible] = useState(false);
  const firedRef = useRef(false);
  // Whether we've observed the board below 50% this puzzle. Only a genuine
  // crossing (below → ≥50% during play) fires the banner — so resuming a puzzle
  // that's already past 50% (e.g. after a loss + reopen) never re-shows it.
  const seenBelowRef = useRef(false);

  // Reset for each new puzzle.
  useEffect(() => {
    firedRef.current = false;
    seenBelowRef.current = false;
    setVisible(false);
  }, [puzzleId]);

  // Fire once, only when crossing 50% after having been below it.
  useEffect(() => {
    if (status !== 'playing') return;
    if (fraction < 0.5) {
      seenBelowRef.current = true; // arm — we've seen the board below halfway
      return;
    }
    if (firedRef.current || !seenBelowRef.current || fraction >= 1) return;
    firedRef.current = true;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(t);
  }, [fraction, status]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(16)}
      exiting={FadeOutUp.duration(250)}
      pointerEvents="none"
      style={[styles.banner, { backgroundColor: theme.success }]}>
      <ThemedText themeColor="primaryText" style={styles.text}>
        🎉 Halfway there — keep going!
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: Spacing.two,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    zIndex: 10,
    elevation: 6,
  },
  text: { fontSize: 15, fontWeight: '800' },
});
