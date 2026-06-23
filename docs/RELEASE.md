# Release Checklist

Steps to take the app from the current dev build to a production release. Most of
the app is production-ready; the items below are the deliberate "wire real
accounts/keys at the end" placeholders.

For the step-by-step Play Store submission flow, see
[PUBLISHING.md](./PUBLISHING.md).

## 1. Ads (AdMob)

`src/ads/ad-config.ts` uses `USE_TEST_ADS = __DEV__`: **dev builds serve Google
test ads; release builds serve the real units.** Registered test devices (see
`TEST_DEVICE_IDS` and the AdMob dashboard) still get test-mode ads in release, so
QA is safe.

**Android — done.** Real App ID (`app.json` → `androidAppId`) and the real
Rewarded / Interstitial unit ids (`REAL_REWARDED` / `REAL_INTERSTITIAL`) are
wired in (AdMob app `ca-app-pub-7019308769438850`).

**Still to do:**

1. **iOS:** create an iOS app + Rewarded/Interstitial units in AdMob. Set the
   real `iosAppId` in `app.json` (still the Google test id today) and make the
   unit ids platform-aware (`Platform.select`) in `ad-config.ts`.
2. **Test devices:** on the first real-ad load, copy the hashed device id the
   native log prints (`setTestDeviceIds(Arrays.asList("…"))`) into
   `TEST_DEVICE_IDS` for belt-and-suspenders with the dashboard registration.
3. **Consent + privacy:** add a privacy-policy URL and wire the UMP consent flow
   (Google User Messaging Platform) before serving ads in the EEA/UK.
4. Any `app.json` native change needs a fresh native build (`expo prebuild` +
   rebuild, or an EAS build) — it is not a JS-only reload.

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
