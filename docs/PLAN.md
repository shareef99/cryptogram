# Cryptogram Game — Build Plan (v2)

> Living document. Last updated: 2026-06-21.
> Companion: [DECISIONS.md](./DECISIONS.md) records _why_ each choice was made.

## 1. Concept & scope (v1)

A clean, ad-light cryptogram game. Each puzzle is a quote/phrase where every letter is
consistently replaced by a **number** (randomized per puzzle). Player taps a cell, picks a
letter, and it fills every cell sharing the same number. Win when decoded text matches.

**v1 features:** play a puzzle, on-screen keyboard input, auto-fill matching cells, hints,
win detection + celebration, level/progression, light/dark theme, **thousands of offline
quotes**, resume-in-progress, coins economy, daily streaks, non-intrusive ads + "remove ads"
IAP.

**Deferred to post-v1:** sound effects, daily-challenge mode, leaderboards.

## 2. Tech foundation (already in place — reuse)

- Expo SDK 55 / RN 0.83 / React 19 ✓
- Reanimated 4 + Worklets (UI-thread animations) ✓
- Gesture Handler (native touch) ✓
- React Compiler enabled (auto-memoization) ✓
- Theme system (`Colors`, `Spacing`, `Fonts`) ✓ — keep, extend with game colors.

Remove demo screens/components (`explore.tsx`, `HintRow`, `WebBadge`, demo `AnimatedIcon`,
tabs) and replace with the game.

## 3. Storage — expo-sqlite for EVERYTHING

All persistent data lives in one SQLite database via **`expo-sqlite`**. No AsyncStorage.

### Why a prebuilt, bundled DB (thousands of quotes)

To support **thousands of quotes** (a year+ of play) without a slow first-launch seed, we
**ship a prebuilt `.db` file as a bundled asset** and copy it into the app's document dir on
first launch. This is far faster than inserting thousands of rows at runtime.

- `scripts/build-db.mjs` — build-time script: reads a source quotes file
  (`data/quotes-source.json`), validates/filters (length, charset A–Z), computes derived
  columns, and emits `assets/db/cryptogram.db`. Run via `pnpm build:db`.
- First launch: if no user DB exists, copy bundled `cryptogram.db` → document dir, then open
  it read/write. Subsequent launches open the existing DB directly.
- DB versioning via `PRAGMA user_version` so we can ship quote/schema updates in app updates
  (migrate or merge new quotes without wiping progress).

### Schema

```sql
quotes(
  id INTEGER PRIMARY KEY,
  text TEXT NOT NULL,            -- uppercased A–Z + spaces/punctuation
  author TEXT,
  category TEXT,
  difficulty INTEGER,           -- 1=short/easy .. 3=long/hard
  letter_count INTEGER,         -- distinct letters (puzzle complexity)
  length INTEGER                -- total chars, for layout/filtering
);
CREATE INDEX idx_quotes_difficulty ON quotes(difficulty);

progress(
  quote_id INTEGER PRIMARY KEY REFERENCES quotes(id),
  status TEXT,                  -- 'in_progress' | 'solved'
  guesses TEXT,                 -- JSON: number->letter map, for resume
  hints_used INTEGER DEFAULT 0,
  time_seconds INTEGER DEFAULT 0,
  started_at INTEGER,
  solved_at INTEGER
);

settings(key TEXT PRIMARY KEY, value TEXT);  -- theme, sound, ads_removed flag, etc.

-- Single-row player profile: economy + streak state
player(
  id INTEGER PRIMARY KEY CHECK (id = 1),
  coins INTEGER DEFAULT 0,
  hint2_count INTEGER DEFAULT 0,    -- scarce "lucky reveal" inventory
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date TEXT             -- local YYYY-MM-DD, for streak calc
);

-- One row per local calendar day the player was active (for streak + history UI)
daily_activity(
  date TEXT PRIMARY KEY,            -- local YYYY-MM-DD
  levels_cleared INTEGER DEFAULT 0,
  coins_earned INTEGER DEFAULT 0
);
```

### Key queries (all indexed, trivial at this scale)

- Next puzzle: random unsolved quote at a given difficulty
  (`LEFT JOIN progress ... WHERE status IS NULL ORDER BY <seeded> LIMIT 1`).
- Resume: load `progress.guesses` for an `in_progress` quote.
- Stats: counts by status/difficulty for the home screen.

SQLite with a few thousand rows + indexes is effectively instant; we use
`expo-sqlite`'s async API (`openDatabaseAsync`, `getAllAsync`, `runAsync`) so no UI blocking.

### Quote data sourcing (action item)

For a **monetized** app, the bundled corpus should be **public-domain-first** (authors who
died pre-~1955; sources like Project Gutenberg / Wikiquote PD authors) to avoid copyright,
trademark, and right-of-publicity risk. The `quotable` dataset (MIT-licensed code) is used to
**bootstrap development**, but its data license is undocumented, so it is not the shippable
corpus. See [DECISIONS.md → D8](./DECISIONS.md) for the full rationale. Until the final corpus
is built, `data/quotes-source.json` is seeded with curated entries so the game is fully
playable; `scripts/build-db.mjs` scales to thousands once the dataset is dropped in.

## 4. Game logic (pure TS, no UI, testable)

```bash
src/game/
  rng.ts         → seeded PRNG (deterministic per puzzle; no Math.random)
  cipher.ts      → generateCipher(seed) → letter↔number map; encode(text)
  puzzle.ts      → buildPuzzleState(quote) → cells[], number→slot map
  validate.ts    → isSolved(state), isCellCorrect(...)
```

Cipher is generated at runtime from the quote id as seed → zero precomputed cipher data in
the DB, same puzzle always looks identical.

## 5. State management — Zustand

- One game store; **each cell subscribes only to its own slice** (selector-based) so a
  keystroke re-renders only affected cells, not the whole grid. This is the core low-end-perf
  discipline.
- Store is the in-memory working state; writes are flushed to SQLite (debounced) for
  resume/persistence.

## 6. Styling & performance decision

- **Static styles → `StyleSheet.create`** (referentially stable → memoization-friendly; fast
  on New Architecture).
- **Dynamic/animated cell states (selected/filled/wrong/correct/win) → Reanimated
  `useAnimatedStyle`** on the UI thread — updates the native node **without a React
  re-render**. This is the key perf win, not the styling lib.
- **No inline style objects / style arrays in hot paths** (they break memoization).
- **Unistyles 3** noted as an _optional_ future upgrade for richer dynamic theming
  (C++/Nitro, updates styles without React re-render) — not in v1.
- ❌ Not using NativeWind / Tamagui (convenience, not a perf gain here).

## 7. Screens (expo-router)

```bash
src/app/
  _layout.tsx       → theme provider + splash + DB init (keep, simplify)
  index.tsx         → Home: progress summary, difficulty select, continue/new
  play/[id].tsx     → puzzle screen
  settings.tsx      → theme, sound, remove-ads, reset progress
```

## 8. Components

```bash
src/components/game/
  PuzzleGrid.tsx   → words → flex-wrap rows of cells
  Cell.tsx         → single cell, self-subscribed, Reanimated animated states
  Keyboard.tsx     → A–Z + delete; used/disabled letter states
  GameHeader.tsx   → progress, coins balance, hint buttons, timer
  HintBar.tsx      → Hint 1 (Reveal) + Hint 2 (Lucky Reveal, count badge) controls
  WinOverlay.tsx   → win celebration, coins earned, "✨ Double it" rewarded-ad button
src/components/meta/
  CoinBalance.tsx  → animated coin counter
  StreakPanel.tsx  → current streak, next milestone, claimable rewards (Home)
  RewardModal.tsx  → milestone/streak reward reveal (coins + scarce Hint 2)
```

## 9. Performance strategy (low-end Android first)

1. Per-cell Zustand subscription — minimal re-renders.
2. All dynamic visuals via Reanimated worklets (UI thread).
3. No game engine / heavy libs.
4. `expo-sqlite` async API — DB never blocks UI; prebuilt DB avoids seed cost.
5. Static `StyleSheet` styles; no inline objects in hot paths.
6. Pre-measure cell sizing once; avoid layout thrash.

## 10. Animations (Reanimated)

Cell select (scale/glow pulse), letter fill (fade/scale-in across matching cells),
wrong-guess shake, win cascade (staggered flip) + overlay. Optional `expo-haptics` taps.

## 11. Engagement, economy & hints

### 11.1 Coins economy

- **Earn:** base coins on every level cleared, scaled by difficulty
  (e.g. easy 10 / medium 20 / hard 30 — tunable).
- **Double-it ad:** after clearing, a "✨ Double it" button offers a _rewarded_ ad. Base
  coins are granted immediately; doubling only applies if the ad is watched to the reward
  point (see §12 for the 5-sec-skip rule). Skipping = keep base coins, no penalty.
- **Spend:** coins buy **Hint Type 1**. (Hint Type 2 is intentionally _not_ freely buyable —
  see below.)
- Balance stored in `player.coins`; every change written through the store → SQLite.

### 11.2 Two hint types

**Hint 1 — "Reveal" (common, coin-priced).**

- On activate: **highlight all still-unsolved letters** on the grid.
- Player either **taps one** highlighted letter to reveal it, **or** taps **"Surprise me"**
  to reveal a random one of them.
- Revealing places the correct letter for that cipher number and auto-fills all its cells.
- Costs coins each use. This is the everyday helper.

**Hint 2 — "Lucky Reveal" (scarce, premium, _earned not bought_).**

- Instantly reveals a random unsolved letter.
- **Limited inventory** (`player.hint2_count`), granted only as **streak/milestone rewards**
  (§11.3) — so receiving one feels special. Optionally also obtainable rarely via a rewarded
  ad, capped per day.
- UI treats it as a prized consumable (distinct styling, count badge, small celebration when
  awarded).

> Open tuning question: should Hint 2 reveal **one** random letter or **several** at once?
> Plan assumes **one** for v1 (clean + scarce); easily bumped to N if you want it splashier.

### 11.3 Daily streak & consistency rewards

- A day counts as "active" when the player clears ≥1 level; logged in `daily_activity` by
  **local** calendar date.
- `player.current_streak` increments on consecutive active days, resets if a day is missed;
  `longest_streak` tracked for display ("🔥 4-day streak").
- **Milestone rewards** at e.g. day 3 / 7 / 14 / 30 → coin bonuses **plus scarce Hint 2**
  grants. This is the main faucet that makes Hint 2 feel rewarding.
- Streak/last-active computed against device-local date (DST/timezone handled by comparing
  local YYYY-MM-DD strings, not raw timestamps).
- A lightweight **"Daily" / streak panel** on Home shows current streak, next milestone, and
  claimable rewards.

## 12. Ads & monetization

- **`react-native-google-mobile-ads`** (AdMob).
- **Rewarded ads** = opt-in only (hints + "double your coins"); never forced.
- **The 5-sec-skip rule (confirmed via AdMob policy):** rewarded ads _must_ show a close
  button after 5s, but **closing/skipping forfeits the reward** — the reward only fires via
  `onUserEarnedReward`. So "double it" grants the double **only on full watch**; skipping
  keeps the already-granted base reward. We cannot make a "5s-skippable _and_ still rewarded"
  ad; this is the compliant design and also the least intrusive.
- **Interstitials** = frequency-capped (max 1 per N puzzles + min time gap), **only** on
  win→next, **never** mid-puzzle. (Interstitial video itself is skippable per Google policy,
  but grants no reward.)
- **No banner on the puzzle screen** (menus only, if at all).
- **"Remove ads" IAP** (`expo-iap`/`react-native-iap`) → persisted `ads_removed` flag in
  settings table disables interstitials/banners. (Rewarded "double it"/ad-hints stay available
  as _opt-in_ even for ad-removal buyers — they're a player benefit, not an interruption.)
- All ads behind a clean `src/ads/` abstraction + feature flag, wired with **AdMob test IDs**
  so the game is fully functional before real accounts/keys exist. Needs a native build
  (you already have `android/`).

## 13. Implementation order (phased; visible progress each step)

1. **Clean slate** — strip demo screens/components; extend theme with game colors.
2. **Game logic** (`src/game/`) — rng, cipher, puzzle state, validation (+ quick checks).
3. **DB layer** — schema (incl. `player`/`daily_activity`), `scripts/build-db.mjs`,
   bundle+copy-on-first-launch, query helpers; seed `quotes-source.json` with curated quotes.
4. **Static puzzle screen** — grid + keyboard rendering a real puzzle from the DB (no anim).
5. **Interactivity** — tap cell, input letter, auto-fill, win detection.
6. **State + persistence** — Zustand store, resume via SQLite, home/level screen.
7. **Economy & hints** — coins on clear, Hint 1 (Reveal) + Hint 2 (Lucky Reveal) mechanics,
   spend/inventory logic.
8. **Streaks** — daily activity logging, streak calc, milestone rewards + reward modal.
9. **Animations & polish** — Reanimated cell/win animations, coin/streak animations, haptics.
10. **Ads abstraction + IAP** — rewarded "double it" + opt-in hint ads, capped interstitials,
    remove-ads IAP; behind feature flag with test IDs.
11. **Settings + theming pass**, then release build config.

## 14. New dependencies (added incrementally per phase)

`zustand`, `expo-sqlite`, `react-native-google-mobile-ads`, `expo-haptics`, an IAP lib.
(`expo-sqlite` replaces the earlier AsyncStorage plan.)
