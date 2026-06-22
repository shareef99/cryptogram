# Release Checklist

Steps to take the app from the current dev build to a production release. Most of
the app is production-ready; the items below are the deliberate "wire real
accounts/keys at the end" placeholders.

## 1. Ads (AdMob)

Currently every ad uses **Google test units** via `src/ads/ad-config.ts`
(`USE_TEST_ADS = true`). To go live:

1. Create an AdMob account + app; create a **Rewarded** and an **Interstitial**
   ad unit.
2. In `src/ads/ad-config.ts`: set `USE_TEST_ADS = false` and fill `REAL_REWARDED`
   / `REAL_INTERSTITIAL` with the real unit ids.
3. In `app.json`, replace the test `androidAppId` / `iosAppId`
   (`ca-app-pub-3940256099942544~…`) under the `react-native-google-mobile-ads`
   plugin with your real AdMob **App IDs**.
4. Register test devices during QA so you don't click live ads.

## 2. Remove-ads IAP

`src/iap/index.ts` is a documented stub (`IAP_AVAILABLE = __DEV__`). To enable
real purchases:

1. Create a non-consumable product `remove_ads` in Play Console / App Store
   Connect.
2. Implement `purchaseRemoveAds()` with `expo-iap` (request product → purchase →
   verify → grant). The entitlement already drives `settings.ads_removed`, which
   gates interstitials.
3. Test on an internal track (IAP can't be exercised from a local debug build).

## 3. Quote corpus

`data/quotes-source.json` ships ~60 curated **public-domain** quotes. Before
launch, expand to the full public-domain corpus (see DECISIONS D8), then rebuild
the bundled DB:

```
pnpm build:db
```

## 4. Build & submit (EAS)

Profiles are in `eas.json`.

```
# one-time
npm i -g eas-cli && eas login && eas build:configure

# internal QA build (APK)
eas build -p android --profile preview

# production (AAB for Play Store)
eas build -p android --profile production
eas submit -p android --profile production
```

iOS mirrors the same commands with `-p ios` once an Apple account is set up.

## 5. Pre-submit checks

- `pnpm typecheck`, `pnpm check:game`, `pnpm check:db`, `pnpm check:streak` green.
- Bump `version` in `app.json`.
- Verify the AdMob App ID + privacy policy URL (required for ads) are set.
- Confirm `__DEV__`-only affordances (coin/streak grants, auto-solve) are gone in
  release — they're already guarded by `__DEV__`, so they compile out.
