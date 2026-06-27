/**
 * Ad service — a thin promise-based wrapper over react-native-google-mobile-ads.
 *
 * Design (DECISIONS D13/D14): rewarded ads are opt-in only ("double your coins")
 * and the reward fires only on full view; interstitials are frequency-capped and
 * shown only on win→next, never mid-puzzle, and are skipped entirely once ads
 * are removed via IAP.
 */

import mobileAds, {
  AdEventType,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';

import {
  INTERSTITIAL_MIN_GAP_MS,
  INTERSTITIAL_MIN_PUZZLES,
  INTERSTITIAL_UNIT_ID,
  REWARDED_UNIT_ID,
  TEST_DEVICE_IDS,
} from './ad-config';
import { canRequestAds, gatherConsent } from './consent';

let initialized = false;

export async function initAds(): Promise<void> {
  if (initialized) return;
  initialized = true;
  try {
    // UMP consent first — must complete before requesting any ads (GDPR/EEA).
    await gatherConsent();
    // Must precede initialize(): flags registered devices so real units serve
    // test-mode ads during QA (no invalid-traffic risk).
    await mobileAds().setRequestConfiguration({ testDeviceIdentifiers: TEST_DEVICE_IDS });
    await mobileAds().initialize();
  } catch {
    /* SDK init failure shouldn't break the app */
  }
}

/**
 * Load and show a rewarded ad. Resolves true only if the user watched to the
 * reward point; false if they skipped, it failed, or no fill. Never throws.
 */
export function showRewarded(): Promise<boolean> {
  if (!canRequestAds()) return Promise.resolve(false);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (earned: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(earned);
    };

    const ad = RewardedAd.createForAdRequest(REWARDED_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });
    let earned = false;

    const subs = [
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        ad.show().catch(() => finish(false));
      }),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => finish(earned)),
      ad.addAdEventListener(AdEventType.ERROR, () => finish(false)),
    ];
    function cleanup() {
      subs.forEach((unsub) => unsub());
    }

    try {
      ad.load();
    } catch {
      finish(false);
    }
  });
}

function showInterstitial(): Promise<boolean> {
  if (!canRequestAds()) return Promise.resolve(false);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (shown: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(shown);
    };

    const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });
    const subs = [
      ad.addAdEventListener(AdEventType.LOADED, () => {
        ad.show().catch(() => finish(false));
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => finish(true)),
      ad.addAdEventListener(AdEventType.ERROR, () => finish(false)),
    ];
    function cleanup() {
      subs.forEach((unsub) => unsub());
    }

    try {
      ad.load();
    } catch {
      finish(false);
    }
  });
}

// Frequency-cap state (per session).
let clearsSinceAd = 0;
let lastInterstitialAt = 0;

/**
 * Call after each puzzle is cleared. Shows a capped interstitial only when the
 * thresholds are met and ads aren't removed. Returns whether one was shown.
 */
export async function maybeShowInterstitial(adsRemoved: boolean, now: number): Promise<boolean> {
  clearsSinceAd += 1;
  if (adsRemoved) return false;
  if (clearsSinceAd < INTERSTITIAL_MIN_PUZZLES) return false;
  if (now - lastInterstitialAt < INTERSTITIAL_MIN_GAP_MS) return false;

  const shown = await showInterstitial();
  if (shown) {
    clearsSinceAd = 0;
    lastInterstitialAt = now;
  }
  return shown;
}
