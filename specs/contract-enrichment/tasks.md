# Tasks — contract-enrichment (nicoflow-mobile)

Fix this app's call sites wherever the shared types were wrong. Nothing here
starts until `nicoflow-shared` has published its corrected types.

38 files import the hand-written interfaces.

**No alias shims, no casts.** If `tsc` complains, the call site is wrong — fix
it. Never `as`, never re-declare the interface locally.

Mobile currently lags `@nicoflow/shared` (`^0.10.4` while the frontend is on
`^0.11.0`), so the first task is a bump. Expect the enum narrowing to surface
comparisons against values that were never valid — that is a bug being found,
not a migration problem.

After each: `pnpm type-check && npx jest <path>`.

RNTL v14 `fireEvent` is async — an unawaited press silently no-ops and the test
passes for the wrong reason. If a test starts failing during migration, check
that before assuming the types are wrong.

## Planned

- [ ] Bump @nicoflow/shared from ^0.10.4 to the version carrying the corrected types and confirm the app still compiles before any call-site work [ac:AC9] [files:package.json] [verify:pnpm install && pnpm type-check]

- [ ] Fix the TimeSpread feature (10 files) against the corrected task types [ac:AC9] [files:src/features/TimeSpread] [verify:pnpm type-check && npx jest src/features/TimeSpread]

- [ ] Fix the Inbox feature (7 files) [ac:AC9] [files:src/features/Inbox] [verify:pnpm type-check && npx jest src/features/Inbox]

- [ ] Fix the Areas feature (7 files) [ac:AC9] [files:src/features/Areas] [verify:pnpm type-check && npx jest src/features/Areas]

- [ ] Fix the Project feature including its tasks and notes subtrees (11 files) [ac:AC9] [files:src/features/Project] [verify:pnpm type-check && npx jest src/features/Project]

- [ ] Fix the Notes feature and the store (3 files) [ac:AC9] [files:src/features/Notes,src/lib/store] [verify:pnpm type-check && npx jest src/features/Notes]

- [ ] Full sweep: no local re-declaration of a shared type remains, and no `as` cast was introduced to satisfy the compiler [ac:AC8,AC9] [verify:pnpm type-check && pnpm lint && pnpm test && ! grep -rqE "\b(ITask|IProject|IArea|IBucket|INote|IHabit|ISubtask)\b" src/]

## Discovered

_(the loop appends here — never reorder or delete the planned list above)_
