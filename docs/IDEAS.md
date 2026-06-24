# Feature Ideas & Engagement Roadmap

A living backlog of game mechanics and engagement features, mostly built on the
large quote corpus (the corpus is a *content engine* we can slice into modes).
Captured from brainstorming — not all will ship, and not in this order.

> Status: `[ ]` idea · `[~]` planned/speccing · `[x]` shipped
> North star: **retention + discovery drive ad revenue** (see the $100/mo goal in
> our publishing discussion). Prioritize features that bring players back or bring
> new players in.

---

## Prerequisite — preserve quote tags

The CSV dataset has rich tags (`love, life, wisdom, humor, …`), but the current
importer (`scripts/import-quotes-csv.ts`) **drops them** (we only keep
`category='long'`). Several ideas below (theme/author packs, themed dailies)
depend on tags. **Unblocking work:** keep tags in the importer + add a `tags`
column (or a `quote_tags` table) in `build-db.ts` / schema. Do this once.

- [ ] Preserve tags through the importer + DB schema.

---

## A. User-proposed ideas

### A1. Monthly category challenge (tiered packs) `[ ]`
- A themed challenge (by tag/category) with **30 / 60 / 90** completion tiers.
- **Floor rounding** of rewards: finishing 45 → you get the **30** reward (forgiving,
  no all-or-nothing punishment).
- "One category per month" rotating theme, or a library of evergreen packs + a
  featured monthly one.
- Reward tiers should feel meaningful: coins **+** a scarce Hint 2 **+** a badge.
- **Depends on:** tags preservation.

### A2. Daily quote + calendar `[ ]`
- One puzzle **per day**, **same for everyone** (deterministic from the date via the
  existing seeded RNG → also enables the Share card, C1).
- **Calendar view**; future dates disabled; **allow backfilling missed past days**
  (pairs with the month-completion reward; forgiving).
- **Complete-the-month reward** at month end.
- Plugs into the **existing daily-streak system**.
- Highest-ROI engagement feature — the Wordle loop.

---

## B. Additional engagement / meta ideas

- **B1. Achievements / badges** `[ ]` — "Solve 100", "No-mistake solve", "Sub-60s
  solve", "7/30-day streak". Cheap to build, very sticky.
- **B2. Streak freeze** `[ ]` — spend coins so a missed day doesn't break the streak.
  Retention **and** a coin sink.
- **B3. Daily goal** `[ ]` — "Solve 3 today → bonus coins" (separate from the streak).
- **B4. Favorites / Quote book** `[ ]` — save liked quotes into a collection. Low
  effort, gives the *content itself* replay value.
- **B5. XP / player level** `[ ]` — overall level from solving; unlocks cosmetics.

## C. Growth / virality

- **C1. Share card (Wordle-style)** `[ ]` — "I solved today's cryptogram — 🔥 day 7,
  0 mistakes." **Free marketing**; directly attacks the discovery problem. Low
  effort, high upside. Depends on the deterministic daily (A2).

## D. Gameplay modes (reuse the engine + data)

- **D1. Perfect mode** `[ ]` — bonus for solving with 0 wrong guesses.
- **D2. Time attack** `[ ]` — most solves in N minutes (leaderboard-able later).
- **D3. Endless** `[ ]` — back-to-back puzzles, see how far you get.
- **D4. Author guessing bonus** `[ ]` — after solving, "who said it?" for bonus coins.

## E. Monetization / coin sinks

> Coins currently have little to spend on. These give the economy a sink — keep it
> **soft-currency / cosmetic, never pay-to-win**.

- **E1. Cosmetic themes** `[ ]` — cell colors, sound packs, backgrounds (buy with coins).
- **E2. Premium pack unlocks** `[ ]` — unlock a theme pack with coins…
- **E3. Rewarded-ad unlocks** `[ ]` — …or **watch an opt-in ad** to unlock it
  (on-brand with the ad-light promise).
- **E4. "Reveal author" peek** `[ ]` — small coin spend to see the author as a hint.

---

## Prioritization (effort × impact)

| Feature | Impact | Effort |
|---|---|---|
| C1 Share card | High (discovery) | **Low** |
| A2 Daily + calendar | High (retention) | Med |
| B1 Achievements | Med–High | Low–Med |
| B2 Streak freeze | Med | Low |
| B3 Daily goal | Med | Low |
| A1 Theme/author packs | High | High (needs tags) |
| D1–D3 Extra modes | Med (each) | Med (each) |
| E1–E4 Cosmetics / sinks | Med | Med |

## Suggested sequencing vs launch

We're mid-closed-test, trying to launch — avoid feature-creep that delays it.

**v1 (small, high-leverage):**
1. A2 Daily challenge + calendar (retention)
2. C1 Share card (discovery — cheapest growth lever)
3. A couple of B1 achievements (stickiness)

**Post-launch updates** (each update = an ASO bump + a reason testers/users return):
- Tags preservation → A1 theme/author packs
- D1–D3 extra modes
- E1–E4 cosmetics + coin sinks

Shipping packs/modes *as updates* is a feature, not a compromise — Play rewards
apps that update, and each gives a changelog to market.
