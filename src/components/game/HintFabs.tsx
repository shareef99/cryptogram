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
  const adReveal = !hints.canAffordReveal; // bulb falls back to a rewarded ad
  const adLucky = hints.hint2Count <= 0; // sparkles falls back to a rewarded ad
  return (
    <View style={styles.stack}>
      <HintFab
        icon="bulb-outline"
        iconColor={theme.text}
        onPress={hints.onRevealPress}
        disabled={hints.adLoading}
        badge={adReveal ? 'AD' : hints.revealCost}
        badgeColor={adReveal ? theme.primary : theme.coin}
      />
      <HintFab
        icon="sparkles"
        iconColor={theme.streak}
        onPress={hints.onLuckyPress}
        // Dev-only: long-press to grant Lucky Reveals for testing.
        onLongPress={__DEV__ ? () => usePlayerStore.getState().grantHint2(3) : undefined}
        disabled={hints.adLoading}
        badge={adLucky ? 'AD' : hints.hint2Count}
        badgeColor={adLucky ? theme.primary : theme.streak}
      />
    </View>
  );
}

export const HintFabs = memo(HintFabsInner);

const styles = StyleSheet.create({
  stack: { gap: Spacing.two, alignItems: 'flex-end' },
});
