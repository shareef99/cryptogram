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
  // Disabled once every cell that needs this letter is filled.
  const done = useGameStore((s) => {
    const ids = s.cellsByLetter[letter];
    return !!ids && ids.length > 0 && ids.every((id) => !!s.cellGuesses[id]);
  });
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        inputLetter(letter);
      }}
      disabled={done}
      style={({ pressed }) => [
        styles.key,
        { backgroundColor: done ? theme.keyDisabled : theme.keyBackground, opacity: pressed ? 0.6 : 1 },
      ]}>
      <Text style={[styles.keyText, { color: done ? theme.keyDisabledText : theme.keyText }]}>
        {letter}
      </Text>
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
