/**
 * A keyboard arrow key: moves the cell selection left/right (wrapping at ends).
 */

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { useGameStore } from '@/store/game-store';

export function ArrowKey({ dir }: { dir: -1 | 1 }) {
  const theme = useTheme();
  const moveSelection = useGameStore((s) => s.moveSelection);
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        moveSelection(dir);
      }}
      style={({ pressed }) => [
        styles.arrow,
        { backgroundColor: theme.keyBackground, opacity: pressed ? 0.6 : 1 },
      ]}>
      <Ionicons
        name={dir === -1 ? 'chevron-back' : 'chevron-forward'}
        size={22}
        color={theme.keyText}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  arrow: {
    flex: 1.4,
    height: 46,
    maxWidth: 52,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
