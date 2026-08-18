# nicoflow-mobile Design System — Component Library Rebuild

Status: **Approved, not yet started.** Decided via a `/grill-me` session on 2026-08-17 after two rounds of ad-hoc styling fixes on the auth screens (color tokens, then shadow/height parity) still looked visibly wrong next to web. Root cause: patching individual components against web screenshots doesn't converge — the fix is a real component library built once, matching web's shadcn architecture, not per-screen guesswork.

Source of truth for "what web looks like": `nicoflow-frontend/src/components/ui/*.tsx` (24 shadcn primitives) and `nicoflow-frontend/src/index.css` (`@theme` block — Tailwind v4 CSS-first config, no separate `tailwind.config.js` on web).

---

## 1. Architecture

**Headless primitives + hand-built styled wrappers** — the same architecture as web's shadcn/ui (Radix primitives + Tailwind classes you own), not a pre-styled component library (Paper/Tamagui/Gluestack) and not continued ad-hoc `StyleSheet` patching.

Why: web's whole design system is "unstyled behavior primitive + our own styling on top." Mirroring that architecture — not just the visual output — is what makes future parity maintainable. A pre-styled library would fight us on pixel-matching; continued hand-rolling is what got us here.

## 2. Styling mechanism: NativeWind

Tailwind classes compiled to RN styles via NativeWind. `tailwind.config.js` becomes the single source of truth for color/radius/shadow/spacing tokens — ported from web's `index.css` `@theme` block. `src/constants/theme.ts`'s `Colors`/`Shadows`/`Spacing` objects are retired once the config lands (Stage 1); nothing should read from `theme.ts` after that.

Why: lets primitive components use `cva` (class-variance-authority) variant definitions structurally close to web's actual `button.tsx`/`input.tsx` source — reading web's variant *shape* and adapting it, not reinventing a parallel variant system by hand each time. Real pipeline cost (babel plugin, metro config) accepted deliberately for that payoff.

## 3. Theming

System-driven default (`useColorScheme()`), **plus** an explicit in-app toggle matching web's `ModeToggle` — built in Stage 5, not deferred. Both reference screenshots that motivated this rebuild were dark mode; dark must be a first-class, correctly-tokenized mode from the start, not a token afterthought.

## 4. Primitive inventory (all 24, ported from web)

Every primitive in `nicoflow-frontend/src/components/ui/` gets a mobile equivalent. Three don't map 1:1 and have explicit RN-specific decisions:

| Web primitive | Mobile treatment |
|---|---|
| `alert.tsx` | Direct port — static inline banner, no animation beyond standard entrance |
| `alert-dialog.tsx` | **Consolidated** — semantic wrapper over the shared `@gorhom/bottom-sheet` foundation (locked height, destructive/cancel button pair), not a separate overlay system |
| `avatar.tsx` | Direct port |
| `badge.tsx` | Direct port |
| `button.tsx` | Direct port — `cva` variants adapted from web's variant names/shape |
| `calendar.tsx` | Direct port — no consumer yet, build generically |
| `card.tsx` | Direct port |
| `checkbox.tsx` | Direct port — check-mark draw-in animation (§6) |
| `collapsible.tsx` | Direct port |
| `command.tsx` | **Not a literal port** — no ⌘K keyboard-shortcut culture on mobile. Becomes a full-screen (or top-sheet) search-as-you-type modal, same underlying search/filter logic, mobile-native interaction shell |
| `dialog.tsx` | **Consolidated** — semantic wrapper over `@gorhom/bottom-sheet`, same as AlertDialog. Centered-overlay modals feel foreign on mobile; bottom sheets are the native iOS/Android convention |
| `dropdown-menu.tsx` | Direct port — likely also sheet-based on mobile (small footprint dropdowns don't have a great native mobile equivalent), decide precisely when Stage 4 reaches it |
| `form.tsx` | Direct port — react-hook-form integration wrapper, mostly logic not visual |
| `input.tsx` | Direct port — **floating label** (§6), focus ring, error state |
| `label.tsx` | Direct port |
| `popover.tsx` | Direct port — likely sheet-based or anchored small overlay, decide in Stage 4 |
| `select.tsx` | Direct port — likely bottom-sheet picker on mobile (native convention), decide in Stage 4 |
| `separator.tsx` | Direct port |
| `sheet.tsx` | **Foundation primitive** — built on `@gorhom/bottom-sheet` directly; `Dialog`/`AlertDialog` build on top of this, not the other way around |
| `sidebar.tsx` | **Dropped.** Mobile has no desktop nav-rail equivalent — bottom tab bar is architecturally different, not a missing primitive. See §5 |
| `skeleton.tsx` | Direct port |
| `switch.tsx` | Direct port — track color transition (§6) |
| `tabs.tsx` | Direct port |
| `textarea.tsx` | Direct port |
| `tooltip.tsx` | Direct port — mobile has no hover state; likely long-press-triggered, decide in Stage 4 |

`expandable-text.tsx` (in `src/components/`, not `ui/`, but same tier of shared component) also ported alongside.

## 5. Navigation shell

Bottom tab bar is **not a port of web's Sidebar** — it's a custom, purpose-built mobile nav component, explicitly designed to be **more interactive than web's static rail**: a sliding/morphing active-tab indicator (not a static highlight), built in Stage 5 alongside the theme toggle.

## 6. Animation spec

Driven by `react-native-reanimated` + `react-native-gesture-handler` (both already present as Expo template deps; `@gorhom/bottom-sheet` also requires them as peers — no new core dependency for this).

Concrete bar, not "make it nice":

- **Input (floating label)**: label animates from placeholder-position to shrunk/raised position on focus or has-value; border/ring color transitions on focus; error state shakes or color-transitions on validation failure.
- **Button**: press-scale/opacity feedback via `Pressable` + reanimated spring; loading-state spinner cross-fades in/out.
- **Checkbox/Switch**: check-mark draw-in animation; track color transition.
- **Sheet/Dialog/AlertDialog**: spring-based open/close (gorhom default), backdrop fade.
- **Bottom nav**: active-tab indicator slides/morphs between tabs on selection, not a static highlight swap.

## 7. File structure

`src/components/ui/<name>.tsx` — mirrors web's naming and layout exactly, plus an `index.ts` barrel.

Existing `Auth*` components (`auth-button.tsx`, `auth-card.tsx`, `auth-text-field.tsx`) are **migrated onto the new primitives in Stage 6**, then retired — not kept as a parallel system. Auth screens are the first real consumer used to validate the primitive library actually works end-to-end.

## 8. Staged PR plan

Each stage is an independent, reviewable, revertable PR. Order is dependency-driven — later stages assume earlier ones are merged.

1. **NativeWind pipeline** — babel plugin, metro config, `tailwind.config.js` ported from web's `index.css` `@theme` block. Retire `src/constants/theme.ts`'s color/shadow/spacing objects.
2. **`@gorhom/bottom-sheet` foundation** — install, base `Sheet` primitive, `Dialog`/`AlertDialog` semantic wrappers on top.
3. **Core primitives batch** — Button, Input (floating label), Checkbox, Switch, Card, Badge, Avatar, Separator, Label. (These are the ones the auth screens and most early screens actually need.)
4. **Remaining primitives batch** — Select, Tabs, Tooltip, Popover, DropdownMenu, Alert, Skeleton, Textarea, Collapsible, ExpandableText, Calendar, Form, search-Command. Mobile-specific interaction decisions (popover/tooltip/select/dropdown mobile patterns) get made concretely here, not speculatively in this doc.
5. **Bottom-nav shell redesign + theme toggle** — sliding active-tab indicator, `ModeToggle` equivalent.
6. **Auth screens migrated** onto the new primitives; old `Auth*` components retired.

## 9. Explicitly out of scope for this effort

- Rebuilding any screen beyond auth (Time Spread, Areas, Calendar, Focus, AI chat, Settings, Notifications, etc.) — those are separate follow-up tickets once the primitive library exists.
- A literal ⌘K command palette — see `command.tsx` treatment above.
- Matching any specific third-party app's motion language — the animation spec in §6 is the bar, not an external reference.
