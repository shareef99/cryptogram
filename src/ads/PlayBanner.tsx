/**
 * Anchored adaptive banner for the puzzle screen (DECISIONS D13, revised).
 *
 * Passive, non-interruptive inventory shown below the keyboard. Hidden entirely
 * once ads are removed via IAP, and self-collapses if the ad fails to fill so it
 * never leaves an empty gap. Test banner in dev; the real unit in release builds.
 */

import { useState } from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { useSettingsStore } from '@/store/settings-store';

import { BANNER_UNIT_ID } from './ad-config';

export function PlayBanner() {
  const adsRemoved = useSettingsStore((s) => s.adsRemoved);
  const [failed, setFailed] = useState(false);

  if (adsRemoved || failed) return null;

  return (
    <View style={{ alignItems: 'center' }}>
      <BannerAd
        unitId={BANNER_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}
