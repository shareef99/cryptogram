/**
 * Ad configuration. All ad usage routes through here.
 *
 * Dev builds use Google's official TEST ad units (always fill, zero policy risk);
 * release builds use the real AdMob units below. A device registered under
 * TEST_DEVICE_IDS (or in the AdMob dashboard) still receives test-mode ads even
 * against the real units, so production QA never risks an invalid-traffic strike.
 */

import { TestIds } from 'react-native-google-mobile-ads';

/** Test ads in development; real ads in release builds. */
export const USE_TEST_ADS = __DEV__;

// Real AdMob unit ids (Android app ca-app-pub-7019308769438850).
// iOS ships its own app + units in AdMob before an iOS release — see RELEASE.md.
const REAL_REWARDED = 'ca-app-pub-7019308769438850/1945461465'; // Double-it / Continue
const REAL_INTERSTITIAL = 'ca-app-pub-7019308769438850/4896882262';
const REAL_BANNER = 'ca-app-pub-7019308769438850/5367639646';
// Per-placement rewarded units (separate units → per-placement revenue reporting).
const REAL_REWARDED_FREE_HINT = 'ca-app-pub-7019308769438850/4445062916';
const REAL_REWARDED_COIN_BONUS = 'ca-app-pub-7019308769438850/3356589362';
const REAL_REWARDED_LUCKY = 'ca-app-pub-7019308769438850/5296356992';
const REAL_REWARDED_STREAK_FREEZE = 'ca-app-pub-7019308769438850/1592081557';

export const REWARDED_UNIT_ID = USE_TEST_ADS ? TestIds.REWARDED : REAL_REWARDED;
export const INTERSTITIAL_UNIT_ID = USE_TEST_ADS ? TestIds.INTERSTITIAL : REAL_INTERSTITIAL;
export const BANNER_UNIT_ID = USE_TEST_ADS ? TestIds.ADAPTIVE_BANNER : REAL_BANNER;
export const REWARDED_FREE_HINT_UNIT_ID = USE_TEST_ADS ? TestIds.REWARDED : REAL_REWARDED_FREE_HINT;
export const REWARDED_COIN_BONUS_UNIT_ID = USE_TEST_ADS ? TestIds.REWARDED : REAL_REWARDED_COIN_BONUS;
export const REWARDED_LUCKY_UNIT_ID = USE_TEST_ADS ? TestIds.REWARDED : REAL_REWARDED_LUCKY;
export const REWARDED_STREAK_FREEZE_UNIT_ID = USE_TEST_ADS
  ? TestIds.REWARDED
  : REAL_REWARDED_STREAK_FREEZE;

/**
 * Devices that receive test-mode ads even when the real units are live. Add the
 * *hashed* device id the native log prints on the first ad load (look for
 * `setTestDeviceIds(Arrays.asList("…"))`); `'EMULATOR'` covers simulators.
 * Registering the device's advertising id in the AdMob dashboard does the same.
 */
export const TEST_DEVICE_IDS: string[] = ['EMULATOR', 'C22F95571AFAC40921CCA6E5697A0286'];

/** Interstitials are frequency-capped to stay non-intrusive (see DECISIONS D13). */
export const INTERSTITIAL_MIN_PUZZLES = 3; // at least this many clears between ads
export const INTERSTITIAL_MIN_GAP_MS = 90_000; // and at least this long
