# CLAUDE.md — nicoflow-mobile

> **Umbrella context:** this repo sits under `../CLAUDE.md` (the Nicoflow workspace root). Read it first for the cross-repo contract, roadmap, and how mobile fits into the 4-repo topology.

Expo React Native app (Phase 6, E-034+). Consumes `@nicoflow/shared` as a published npm dependency — same package `nicoflow-frontend` uses (RTK Query slices, Zod schemas, i18n locales).

## Design parity is non-negotiable

**Mobile must look and feel like the same product as `nicoflow-frontend`, not a generic Expo template with different screens bolted on.** This has been flagged twice in the same session — treat it as a hard rule, not a style preference.

Before styling any screen or component:

1. **Read the actual web component source** in `nicoflow-frontend/src/components/ui/` for the closest equivalent (`button.tsx`, `input.tsx`, etc.) and port every visual detail — not just colors:
   - Shadows (`shadow-sm` at rest, `shadow-md` on hover/press, `transition-all duration-200`) — a flat, shadowless `Pressable`/`View` reads as cheap next to web.
   - Exact sizing (web inputs are `h-9` / 36px — don't guess a taller height).
   - Border color/weight (`border-input`, a specific lighter token — not a plain generic border).
   - Focus/hover/disabled states — RN has no native `:focus-visible`, so build an explicit `onFocus`-driven equivalent.
2. **Pull real color tokens** from `nicoflow-frontend/src/index.css` (`--primary`, `--background`, `--foreground`, `--muted-foreground`, `--destructive`, `--success`, radius scale `--radius-sm/md/lg/xl`) into `src/constants/theme.ts`'s `Colors` — keep the two files hand-synced until a shared token package exists.
3. **Match structure too** — card layout, spacing rhythm, copy tone from the equivalent web page.

The review bar is: *does this look shadowless/flat/wrong-height next to web* — not *does it use the right hex codes*. Color parity without shadow/sizing/state parity still looks broken.

## Stack

- Expo SDK 57, TypeScript, Expo Router (file-based, route groups: `(tabs)` app shell, `(auth)` sign-in/sign-up/forgot-password)
- Redux Toolkit + RTK Query (factories from `@nicoflow/shared/api`, constructed in `src/lib/store/store.ts` — same pattern as `nicoflow-frontend`)
- `expo-secure-store` for refresh-token persistence (RN has no HttpOnly cookie jar — access token stays memory-only, same as web)
- `react-hook-form` + `zod` (schemas imported directly from `@nicoflow/shared/schemas`, no mobile-specific copies)
- Testing: `jest-expo` + `@testing-library/react-native` v14 (note: `render`/`fireEvent` are **async** in v14 — always `await` them) + `msw/native` (not `msw/node` — RN has no `http` module)

## Known CI gotcha

`npm ci`'s strict lockfile-match fails intermittently in GitHub Actions on this project's optional wasm deps (`@emnapi/*`) resolving differently across platforms/npm versions — confirmed non-deterministic across multiple clean local regenerations. CI uses `npm install` instead of `npm ci` to tolerate this drift (see `.github/workflows/ci.yml`).
