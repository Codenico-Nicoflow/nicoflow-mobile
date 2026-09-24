# E-058 Calendar release evidence

This record maps NIC-2013 to the approved E-058 QA matrix. A row is only marked **Pass** when the named layer was actually exercised. Missing native infrastructure or physical-device evidence remains an explicit release blocker; simulator inspection is not accepted as a substitute.

## Build under review

- Stack: NIC-2007 through NIC-2013
- Calendar implementation PRs: #77, #78, #79, #80, #81, #82
- API contract: existing ranged task query and task PATCH; no new endpoint or migration
- Automated native layer: Jest + jest-expo + React Native Testing Library

## Acceptance evidence

| NIC-2013 AC            | QA cases | Evidence                                                                                                                                                                                                                                                                                             | Status                                          |
| ---------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| AC1 drag persistence   | Q31      | Unit/integration coverage exists for date-only move payload, recurring lock and Calendar rendering. Native long-press drag plus relaunch persistence requires the E-059 Maestro runner, seeded Pro account and release builds.                                                                       | **Blocked — E-059 assets absent**               |
| AC2 resize persistence | Q32      | `CalendarDurationEditor.test.tsx` covers drag result handling, explicit save, validation, clamp behavior and screen-reader adjustable actions. Native gesture plus refetch persistence requires the E-059 Maestro runner and seeded timed task.                                                      | **Blocked — E-059 assets absent**               |
| AC3 native usability   | Q33, Q69 | Controls expose roles/labels; non-gesture Move and numeric duration paths exist; Hebrew strings and RTL-capable layout are present; free teaser hides real data from the accessibility tree. VoiceOver, TalkBack, large-text and reduced-motion checks still require iOS and Android release builds. | **Blocked — device evidence required**          |
| AC4 performance        | Q34, Q70 | Fixture definition: 100 tasks over 42 dates, including one 20-task day. Profile month swipe, day-sheet scroll, drag and resize in a release build and attach frame traces.                                                                                                                           | **Blocked — no named physical device or trace** |
| AC5 traceability       | Q35      | In-repo type-check, strict lint and all 70 executed Jest suites are green; focused Calendar suite is green. Maestro CI, supported-platform device checks and physical-device frame traces are not available in this repository.                                                                      | **Blocked by AC1–AC4 evidence**                 |

## Required E-059 handoff

E-059 must supply all of the following before this story can be released:

1. A repository-owned Maestro runner and CI job for iOS and Android release builds.
2. Disposable free and Pro accounts with deterministic reset/seed support.
3. Stable task fixtures with string IDs, including an ordinary timed task and the dense-month fixture.
4. A documented way for Maestro to authenticate without storing production credentials.
5. Artifact upload for screenshots, logs, device/OS/build metadata and performance traces.

Once those assets exist, implement and run exactly two critical Maestro flows: long-press drag with relaunch/refetch assertion, and duration-handle resize with refetch assertion. Do not replace the native gestures by calling mutation handlers directly.

## Physical-device run sheet

Record one row per platform and attach the artifact URL.

| Platform | Device  | OS      | Release build | VoiceOver/TalkBack | RTL     | Large text | Reduced motion | 60fps trace | Artifact |
| -------- | ------- | ------- | ------------- | ------------------ | ------- | ---------- | -------------- | ----------- | -------- |
| iOS      | Pending | Pending | Pending       | Pending            | Pending | Pending    | Pending        | Pending     | Pending  |
| Android  | Pending | Pending | Pending       | Pending            | Pending | Pending    | Pending        | Pending     | Pending  |

The story remains a release blocker until these rows contain real-device evidence or the product owner explicitly accepts a documented target miss.
