/**
 * On-screen QWERTY keyboard wired to the game store. Tapping a key validates the
 * letter against the selected cell. The bottom row is flanked by left/right
 * arrows that move the selection between cells (wrapping at the ends).
 */

import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { useGameStore } from '@/store/game-store';

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

function Key({ letter }: { letter: string }) {
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

function ArrowKey({ dir }: { dir: -1 | 1 }) {
  const theme = useTheme();
  const moveSelection = useGameStore((s) => s.moveSelection);
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        moveSelection(dir);
      }}
      style={({ pressed }) => [
        styles.key,
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

function KeyboardInner() {
  return (
    <View style={styles.keyboard}>
      {ROWS.map((row, i) => (
        <View key={i} style={styles.row}>
          {i === 2 && <ArrowKey dir={-1} />}
          {row.split('').map((letter) => (
            <Key key={letter} letter={letter} />
          ))}
          {i === 2 && <ArrowKey dir={1} />}
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
  key: {
    flex: 1,
    height: 46,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 40,
  },
  arrow: {
    flex: 1.4,
    maxWidth: 52,
  },
  keyText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
