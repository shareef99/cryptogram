/**
 * The two hint actions (Reveal — coin-priced, and Lucky Reveal — scarce) as a
 * compact vertical stack of circular FABs. Rendered floating over the grid's
 * bottom-right corner so they don't consume a layout row. Pick-mode is handled
 * separately by HintPickBar.
 *
 * Reveal's badge is its *coin cost* (constant — paid from the header coin
 * balance each use, so it doesn't tick down); Lucky Reveal's badge is the
 * scarce remaining-count.
 */

import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import type { useHints } from '@/hooks/use-hints';
import { useTheme } from '@/hooks/use-theme';
import { usePlayerStore } from '@/store/player-store';

import { HintFab } from './HintFab';

function HintFabsInner({ hints }: { hints: ReturnType<typeof useHints> }) {
  const theme = useTheme();
  return (
    <View style={styles.stack}>
      <HintFab
        icon="bulb-outline"
        iconColor={theme.text}
        onPress={hints.startReveal}
        disabled={!hints.canAffordReveal}
        badge={hints.revealCost}
        badgeColor={theme.coin}
      />
      <HintFab
        icon="sparkles"
        iconColor={theme.streak}
        onPress={hints.luckyReveal}
        // Dev-only: long-press to grant Lucky Reveals for testing.
        onLongPress={__DEV__ ? () => usePlayerStore.getState().grantHint2(3) : undefined}
        disabled={hints.hint2Count <= 0}
        badge={hints.hint2Count}
        badgeColor={theme.streak}
      />
    </View>
  );
}

export const HintFabs = memo(HintFabsInner);

const styles = StyleSheet.create({
  stack: { gap: Spacing.two, alignItems: 'flex-end' },
});
