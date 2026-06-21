/**
 * On-screen QWERTY keyboard wired to the game store. Tapping a key assigns that
 * letter to the selected cell; the delete key clears it. Letters already placed
 * somewhere are dimmed (a gentle hint that each letter maps to one code).
 */

import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useGameStore } from '@/store/game-store';

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

function Key({ letter, used }: { letter: string; used: boolean }) {
  const theme = useTheme();
  const inputLetter = useGameStore((s) => s.inputLetter);
  return (
    <Pressable
      onPress={() => inputLetter(letter)}
      style={({ pressed }) => [
        styles.key,
        { backgroundColor: theme.keyBackground, opacity: pressed ? 0.6 : used ? 0.45 : 1 },
      ]}>
      <Text style={[styles.keyText, { color: theme.keyText }]}>{letter}</Text>
    </Pressable>
  );
}

function KeyboardInner() {
  const theme = useTheme();
  // Subscribe to the stable `guesses` reference (changes only on input), then
  // derive the used-letters set here — never build a new object in the selector.
  const guesses = useGameStore((s) => s.guesses);
  const usedLetters = useMemo(() => new Set(Object.values(guesses)), [guesses]);
  const deleteSelected = useGameStore((s) => s.deleteSelected);

  return (
    <View style={styles.keyboard}>
      {ROWS.map((row, i) => (
        <View key={i} style={styles.row}>
          {i === 2 && <View style={styles.spacer} />}
          {row.split('').map((letter) => (
            <Key key={letter} letter={letter} used={usedLetters.has(letter)} />
          ))}
          {i === 2 && (
            <Pressable
              onPress={deleteSelected}
              style={({ pressed }) => [
                styles.key,
                styles.delete,
                { backgroundColor: theme.keyBackground, opacity: pressed ? 0.6 : 1 },
              ]}>
              <Text style={[styles.keyText, { color: theme.keyText }]}>⌫</Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

export const Keyboard = memo(KeyboardInner);

const styles = StyleSheet.create({
  keyboard: {
    paddingHorizontal: Spacing.one,
    paddingTop: Spacing.two,
    gap: Spacing.one + 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  spacer: {
    flex: 0.5,
  },
  key: {
    flex: 1,
    height: 46,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 40,
  },
  delete: {
    flex: 1.5,
    maxWidth: 56,
  },
  keyText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
