/**
 * Ad configuration. Uses Google's official TEST ad units (always serve test
 * ads, no AdMob account needed). Flip `USE_TEST_ADS` to false and drop in real
 * unit ids for production. All ad usage routes through here.
 */

import { TestIds } from 'react-native-google-mobile-ads';

/** While true, every ad is a Google test ad. Set false for production. */
export const USE_TEST_ADS = true;

// Real unit ids go here when shipping (kept empty until an AdMob account exists).
const REAL_REWARDED = '';
const REAL_INTERSTITIAL = '';

export const REWARDED_UNIT_ID = USE_TEST_ADS ? TestIds.REWARDED : REAL_REWARDED;
export const INTERSTITIAL_UNIT_ID = USE_TEST_ADS ? TestIds.INTERSTITIAL : REAL_INTERSTITIAL;

/** Interstitials are frequency-capped to stay non-intrusive (see DECISIONS D13). */
export const INTERSTITIAL_MIN_PUZZLES = 3; // at least this many clears between ads
export const INTERSTITIAL_MIN_GAP_MS = 90_000; // and at least this long
