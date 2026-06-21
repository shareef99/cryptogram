/**
 * Puzzle screen header: back button, difficulty label, and letters-solved
 * progress. (Coins and hint controls are added in later phases.)
 */

import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { solvedCodeCount } from '@/game';
import { useTheme } from '@/hooks/use-theme';
import { useGameStore } from '@/store/game-store';

const DIFFICULTY_LABEL = ['', 'Easy', 'Medium', 'Hard'];

function GameHeaderInner() {
  const theme = useTheme();
  const total = useGameStore((s) => s.puzzle?.codes.length ?? 0);
  const solved = useGameStore((s) =>
    s.puzzle ? solvedCodeCount(s.puzzle, s.guesses) : 0,
  );

  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back}>
        <ThemedText style={styles.backIcon}>‹</ThemedText>
      </Pressable>
      <Pressable
        onLongPress={__DEV__ ? () => useGameStore.getState().__devSolve() : undefined}
        style={styles.center}>
        <ThemedText themeColor="textSecondary" type="small">
          {total > 0 ? `${solved} / ${total} letters` : ' '}
        </ThemedText>
      </Pressable>
      <View style={styles.right}>
        <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.primary,
                width: total > 0 ? `${(solved / total) * 100}%` : '0%',
              },
            ]}
          />
        </View>
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
    gap: Spacing.three,
  },
  back: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '300',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    width: 64,
    alignItems: 'flex-end',
  },
  progressTrack: {
    width: 64,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
