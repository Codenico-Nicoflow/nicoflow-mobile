# nicoflow-mobile — Agent Guide

Expo React Native app for Nicoflow. Workspace rules are in `../AGENTS.md`; API contracts are in `../nicoflow-api/SPEC.md`. The app consumes published `@nicoflow/shared` APIs, types, schemas, and locales.

## Stack and conventions

- Expo SDK 57, TypeScript, Expo Router, Redux Toolkit/RTK Query, React Hook Form + Zod, NativeWind, Jest/jest-expo, React Native Testing Library, MSW native.
- Use RTK Query for server state and hooks from `@/lib/store`; keep shared-package platform behavior behind its adapters.
- Keep access tokens memory-only; use the mobile secure refresh-token adapter. IDs are strings. No `any`.
- Match the web product's design: inspect `nicoflow-frontend/src/components/ui/` and `src/index.css`, then preserve spacing, sizing, shadows, states, color tokens, copy, accessibility, and RTL behavior in mobile equivalents.
- Controls need accessible roles/labels and keyboard/screen-reader paths in addition to gestures. Respect reduced-motion preferences.
- `@testing-library/react-native` v14 APIs such as `render` and `fireEvent` are async; await them. Use `msw/native`, not `msw/node`.
- Avoid new native dependencies without checking current Expo compatibility and Context7 documentation.

## TDD and verification

Add a failing Jest test first, run it to establish failure, implement the smallest change, and refactor. Cover pure date/state helpers, component interactions, pending/error paths, Pro gating, timezone boundaries, and accessibility as relevant. Automated tests do not replace required device evidence for native release claims.

```sh
npm run type-check
npm run lint
npm test
```

CI uses `npm install` rather than strict `npm ci` because optional platform-specific wasm dependencies can cause lockfile drift; see `.github/workflows/ci.yml`.

## Workflow

Branches use `<type>/NIC-<ticket>-<short-desc>`, normally from `staging`; PRs target `staging`. `hotfix/*` starts at and targets `main`. Check actual Git state before branching. Current SDK versions and native API usage should be verified with Context7.
