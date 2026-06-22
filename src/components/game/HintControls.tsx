/**
 * Hint controls. Normal play: two circular FABs (Reveal — coin-priced, and Lucky
 * Reveal — scarce inventory), each with its number in the top-right corner.
 * During Hint-1 pick mode it swaps to the pick prompt.
 */

import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useHints } from '@/hooks/use-hints';
import { useTheme } from '@/hooks/use-theme';

import { HintFab } from './HintFab';
import { HintPickBar } from './HintPickBar';

function HintControlsInner({ quoteId }: { quoteId: number | null }) {
  const theme = useTheme();
  const h = useHints(quoteId);

  if (h.hintMode === 'pick') {
    return <HintPickBar onSurprise={h.surprise} onCancel={h.cancelReveal} />;
  }

  return (
    <View style={styles.fabRow}>
      <HintFab
        icon="bulb-outline"
        iconColor={theme.text}
        onPress={h.startReveal}
        disabled={!h.canAffordReveal}
        badge={h.revealCost}
        badgeColor={theme.coin}
      />
      <HintFab
        icon="sparkles"
        iconColor={theme.streak}
        onPress={h.luckyReveal}
        disabled={h.hint2Count <= 0}
        badge={h.hint2Count}
        badgeColor={theme.streak}
      />
    </View>
  );
}

export const HintControls = memo(HintControlsInner);

const styles = StyleSheet.create({
  fabRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
});
