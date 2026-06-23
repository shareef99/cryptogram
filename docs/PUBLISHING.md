# Google Play Publishing Checklist

End-to-end path to ship **Cryptogram** (`com.shareef.cryptogram`) to the Play
Store. Work through it top to bottom; check items off as we go. Companion to
[RELEASE.md](./RELEASE.md) (which covers the ads/IAP/corpus placeholders).

> Status legend: `[ ]` todo · `[~]` in progress · `[x]` done

Current state: EAS `production` profile already builds an **AAB** with
`autoIncrement` + remote `appVersionSource`; `eas-cli` installed; app version
`1.0.0`; AdMob **Android** IDs wired (test in dev, real in release).

---

## 1. One-time prerequisites
- [ ] Google Play Developer account — [play.google.com/console](https://play.google.com/console), **$25 one-time**, + identity verification (can take days).
- [ ] ⚠️ Personal-account rule: new *individual* accounts must run a **closed test with ≥20 testers for 14 continuous days** before production access is granted. Org accounts are exempt. **This is usually the longest pole — start it early (step 5).**
- [ ] Expo account ready (`eas login`).

## 2. Pre-launch must-haves (required because the app shows ads)
- [ ] **Privacy policy URL** (host anywhere, e.g. GitHub Pages) disclosing AdMob/data collection.
- [ ] **UMP consent flow** (GDPR, EEA/UK) wired in the ads layer — see [RELEASE.md](./RELEASE.md) §1. *(code task — can do locally)*
- [ ] **Data safety form** — declare AdMob collection (advertising ID, approx. location, device IDs).
- [ ] **"Contains ads"** declaration + **content rating** (IARC) questionnaire.
- [ ] Recommended first: expand **quote corpus** (59 → thousands) and finalize the **`remove_ads` IAP** product.

## 3. Build the production AAB
- [ ] `eas build -p android --profile production` (cloud build → `.aab`; no local Android Studio needed).

## 4. App signing (Google + EAS handle it)
- [ ] First `eas build` auto-generates a real **upload keystore** (view via `eas credentials`). *(Local release builds currently use the debug keystore — not valid for Play.)*
- [ ] First upload enrolls in **Play App Signing** (Google holds the signing key; you sign with the upload key). Nothing manual.

## 5. Create app + start testing in Play Console
- [ ] Play Console → **Create app** (name, language, App, Free).
- [ ] **Store listing**: title, short + full description, **screenshots** (≥2 phone), **512×512 icon** (done ✅), **1024×500 feature graphic**.
- [ ] **App content**: privacy policy, ads, content rating, data safety, target audience.
- [ ] **Internal testing** → create release → upload AAB → add testers.
- [ ] **Closed testing** → recruit ≥20 testers, keep them opted in → **start the 14-day clock** (personal accounts).

## 6. Upload via EAS (after the Console app exists)
- [ ] First AAB: upload **manually** in Console (simplest), or set up automation:
- [ ] Create a **Google Play service account** w/ API access → download JSON → point `eas.json` `submit.production` at it.
- [ ] `eas submit -p android --profile production` for subsequent uploads.

## 7. Production rollout
- [ ] (Personal accounts) After 14-day closed test → **apply for production access**.
- [ ] Create **Production** release → submit for review (first review: days to ~2 weeks).
- [ ] **Staged rollout** (e.g. 20% → 100%).

---

## Critical path (shortest first)
1. **Privacy policy URL** + **UMP consent** (code) — required, partly self-serve.
2. `eas build -p android --profile production` → AAB (works today).
3. Create Console app + **start the closed test NOW** (the 14-day clock is the bottleneck).
4. In parallel: expand quotes, finalize IAP, fill data-safety/ads/rating forms.
5. Apply for production → submit → rollout.

## Notes / open items carried from RELEASE.md
- iOS AdMob app + units not created yet; `iosAppId` in `app.json` is still the Google test id.
- Real AdMob **Android** App ID + unit ids are live in release builds.
