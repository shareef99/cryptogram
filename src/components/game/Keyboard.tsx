/**
 * On-screen QWERTY keyboard. The bottom row is flanked by left/right arrows that
 * move the cell selection (wrapping at the ends).
 */

import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import { ArrowKey } from './ArrowKey';
import { Key } from './Key';

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

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
});
