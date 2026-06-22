/**
 * In-app purchase abstraction for "Remove Ads".
 *
 * NOTE: a real purchase requires a configured product in the Play Console /
 * App Store and a signed build uploaded to a test track — neither of which can
 * be exercised from a local dev build. The integration point is isolated here:
 * swap `purchaseRemoveAds` for an `expo-iap` flow once a product id exists.
 *
 * Until then, purchasing is only enabled in development so the ads-removed UX
 * (and the interstitial gating it controls) can be tested end to end.
 */

export const REMOVE_ADS_PRODUCT_ID = 'remove_ads';

/** Whether the store/purchase flow is available in this build. */
export const IAP_AVAILABLE = __DEV__;

/**
 * Attempt to purchase "Remove Ads". Returns true if the entitlement is granted.
 * In dev this resolves true immediately; in production it returns false until a
 * real IAP provider is wired up.
 */
export async function purchaseRemoveAds(): Promise<boolean> {
  if (__DEV__) return true;
  // TODO: integrate expo-iap — request product, present purchase, verify receipt.
  return false;
}
