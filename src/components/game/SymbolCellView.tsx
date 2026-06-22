/**
 * A display-only symbol cell (punctuation, etc.) — no interaction.
 */

import { StyleSheet, Text, View } from 'react-native';

import { CELL_HEIGHT } from '@/constants/cell-metrics';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SymbolCellView({ char }: { char: string }) {
  const theme = useTheme();
  return (
    <View style={styles.symbolCell}>
      <Text style={[styles.symbol, { color: theme.textSecondary }]}>{char}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  symbolCell: { height: CELL_HEIGHT, justifyContent: 'center', paddingHorizontal: 1 },
  symbol: { fontSize: 20, fontWeight: '600', marginTop: Spacing.two },
});
