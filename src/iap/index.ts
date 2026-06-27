/**
 * In-app purchase: the non-consumable "Remove Ads" entitlement.
 *
 * The entitlement is persisted in settings (`ads_removed`); this module only
 * talks to the store (Google Play Billing via expo-iap) and reports success.
 *
 * expo-iap is loaded LAZILY and defensively so a build without the native module
 * (e.g. the current Metro dev client before a native rebuild) never crashes — it
 * simply reports the store as unavailable. In __DEV__ the purchase is simulated
 * so the ads-removed UX can be exercised without a real Play product.
 *
 * Real purchases require: a native build with the expo-iap module, a `remove_ads`
 * managed product in Play Console, and the app installed from an internal test
 * track (Play Billing won't transact against a locally-signed APK).
 */

export const REMOVE_ADS_PRODUCT_ID = 'remove_ads';

/** The store flow is offered in all builds (dev simulates; release transacts). */
export const IAP_AVAILABLE = true;

type IapModule = typeof import('expo-iap');

let mod: IapModule | null = null;
let connected = false;

/** Lazily resolve expo-iap; returns null if the native module isn't present. */
function getIap(): IapModule | null {
  if (mod) return mod;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    mod = require('expo-iap') as IapModule;
    return mod;
  } catch {
    return null;
  }
}

async function ensureConnection(iap: IapModule): Promise<boolean> {
  if (connected) return true;
  try {
    await iap.initConnection();
    connected = true;
    return true;
  } catch {
    return false;
  }
}

/**
 * Attempt to purchase "Remove Ads". Resolves true once the purchase is
 * acknowledged. Dev simulates success; release runs the real Play Billing flow.
 */
export async function purchaseRemoveAds(): Promise<boolean> {
  if (__DEV__) return true;

  const iap = getIap();
  if (!iap || !(await ensureConnection(iap))) return false;

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      updated.remove();
      errored.remove();
      resolve(ok);
    };

    // Purchases are delivered via the event listener, not requestPurchase's return.
    const updated = iap.purchaseUpdatedListener(async (purchase) => {
      if (purchase.productId !== REMOVE_ADS_PRODUCT_ID) return;
      // Non-consumable: finalize so it isn't auto-refunded (Android: within 3 days).
      try {
        await iap.finishTransaction({ purchase, isConsumable: false });
      } catch {
        /* still grant locally; entitlement re-verifies on restore */
      }
      finish(true);
    });
    const errored = iap.purchaseErrorListener(() => finish(false));

    try {
      iap.requestPurchase({
        request: {
          google: { skus: [REMOVE_ADS_PRODUCT_ID] },
          apple: { sku: REMOVE_ADS_PRODUCT_ID },
        },
        type: 'in-app',
      });
    } catch {
      finish(false);
    }
  });
}

/** True if the user already owns "Remove Ads" (Play restores non-consumables). */
export async function ownsRemoveAds(): Promise<boolean> {
  if (__DEV__) return false;
  const iap = getIap();
  if (!iap || !(await ensureConnection(iap))) return false;
  try {
    const purchases = await iap.getAvailablePurchases();
    return purchases.some((p) => p.productId === REMOVE_ADS_PRODUCT_ID);
  } catch {
    return false;
  }
}

/**
 * Explicit "Restore purchases" — refreshes from the store and reports ownership.
 * Required by stores so users can re-grant a non-consumable on a new device.
 */
export async function restoreRemoveAds(): Promise<boolean> {
  if (__DEV__) return false;
  const iap = getIap();
  if (!iap || !(await ensureConnection(iap))) return false;
  try {
    await iap.restorePurchases();
  } catch {
    /* fall through to the ownership query */
  }
  return ownsRemoveAds();
}
