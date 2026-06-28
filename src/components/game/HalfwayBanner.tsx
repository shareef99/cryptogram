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

  // Reset for each new puzzle.
  useEffect(() => {
    firedRef.current = false;
    setVisible(false);
  }, [puzzleId]);

  // Fire once on first crossing 50% (but not on a fully-solved board).
  useEffect(() => {
    if (firedRef.current || status !== 'playing' || fraction < 0.5 || fraction >= 1) return;
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
