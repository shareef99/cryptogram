/**
 * A single letter key. Validates the letter against the selected cell on press.
 */

import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { useGameStore } from '@/store/game-store';

export function Key({ letter }: { letter: string }) {
  const theme = useTheme();
  const inputLetter = useGameStore((s) => s.inputLetter);
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        inputLetter(letter);
      }}
      style={({ pressed }) => [
        styles.key,
        { backgroundColor: theme.keyBackground, opacity: pressed ? 0.6 : 1 },
      ]}>
      <Text style={[styles.keyText, { color: theme.keyText }]}>{letter}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  key: {
    flex: 1,
    height: 46,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 40,
  },
  keyText: { fontSize: 18, fontWeight: '600' },
});
