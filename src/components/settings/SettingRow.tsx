/**
 * A labelled settings row: a label on the left and a control on the right.
 */

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    minHeight: 56,
  },
  label: { fontSize: 17, fontWeight: '600' },
});
