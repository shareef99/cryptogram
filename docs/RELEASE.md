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

**Android — done.** Real App ID (`app.json` → `androidAppId`) and all real unit
ids are wired in (AdMob app `ca-app-pub-7019308769438850`):

- **Banner** (`REAL_BANNER`) — play screen.
- **Interstitial** (`REAL_INTERSTITIAL`) — win→next, frequency-capped.
- **Rewarded** (`REAL_REWARDED`) — Double-it + loss-screen Continue.
- **Rewarded, per-placement** (D22): Free Hint, Coin Bonus, Lucky Reveal, Streak
  Freeze — separate units for per-placement revenue reporting.

**Still to do:**

1. **iOS:** create an iOS app + the full unit set (banner, interstitial, and all
   rewarded placements) in AdMob. Set the real `iosAppId` in `app.json` (still the
   Google test id today) and make the unit ids platform-aware (`Platform.select`)
   in `ad-config.ts`.
2. **Test devices:** on the first real-ad load, copy the hashed device id the
   native log prints (`setTestDeviceIds(Arrays.asList("…"))`) into
   `TEST_DEVICE_IDS` for belt-and-suspenders with the dashboard registration.
3. **Consent + privacy:** the **UMP consent flow is wired** (`src/ads/consent.ts`,
   run from `initAds`; gates rewarded/interstitial/banner on `canRequestAds`; a
   "Privacy choices" Settings row re-opens the form where required). Still to do:
   set the **privacy-policy URL** in the AdMob consent form + Play listing once
   `shareefsolutions.in/cryptogram/privacy` is live, and add your hashed device id
   to `TEST_DEVICE_IDS` to exercise the EEA debug form on a real device.
4. Any `app.json` native change needs a fresh native build (`expo prebuild` +
   rebuild, or an EAS build) — it is not a JS-only reload.

## 2. Remove-ads IAP

`src/iap/index.ts` now implements the real flow via **expo-iap** (lazy-loaded so
a build without the native module can't crash; **dev simulates** the purchase).
It drives `settings.ads_removed`, which gates interstitials + the banner.
`purchaseRemoveAds` runs the Play Billing flow; `restoreRemoveAds` +
`ownsRemoveAds` restore the non-consumable (a "Restore purchases" Settings row,
and an automatic re-grant on launch after a reinstall).

Still to do before real purchases work:

1. Create a non-consumable product **`remove_ads`** in Play Console.
2. Build a **native** binary (expo-iap is a native module — needs a rebuild) and
   install it from an **internal test track** (Play Billing won't transact against
   a locally-signed APK).
3. iOS: add the product in App Store Connect when iOS ships.

## 3. Quote corpus

`data/quotes-source.json` ships ~60 curated **public-domain** quotes; a larger
bootstrap corpus is merged from `data/quotes-bulk.json` (see DECISIONS D20).
Before launch, expand to the full public-domain corpus (see DECISIONS D8), then
rebuild the bundled DB:

```
pnpm build:db
```

**Whenever you change the bundled quotes, bump `CONTENT_VERSION` in
`src/db/schema.ts`** before rebuilding — on the next app update, `syncContent`
merges the new quotes into already-installed devices (additively, by text, so
progress is preserved). See DECISIONS D21.

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
