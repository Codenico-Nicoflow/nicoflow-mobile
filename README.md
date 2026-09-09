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

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Update](https://docs.expo.dev/eas-update/introduction/)
- Nicoflow cross-repo contract: `../CLAUDE.md` in the workspace root
