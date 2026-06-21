# Cryptogram — Project Docs

Design and decision records for the Cryptogram game.

| Doc | What it is |
| --- | --- |
| [PLAN.md](./PLAN.md) | The full build plan — scope, architecture, schema, screens, phases. The "what" and "how". |
| [DECISIONS.md](./DECISIONS.md) | Decision log (ADR-style) — every choice we've made and **why**, with status (Decided / Tunable / Open). |

## Quick status
- **Phase:** Planning complete; ready to start Phase 1 (clean slate) + Phase 2 (game logic).
- **Stack:** React Native + Expo (SDK 55), Zustand, expo-sqlite, Reanimated, AdMob.
- **Open items:** public-domain quote corpus (D8); Hint 2 reveal count (D11); tuning numbers
  for coins/milestones (D10/D12). See the bottom of [DECISIONS.md](./DECISIONS.md).

When a decision changes, update [DECISIONS.md](./DECISIONS.md) (and PLAN.md if the plan shifts)
in the same change so the two stay in sync.
