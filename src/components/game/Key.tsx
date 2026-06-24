/**
 * A single letter key. Validates the letter against the selected cell on press.
 * Highlights once the player has placed this letter somewhere; dims + disables
 * once every cell needing it is filled.
 */

import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { useGameStore } from '@/store/game-store';

export function Key({ letter }: { letter: string }) {
  const theme = useTheme();
  const inputLetter = useGameStore((s) => s.inputLetter);
  // 'none' (untouched) | 'used' (some instances placed) | 'done' (all placed).
  const state = useGameStore((s) => {
    const ids = s.cellsByLetter[letter];
    if (!ids || ids.length === 0) return 'none';
    let solved = 0;
    for (const id of ids) if (s.cellGuesses[id]) solved++;
    if (solved === 0) return 'none';
    return solved === ids.length ? 'done' : 'used';
  });
  const done = state === 'done';
  const used = state === 'used';

  const backgroundColor = done ? theme.keyDisabled : used ? theme.primary : theme.keyBackground;
  const color = done ? theme.keyDisabledText : used ? theme.primaryText : theme.keyText;

  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        inputLetter(letter);
      }}
      disabled={done}
      style={({ pressed }) => [styles.key, { backgroundColor, opacity: pressed ? 0.6 : 1 }]}>
      <Text style={[styles.keyText, { color }]}>{letter}</Text>
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
