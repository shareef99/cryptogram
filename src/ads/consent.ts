/**
 * UMP (Google User Messaging Platform) consent — GDPR/EEA + regulated US states.
 *
 * `gatherConsent` runs once at startup (before ad init): it requests the latest
 * consent info and presents the Google-rendered form if required. We then cache
 * whether the app may request ads (`canRequestAds`) and whether a re-openable
 * privacy-options entry is required (so Settings can surface it).
 *
 * Never throws — a UMP failure must not block the app; the Ads SDK still honours
 * whatever consent state is stored on device.
 */

import {
  AdsConsent,
  AdsConsentDebugGeography,
  AdsConsentPrivacyOptionsRequirementStatus,
} from 'react-native-google-mobile-ads';

import { TEST_DEVICE_IDS } from './ad-config';

// Default permissive until UMP resolves; the SDK won't serve personalized ads
// without stored consent regardless, and gatherConsent runs before gameplay.
let canRequest = true;
let privacyOptionsRequired = false;

/** Request consent info and show the form if required. Call once before initAds. */
export async function gatherConsent(): Promise<void> {
  try {
    // In dev, simulate the EEA so the form can be exercised on a registered test
    // device (add the hashed device id to TEST_DEVICE_IDS to trigger it).
    const info = await AdsConsent.gatherConsent(
      __DEV__
        ? { debugGeography: AdsConsentDebugGeography.EEA, testDeviceIdentifiers: TEST_DEVICE_IDS }
        : undefined,
    );
    canRequest = info.canRequestAds;
    privacyOptionsRequired =
      info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
  } catch {
    // UMP error shouldn't block monetization; the SDK defaults to non-personalized.
    canRequest = true;
  }
}

/** Whether the app has completed the steps needed to request ads (per UMP). */
export function canRequestAds(): boolean {
  return canRequest;
}

/** Whether a re-openable privacy-options entry must be offered (e.g. in Settings). */
export function isPrivacyOptionsRequired(): boolean {
  return privacyOptionsRequired;
}

/** Re-present the privacy options form so the user can change/withdraw consent. */
export async function showPrivacyOptions(): Promise<void> {
  try {
    const info = await AdsConsent.showPrivacyOptionsForm();
    canRequest = info.canRequestAds;
  } catch {
    /* user dismissed or form unavailable */
  }
}
