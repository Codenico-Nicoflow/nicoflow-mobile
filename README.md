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

| Var                        | Purpose                    |
| --------------------------- | --------------------------- |
| `EXPO_PUBLIC_API_URL`       | Nicoflow API base URL       |
| `EXPO_PUBLIC_POSTHOG_DSN`   | PostHog analytics (optional, no-op if unset) |
| `EXPO_PUBLIC_SENTRY_DSN`    | Sentry error tracking (optional, no-op if unset) |

Local dev reads `.env` (gitignored). EAS builds read the same vars from **EAS Secrets**, set once per project:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.nicoflow.app/v1"
eas secret:create --scope project --name EXPO_PUBLIC_POSTHOG_DSN --value "<dsn>"
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "<dsn>"
```

`eas.json` build profiles reference these by name (`$EXPO_PUBLIC_API_URL` etc.) — no plaintext secrets are ever committed.

## EAS setup (one-time, per project)

1. `npx eas login`
2. `npx eas init` — links this repo to an EAS project, fills `extra.eas.projectId` in `app.json` and the `updates.url` (currently placeholder `REPLACE_WITH_EAS_PROJECT_ID`)
3. Set EAS Secrets (above)
4. `eas build --profile development` / `--profile preview` / `--profile production`

`@nicoflow/shared` is public npm — no registry auth token needed for `npm install`/CI.

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Update](https://docs.expo.dev/eas-update/introduction/)
- Nicoflow cross-repo contract: `../CLAUDE.md` in the workspace root
