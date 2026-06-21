/**
 * Hint controls shown above the keyboard. In normal play: two buttons — "Reveal"
 * (coin-priced) and "Lucky Reveal" (scarce inventory). While Hint-1 pick mode is
 * active, it swaps to a prompt with "Surprise me" / "Cancel".
 */

import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useHints } from '@/hooks/use-hints';
import { useTheme } from '@/hooks/use-theme';

function HintControlsInner({ quoteId }: { quoteId: number | null }) {
  const theme = useTheme();
  const h = useHints(quoteId);

  if (h.hintMode === 'pick') {
    return (
      <View style={styles.pickBar}>
        <ThemedText themeColor="textSecondary" type="small" style={styles.pickPrompt}>
          Tap a highlighted letter to reveal it
        </ThemedText>
        <View style={styles.row}>
          <Pressable
            onPress={h.surprise}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
            ]}>
            <ThemedText themeColor="primaryText" style={styles.buttonText}>
              ✨ Surprise me
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={h.cancelReveal}
            style={({ pressed }) => [
              styles.button,
              styles.outline,
              { borderColor: theme.cellBorder, opacity: pressed ? 0.7 : 1 },
            ]}>
            <ThemedText style={styles.buttonText}>Cancel</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Pressable
        onPress={h.startReveal}
        disabled={!h.canAffordReveal}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : h.canAffordReveal ? 1 : 0.45 },
        ]}>
        <ThemedText style={styles.buttonText}>Reveal</ThemedText>
        <View style={styles.cost}>
          <ThemedText style={[styles.coinDot, { color: theme.coin }]}>●</ThemedText>
          <ThemedText type="small" style={styles.costText}>
            {h.revealCost}
          </ThemedText>
        </View>
      </Pressable>

      <Pressable
        onPress={h.luckyReveal}
        disabled={h.hint2Count <= 0}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : h.hint2Count > 0 ? 1 : 0.45 },
        ]}>
        <ThemedText style={styles.buttonText}>✨ Lucky Reveal</ThemedText>
        <View style={[styles.badge, { backgroundColor: theme.streak }]}>
          <ThemedText themeColor="primaryText" style={styles.badgeText}>
            {h.hint2Count}
          </ThemedText>
        </View>
      </Pressable>
    </View>
  );
}

export const HintControls = memo(HintControlsInner);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.three },
  pickBar: { gap: Spacing.two, paddingHorizontal: Spacing.three },
  pickPrompt: { textAlign: 'center' },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  outline: { borderWidth: 1.5, backgroundColor: 'transparent' },
  buttonText: { fontSize: 15, fontWeight: '700' },
  cost: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  coinDot: { fontSize: 12 },
  costText: { fontWeight: '700' },
  badge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontSize: 13, fontWeight: '800' },
});
