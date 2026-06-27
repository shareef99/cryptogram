/**
 * Anchored adaptive banner for the puzzle screen (DECISIONS D13, revised).
 *
 * Passive, non-interruptive inventory shown below the keyboard. Hidden entirely
 * once ads are removed via IAP. The slot reserves a fixed height (with a gap
 * above it) so the keyboard never shifts when the ad fills in or fails to fill.
 * Test banner in dev; the real unit in release builds.
 */

import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { Spacing } from '@/constants/theme';
import { useSettingsStore } from '@/store/settings-store';

import { BANNER_UNIT_ID } from './ad-config';

// Anchored adaptive banners are ~50dp tall on phones; reserve a touch more so a
// filled ad sits centered in a stable slot (no layout shift on load/fill).
const BANNER_SLOT_HEIGHT = 60;

export function PlayBanner() {
  const adsRemoved = useSettingsStore((s) => s.adsRemoved);
  if (adsRemoved) return null;

  return (
    <View style={styles.slot}>
      <BannerAd
        unitId={BANNER_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    height: BANNER_SLOT_HEIGHT,
    marginTop: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
