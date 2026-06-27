# Decision Log

Decisions made for the Cryptogram game, with rationale and status. Newest context lives in
[PLAN.md](./PLAN.md); this file records _why_ we chose what we chose, so future-us doesn't
re-litigate settled questions.

Status legend: ✅ Decided · 🔄 Tunable (default chosen, easy to change) · ❓ Open

---

## D1 — Framework: React Native + Expo ✅

**Decision:** Build with React Native on Expo (SDK 55 / RN 0.83 / React 19), one codebase for
Android + iOS.
**Why:** A cryptogram is text + taps (no physics/rendering loop), so RN's performance ceiling
is irrelevant here. Expo gives Android-first delivery plus near-free iOS. Project is already
scaffolded with the right native libs.
**Implications:** AdMob/IAP require a native/dev build (not Expo Go); `android/` already exists.

## D2 — Target & performance bar: low-end Android first ✅

**Decision:** Optimize for 3–4-year-old budget Android phones; gameplay must stay smooth with
animations.
**Why:** Stated user base is mostly Android, many low-end.
**How:** (1) per-cell state subscriptions so a keystroke re-renders only affected cells;
(2) all dynamic/animated visuals on the UI thread via Reanimated; (3) no game engine/heavy
libs; (4) async SQLite so the DB never blocks the UI. See PLAN §9.

## D3 — State management: Zustand ✅

**Decision:** Use Zustand for game/app state.
**Why:** Tiny, fast, minimal boilerplate; selector subscriptions let each cell read only its
own slice — the key discipline for no-jank input on low-end devices.

## D4 — Styling: StyleSheet + Reanimated (not NativeWind/Tamagui/Unistyles) ✅

**Decision:** `StyleSheet.create` for static styles; Reanimated `useAnimatedStyle` for all
dynamic/animated cell states. No inline style objects in hot paths.
**Why:** On the New Architecture (Fabric) there's no bridge, so `StyleSheet`'s main remaining
value is referential stability (memoization-friendly) + dev validation — and it's plenty
fast. The real perf lever is avoiding React re-renders for dynamic styles, which Reanimated
solves by updating native nodes on the UI thread. NativeWind/Tamagui are convenience, not perf
wins here.
**Alternative noted:** **Unistyles 3** (C++/Nitro, updates styles without React re-render) is a
genuine perf option for _dynamic theming_ — kept as an optional post-v1 upgrade, not v1.

## D5 — Storage: expo-sqlite for everything ✅

**Decision:** All persistent data (quotes, progress, settings, economy, streaks) in a single
SQLite DB via `expo-sqlite`. No AsyncStorage.
**Why:** User wants thousands of quotes + relational queries (next-unsolved, stats); SQLite is
the right tool and keeps one storage layer.

## D6 — Quote delivery: prebuilt, bundled .db copied on first launch ✅

**Decision:** Generate `assets/db/cryptogram.db` at build time (`scripts/build-db.mjs` from
`data/quotes-source.json`); copy it into the document dir on first launch. Version via
`PRAGMA user_version` to ship future quote/schema updates without wiping progress.
**Why:** Inserting thousands of rows at runtime is slow on low-end devices; shipping a prebuilt
DB makes first launch instant.

## D7 — Corpus size goal: thousands of quotes (~1 year of play) ✅

**Decision:** Target a few thousand quotes; schema has derived columns (`difficulty`,
`letter_count`, `length`) for variety and filtering.
**Why:** User wants long-term replayability without content updates.

## D8 — Quote dataset & licensing: public-domain-first; bootstrap with quotable ✅ (sourcing ❓)

**Decision:** For the _shippable_ corpus, use **public-domain** quotes (authors who died
pre-~1955; Project Gutenberg / Wikiquote PD authors). Use the MIT-licensed **quotable** repo
to bootstrap development only.
**Why:** This is a **monetized commercial** app. Short quotes are individually often
non-copyrightable, but a commercial product made of _nothing but_ famous quotes is **not**
safely fair use and can raise **copyright, trademark, and right-of-publicity** issues
(Stanford Fair Use Center guidance). Public-domain content removes that risk and fits the
cryptogram genre (classic literary/philosophical quotes) well.
**Rejected for shipping:** dwyl/quotes (GPL-2.0 copyleft + Goodreads-sourced),
JamesFT/Database-Quotes-JSON (no clear data license), Quotes-500K (scraped, unclear
provenance). quotable's _data_ license is undocumented → dev-bootstrap only.
**Open (❓):** finalize/produce the actual public-domain corpus (likely a Gutenberg/Wikiquote
extraction script). Does not block Phases 1–6, which build against the schema, not the data.

## D9 — Cipher: numbers, generated at runtime from quote id ✅

**Decision:** Letters → numbers, mapping generated deterministically at runtime from the quote
id (seeded PRNG). No cipher data stored in the DB.
**Why:** Zero precomputed data; the same puzzle always looks identical. (The user's reference
game uses numbers and sometimes symbols — symbols can be a later visual option.)

## D10 — Coins economy ✅ (amounts 🔄)

**Decision:** Earn base coins per level cleared, scaled by difficulty (default easy 10 /
medium 20 / hard 30). Coins spend on Hint 1. Stored in `player.coins`.
**Why:** Core engagement/monetization loop; gives the "double it" ad something to double and
gives Hint 1 a price.

## D11 — Two hint types, with Hint 2 deliberately scarce ✅ (Hint 2 size 🔄)

**Decision:**

- **Hint 1 "Reveal"** (common, coin-priced): highlights all unsolved letters → player taps one
  to reveal, or "Surprise me" reveals a random one.
- **Hint 2 "Lucky Reveal"** (scarce, _earned not bought_): reveals a random unsolved letter
  from a limited inventory (`player.hint2_count`), granted mainly via streak milestones.
  **Why:** User wants Hint 2 to feel like a genuine reward, so it must be scarce and not freely
  purchasable.
  **Tunable (🔄):** Hint 2 reveals **one** letter in v1 (clean + scarce); can reveal several if
  we want it splashier.

## D12 — Daily streaks & consistency rewards ✅ (milestones 🔄)

**Decision:** A "day" is active when ≥1 level is cleared, logged by **local** calendar date in
`daily_activity`. Track `current_streak` / `longest_streak`. Milestone rewards (default day
3/7/14/30) grant coins **+ scarce Hint 2**. Home shows a streak panel.
**Why:** Rewards consistency (user request) and is the main faucet that makes Hint 2 feel
special.
**Detail:** Streak math compares local `YYYY-MM-DD` strings to avoid timezone/DST bugs.

## D13 — Ads philosophy: non-intrusive, opt-in-first ✅ (banner added 🔄)

**Decision:** No forced mid-gameplay ads. Rewarded ads are opt-in (hints + "double your
coins"). Interstitials are frequency-capped (≤1 per N puzzles + min time gap), shown only on
win→next, never mid-puzzle.
**Why:** The whole motivation for building this is that the reference game shows forced
interstitials between every stage. We monetize without that.
**Revision (🔄):** A single **anchored adaptive banner** now sits below the keyboard on the
puzzle screen (`src/ads/PlayBanner.tsx`). Banners are passive (no interruption, no covering the
grid), which keeps the "non-intrusive" promise while adding steady fill. It is hidden when ads
are removed via IAP and self-collapses on no-fill. Trade-off accepted: more ad surface raises
the priority of the UMP consent flow (RELEASE.md §1) before an EEA launch.

## D14 — "Double your reward" ad & the 5-second-skip question ✅

**Decision:** Base coins are granted instantly on level clear; an opt-in **rewarded** ad
doubles them. Per AdMob policy, rewarded ads show a close button after 5s, but
**skipping/closing forfeits the reward** (reward only fires via `onUserEarnedReward`).
**Conclusion:** We **cannot** make an ad that is "5-sec skippable _and_ still grants the
double." The compliant design: skip at 5s → keep base coins (no penalty); watch fully → coins
doubled. This is also the least intrusive option.
**Source:** AdMob rewarded-ad policy + SDK behavior (close button at 5s; reward via callback).

## D15 — Remove-ads IAP ✅

**Decision:** A "remove ads" in-app purchase sets a persisted `ads_removed` flag (settings
table) that disables interstitials/banners. Opt-in rewarded ads ("double it"/ad-hints) remain
available even after purchase (they're a player benefit, not an interruption).
**Why:** Clean extra revenue from engaged players; respects buyers by removing only the
intrusive ad types.

## D16 — Ads behind an abstraction with test IDs ✅

**Decision:** All ad code lives behind `src/ads/` with a feature flag, wired with AdMob **test
IDs** so the game is fully functional before real AdMob/store accounts exist; real IDs dropped
in later.
**Why:** Unblocks building/testing now; isolates ad-network specifics.

## D17 — v1 scope cuts ✅

**Decision:** Defer sound effects, daily-challenge mode, and leaderboards to post-v1.
**Why:** Keep v1 focused on a great core + the engagement/monetization loop.

## D18 — Process: plan-first, then build in phases ✅

**Decision:** Finalize the plan ([PLAN.md](./PLAN.md)) before coding; then implement in the 11
ordered phases, with visible progress at each step.
**Why:** User explicitly chose "plan first, then build."

## D19 — Versioned user-data migrations ✅

**Decision:** On-device user data carries a `user_data_version` (stored in the `settings`
table), separate from the bundled content DB's PRAGMA `user_version`. On launch, an ordered,
append-only migration list (`USER_DATA_MIGRATIONS` in `db/schema.ts`) runs every step above the
stored version, then stamps the current version. The first migration (v1→v2) drops incompatible
**in-progress** rows left by the old per-code input model; **solved** rows (stats/streak
history) are preserved.
**Why:** The per-code → per-cell gameplay change made saved `progress.guesses` mean something
different, but both formats are structurally identical JSON (`Record<number,string>`), so they
can't be told apart at parse time. A version stamp + one-time clear is the only reliable fix and
gives us a clean, extensible path for future user-data format changes. Content version stays
independent so shipping new quotes never forces a user-data migration. Each migration is written
to be harmless on empty tables, so fresh installs simply replay them as a no-op.

## D20 — "Long" puzzle tier + bulk bootstrap corpus ✅

**Decision:** Length defines the tier — ≤40 Easy, ≤75 Medium, ≤160 Hard, **161–240
Long** (`difficulty = 4`, 50-coin reward). The corpus is bootstrapped from a large
CSV dataset via `scripts/import-quotes-csv.ts`, which streams ~500k rows, cleans
author/text, caps each author (the raw set is flooded by a few prolific authors),
dedupes, and fills balanced length buckets (the file is ~popularity-ordered, so
first-come ≈ best). Output `data/quotes-bulk.json` (~11k) is merged by `build:db`;
raw datasets (`data/quotes.csv`, `data/quotes.json`) are gitignored.
**Why:** Players asked for long quotes as their own mode; binning by length keeps
selection logic unchanged (a 4th difficulty value). Per-author capping + ordered
selection gives volume _and_ quality without a popularity column.
**Bootstrap caveat:** like D8, this dataset is for development / closed-test volume;
swap for a clean licensed/PD set before public launch (delete the bulk file +
rebuild). Replaces the earlier quotable bootstrap.

## D21 — Content sync for app updates ✅

**Decision:** The bundled content DB only copies to the device on first launch, so
shipping more quotes in an app update would never reach existing installs. On
launch, `syncContent` (db/content-sync.ts) compares the bundled `CONTENT_VERSION`
(now a single source of truth in db/schema.ts, imported by build-db.ts) against
the version in the working DB's `meta` table; when newer, it stages a fresh copy
of the bundled asset and **merges quotes additively, matched by text** — existing
quotes keep their ids (so progress keyed by quote_id survives) and only new
quotes are appended. Bump `CONTENT_VERSION` whenever rebuilding the DB.
**Why:** Players (and us) need new quotes/features to land on already-installed
devices without a reinstall and without wiping progress. Matching by text avoids
depending on id stability across builds (build order can shift ids). Quotes
dropped from a newer build are left in place (harmless) rather than deleted —
simpler and safe for progress.
**Caveat:** additive only; it won't prune removed quotes or edit changed ones (a
typo fix reads as a new quote, orphaning the old). Acceptable for v1.

---

## Open items to resolve

- **D8:** produce the public-domain quote corpus (extraction source + script).
- **D11 (🔄):** confirm Hint 2 reveals one letter vs several.
- Confirm default tuning numbers in **D10** (coin amounts) and **D12** (milestone days/rewards).
