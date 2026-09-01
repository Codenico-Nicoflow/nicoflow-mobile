# Gates — nicoflow-mobile

Measured 2026-09-01. Mobile is often **not** in a feature's `consumers:` list; when
it is not, these gates do not run and mobile is covered by the standing
compatibility check instead.

## Tier 1 — every iteration (~4s)

```bash
pnpm type-check          # tsc --noEmit                        ~4s
```

## Tier 1 — targeted tests

```bash
npx jest src/features/<Feature>/<File>.test.tsx
```

## Tier 2 — every 5th iteration, and before every push (~55s)

```bash
pnpm type-check
pnpm lint
pnpm test                # 205 tests, ~51s
```

## Standing compatibility check (scheduled, not part of the loop)

Mobile may lag the published `@nicoflow/shared` — features declare their own
`consumers:`, so a web-only change does not drag mobile along. Skew is tracked
rather than forbidden:

```bash
pnpm add @nicoflow/shared@latest
pnpm type-check
```

Red here is **visible and non-blocking**. It means mobile has fallen behind the
contract and needs a catch-up pass — not that the current feature is broken.

## Nested worktrees will break this suite

A git worktree created inside `.claude/worktrees/` ships its own `node_modules`,
including a second copy of React. Jest then resolves two Reacts, every hook
returns null, and ~91 tests fail with:

```
TypeError: Cannot read properties of null (reading 'useMemo')
```

`package.json` now sets `modulePathIgnorePatterns` and `testPathIgnorePatterns`
to `<rootDir>/.claude/`, which fixes it. **Do not remove those.** The general
rule for the harness: worktrees live _outside_ the repo they branch from.

## Conventions the gate does not catch

- **No `any`.**
- Match `nicoflow-frontend` design tokens (Indigo/Slate, radius scale) on every
  feature, not just auth. No bare React Native primitive styling.
- RNTL v14 `fireEvent` is async — an unawaited press silently no-ops and the test
  passes for the wrong reason. Always await.
- Non-`(tabs)` routes need their own local `SafeAreaProvider`, or `SafeAreaView`
  collapses to zero height.
- Never `act()`. Use `waitFor`.
- Destructive swipe actions must open a confirm modal, never fire on swipe-open.

## Never

- Cast around a generated type from `@nicoflow/shared`
- Delete or skip a test to make a gate pass
- Remove the `.claude/` ignore patterns from the Jest config
