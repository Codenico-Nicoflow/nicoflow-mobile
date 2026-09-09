# nicoflow-mobile

Expo React Native app for Nicoflow (Phase 6, E-034+). Consumes `@nicoflow/shared` as a published npm dependency — same package `nicoflow-frontend` uses.

## Get started

```bash
npm install
cp .env.example .env   # fill in EXPO_PUBLIC_API_URL at minimum
npx expo start
```

Opens to a blank Expo Router screen. Use the Metro output to launch an iOS Simulator, Android Emulator, a dev build, or Expo Go.

## Env vars

All runtime config is read from `EXPO_PUBLIC_*` env vars (see `src/constants/env.ts`) — never hardcode API URLs or DSNs.

| Var                       | Purpose                                          |
| ------------------------- | ------------------------------------------------ |
| `EXPO_PUBLIC_API_URL`     | Nicoflow API base URL                            |
| `EXPO_PUBLIC_POSTHOG_DSN` | PostHog analytics (optional, no-op if unset)     |
| `EXPO_PUBLIC_SENTRY_DSN`  | Sentry error tracking (optional, no-op if unset) |

Local dev reads `.env` (gitignored). EAS builds read the same vars from **EAS Secrets**, set once per project:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.nicoflow.app/v1"
eas secret:create --scope project --name EXPO_PUBLIC_POSTHOG_DSN --value "<dsn>"
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "<dsn>"
```

`eas.json` build profiles reference these by name (`$EXPO_PUBLIC_API_URL` etc.) — no plaintext secrets are ever committed.

## Android networking (local dev)

`EXPO_PUBLIC_API_URL=http://localhost:8080/v1` works on the iOS simulator and web,
but **not on Android** — there `localhost` is the device's own loopback, not your
machine, so every request fails to connect and the app looks like it has no
backend (sign-in included).

Two things handle this:

- `src/constants/resolveApiUrl.ts` rewrites a loopback host to `10.0.2.2`, the
  Android **emulator's** alias for the host machine. Only loopback is rewritten —
  LAN, staging and production URLs pass through untouched.
- `app.config.ts` sets `usesCleartextTraffic` for non-production builds. Android
  API 28+ blocks plain `http://` at the platform level, so without it even the
  correct host cannot connect. It is deliberately **off in production** — that
  build must not weaken its transport rules for a dev convenience.

**On a physical Android device**, `10.0.2.2` means nothing (it is emulator-only).
Point `EXPO_PUBLIC_API_URL` at your machine's LAN address instead — e.g.
`http://192.168.1.20:8080/v1` — and make sure the API listens on `0.0.0.0`, not
only on loopback.

## Push notifications and Expo Go

Push cannot be exercised in Expo Go. Android remote push was removed from it in
SDK 53, so `getExpoPushTokenAsync` throws and registration resolves to `failed`
— silently and non-fatally, by design. Expo prints two warnings about this on
startup; they are expected, not a defect.

To verify push end to end you need a **development build**
(https://docs.expo.dev/develop/development-builds/introduction/) on real
hardware — a simulator has no APNs/FCM registration either, and resolves to
`unsupported`.

## EAS setup

Project is linked: `@codenico/nicoflow-mobile` (https://expo.dev/accounts/codenico/projects/nicoflow-mobile), `extra.eas.projectId` and `updates.url` in `app.json` point at it.

Remaining one-time steps:

1. `npx eas login` (if not already)
2. Set EAS Secrets (above)
3. `eas build --profile development` / `--profile preview` / `--profile production`

`@nicoflow/shared` is public npm — no registry auth token needed for `npm install`/CI.

## Release (Android)

**Android-only for now.** Google Play is a one-time $25 registration; App Store
Connect needs the $99/yr Apple Developer Program. Add an `ios` block to
`eas.json`'s `submit.production` when that account exists.

### Development build (free, no store account)

Push tokens require a real build on real hardware. `distribution: internal` means
no Play account is involved — you install the APK directly.

```bash
eas build --profile development --platform android   # produces an installable APK
npx expo start --dev-client                          # then connect the device
```

An emulator still cannot receive push (no FCM registration) — use a physical
device to verify it end to end.

### Production build

```bash
eas build --profile production --platform android    # app-bundle (.aab) for Play
```

`autoIncrement` bumps `versionCode` per build; `appVersionSource: "remote"` keeps
EAS as the source of truth, so `version` in `app.json` is the marketing version
only.

### Submission

```bash
eas submit --profile production --platform android
```

Configured to the **internal** track as a **draft** — nothing reaches users
without an explicit promotion in the Play Console. That is intentional: a
misconfigured submit should never be able to publish by accident.

Requires a Google Play service-account key; see
https://docs.expo.dev/submit/android/.

### Store asset checklist

Engineering scaffolds the technical config; the creative is yours to produce and
approve.

| Asset              | Requirement                                 | Status                                        |
| ------------------ | ------------------------------------------- | --------------------------------------------- |
| App icon           | 1024×1024 PNG, no alpha                     | ✅ `assets/images/icon.png`                   |
| Adaptive icon      | foreground / background / monochrome layers | ✅ configured in `app.json`                   |
| Splash screen      | via `expo-splash-screen`                    | ✅ configured                                 |
| Feature graphic    | 1024×500                                    | ❌ **needed for Play**                        |
| Screenshots        | ≥2 phone screenshots, 16:9 or 9:16          | ❌ **needed for Play**                        |
| Short description  | ≤80 chars                                   | ❌ **needed**                                 |
| Full description   | ≤4000 chars                                 | ❌ **needed**                                 |
| Privacy policy URL | public URL                                  | ❌ **blocked on E-040** (ToS/Privacy)         |
| Data safety form   | Play Console questionnaire                  | ❌ **blocked on E-040** (GDPR export/erasure) |
| Content rating     | Play Console questionnaire                  | ❌ **needed**                                 |

The two E-040 items are hard blockers: Play will not accept a submission without
a privacy policy and a completed Data safety form, regardless of how finished the
app is.

### OTA updates

`updates.url` and the per-profile `channel` (`development` / `preview` /
`production`) are configured, so a build resolves its channel on launch. Wiring
publishes into CI is **E-059**, not this story.

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Update](https://docs.expo.dev/eas-update/introduction/)
- Nicoflow cross-repo contract: `../CLAUDE.md` in the workspace root
