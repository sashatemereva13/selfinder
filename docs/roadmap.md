# Roadmap — scoped future work

Tasks that have been discussed and scoped, but deliberately deferred past
the current release. Not a backlog of ideas — only things with a real
scoping conversation behind them. See `RULES.md` for what's currently true;
this file is what's next.

---

## Android cold-start: onboarding's first-launch transition feels slow

**Status:** root-caused, not yet fixed — deliberately deferred, see below.

**The report:** the onboarding intro's line-becomes-ring transition (word
beats → "walk" → line closes into a ring → ring travels to become the
philosopher picker's ring) feels noticeably slow specifically on first-ever
launch on Android, not on iOS, and not on any later visit (onboarding only
ever runs once per install, so "later visit" isn't really a thing here —
confirmed this transition literally cannot be re-triggered without a fresh
install).

**Root cause:** `app/_layout.tsx`'s `RootLayout` blocks ALL rendering
(including hiding the splash screen) until fontsLoaded AND all 7 stores'
`hydrate()` calls resolve (`philosopherStore`, `measureStore`, `authStore`,
`reminderStore`, `engagementStore`, `subscriptionStore`, `localeStore` —
see the `ready` boolean, `_layout.tsx:60-62`). Each store's `hydrate()`
reads from `expo-secure-store`, which on Android is backed by the hardware
Keystore — measurably slower per-call than iOS's Keychain equivalent,
especially on the very first access after install (key
generation/initialization overhead a warm app never pays again). This is a
genuine platform primitive cost, not a bug in any one store's code — each
store already parallelizes its own reads internally via `Promise.all`
where it has more than one key.

**Why this is fixable, not just "Android is slower":** onboarding itself
doesn't read from 6 of those 7 stores at all — it only needs
`philosopherStore` (to decide whether to route to onboarding vs. straight
to tabs). The other 6 stores' data isn't needed until later screens
(Depths, You, Guide, etc.), so gating the very first frame on all 7 is
stricter than the actual dependency requires.

**Recommended fix:** change `RootLayout`'s `ready` gate to only require
`fontsLoaded && philoHydrated` before rendering/hiding the splash screen.
Let the other 6 stores continue hydrating in the background — same
`hydrate()` calls, just not blocking. Screens that read from them
(Depths reads measureStore, You reads subscriptionStore, etc.) already
handle their own store's `hydrated` flag or reasonable default state, so
this shouldn't need per-screen changes, but **verify that assumption
screen-by-screen before shipping** — a screen that assumes hydration
already happened by the time it mounts (rather than checking `hydrated`
itself) would be a real regression risk this change could introduce.

**Why deferred rather than done immediately:** this touches the app's
root loading gate, used by literally every screen, right in the middle of
a Play Store submission — not something to change without dedicated
testing time across the whole app, not just onboarding.

---

## Android release builds ship without R8 code/resource shrinking

**Status:** enabled (2026-08-04). `expo-build-properties` was added and
configured in `app.json`'s plugin list
(`android.enableProguardInReleaseBuilds` /
`enableShrinkResourcesInReleaseBuilds`, both `true`) rather than editing
`mobile/android/app/build.gradle` or `gradle.properties` directly —
`expo prebuild` regenerates the whole `android/` directory from `app.json`
on every EAS build (local or cloud), so a hand-edit to the generated
Gradle files would silently get overwritten on the next build. This was
prompted by Play Console flagging "no deobfuscation file associated with
this App Bundle" on a closed-testing upload.

`proguard-rules.pro` already has a keep rule for Reanimated
(`-keep class com.swmansion.reanimated.** { *; }`,
`com.facebook.react.turbomodule.**`), which reduces (but doesn't
eliminate) the usual risk of minification breaking reflection-based
native modules — **a fresh full regression pass across the app is still
needed** (not yet done as of this writing), not just a smoke test, since a
missing keep rule for some other native dependency would surface as a
runtime crash only in the minified build, never in debug. Confirmed the
change alone doesn't break the release build itself (a full local
`eas build --platform android --profile production --local` succeeded
with it enabled), but that's not the same as a real regression pass
through the app's actual screens/flows on a minified build.

---

## Tablet/rotation support

**Status:** done. `app.json`'s `orientation: "portrait"` lock and
`ios.supportsTablet: false` are removed — the app now rotates and gets a
real iPad window instead of letterboxed compatibility mode. A new
`src/theme/responsive.ts` (`useReadingColumnWidth`, capped at 640px) caps
the text/content column on Guide, Depths, You, and onboarding so
paragraphs, chat bubbles, and buttons don't stretch to uncomfortable
widths on a wide/landscape canvas.

**Deliberate, permanent decision (not a placeholder):** `app/onboarding/
index.tsx` and `src/components/PhilosopherPicker.tsx`'s SVG/ring geometry
(onboarding's `LAYOUT_SIZE`/`LINE_WIDTH`/`FIGURE_SIZE`/`V_RING_RADIUS`;
PhilosopherPicker's `CONTAINER = {320,283}`/`RING_RADIUS = 80`) stays the
same fixed pixel size on every device, phone or tablet — this was
evaluated and explicitly chosen over scaling it up, since research on
hero-illustration scaling confirmed a 1:1-with-screen-width scale reads as
oversized/cartoonish, and this composition's math is tightly choreographed
(word-beat timing, line-draw animation, and a measured cross-screen ring
morph into PhilosopherPicker) — rescaling it would have meant moving all
of that math from module-load-time constants to live render-time
calculations, a large, risky rewrite for a purely cosmetic gain. Instead,
only what's genuinely improved by extra tablet width was addressed: the
payoff text, the "walk" button, the picker's description text, and its
confirm button no longer stretch full-bleed — they cap at the same 640px
reading column as every other screen, so the space around the
(unchanged-size) ring reads as an intentional frame rather than a phone
layout with leftover margins. Verified on a real native-resolution
2560×1600 tablet (Nexus 10 AVD — chosen specifically over `wm size`
overrides, which upscale a lower native resolution and produce visibly
blurry text/art; a genuine hardware-matching profile was needed to confirm
this was actually sharp, not just correctly sized).

If a future session wants the ring/figure to visually grow on tablets too
(not just its surroundings), that's a separate, larger effort: moving
onboarding's path math from module-scope constants to a `useWindowDimensions`-
driven calculation at render time (there is no existing precedent for this in
the codebase — confirmed zero uses of the live-updating hook anywhere;
`MessageCard.tsx`'s one `Dimensions.get('screen')` call is static, not
reactive), re-deriving `ringPoint()` and the line paths from scaled radii,
and re-verifying the cross-screen ring-morph handoff still lines up at
every scale. Not currently planned — the user explicitly decided the fixed
size is fine and any future large-screen enhancement should come from
"enlarging other details or adding something later," not scaling this
specific composition.

---

## Multi-language support (Russian, French, ...)

**Status:** in progress. English + Russian UI-string extraction is well
underway (see `mobile/src/i18n/` — most screens' chrome is translated;
content-file translation and the AI-directive work are separate,
not-yet-started tracks). For the full implementation-level plan (file/line
detail, decisions made), see **[`docs/i18n-plan.md`](i18n-plan.md)**.

**Russian-only full rebrand (2026-08-04):** the Russian build now uses a
genuinely Russian product identity, not just translated UI chrome around
English feature names — this was a deliberate decision driven by Russia's
consumer-information-in-Russian requirement taking effect 2026-03-01 (info
on apps/sites/ads must be in Russian; a registered trademark is exempt, but
feature names aren't). English stays the main/default version, unaffected.

| English | Russian |
|---|---|
| Selfinder (wordmark) | НАЙТИСЬ |
| Measure | Где я |
| Tune In | Резонанс |
| Spill | Поток |
| Guide | Проводник |
| Selfinder+ | НАЙТИСЬ+ |
| Depths / Levels / Your Arc / Breathing | Глубины / Уровни / Ваша траектория / Дыхание (already were) |

Implementation: `common.wordmark` i18n key (was hardcoded `Selfinder` text
in `onboarding/index.tsx`); tab bar titles (`_layout.tsx`) were hardcoded
English strings not wired to i18n at all — now `common.tabDepths/tabGuide/
tabYou`; `moonConfig.ts`'s `TOOLS` labels changed from a hardcoded string to
an i18n key (`labelKey`) resolved at render time, since that file has no
access to `useTranslation`. The Tune In lock-screen media label
(`tuneIn.lockScreenArtist`) was also hardcoded English and is now
locale-aware.

**Known gaps deliberately left alone, not silently expanded into** (scope
was "fix labels," not "translate everything"): `guideNudges.ts` (all five
philosophers' nudge text is English-only, no i18n mechanism in the file at
all — translating only `actionLabel` would leave Russian buttons next to
English body text, worse than leaving both English) and `moonConfig.ts`'s
reflection paragraphs (labels fixed, the actual "Your last reading
pointed to..." body text is still English). Each of these needs its own
translation pass, not a rename-scoped touch-up.

**The AI conversation itself has no Russian support at all — this is a
separate, not-yet-started track, and does NOT use Qwen.** The backend
(`backend/controllers/chatController.js`) calls **Groq** exclusively —
`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768` —
there is no Qwen integration anywhere in this codebase. Every system
prompt (`philosophers.ts`'s hand-authored per-philosopher voice,
`universalAIrules.js`) is English-only, and nothing instructs the model to
respond in Russian based on the app's locale — confirmed via grep, zero
language/locale directives anywhere in the prompt-construction code. A
Russian-speaking user typing Russian today gets whatever Llama does with
that on its own (likely a Russian reply, since these models are
multilingual) — that's emergent, not a supported feature, and the
philosopher's own scripted/hardcoded lines (opening greeting, badge
comments, nudges) stay English regardless of what the model itself does.
Building real support means at minimum: passing the active locale into
`sendMessage`/`sendMeasureExchange` and appending an explicit
"respond in Russian" instruction to the system prompt when set, deciding
whether Groq's Llama models are good enough at Russian or whether a
different provider/model is needed for that locale specifically, and
translating the hardcoded scripted-line files above so the non-AI parts
of a Russian conversation don't revert to English mid-flow.

---

## Web frontend redesign — bring the web app in line with mobile

**Status:** scoped at a survey level, not planned in detail. Deferred —
large enough to need its own dedicated planning pass before starting.

**Why now:** mobile went through a full visual overhaul (warm ivory
accent, `AmbientGlow`, no cards, ring/wireframe visualizations, one
typeface — see `docs/design/aesthetic.md`) and the web frontend never
followed. A full-codebase survey (2026-08-02) found the gap is real and
systemic, not cosmetic — see findings below.

**Decided:** the web app's 3D scenes (react-three-fiber philosopher
crystal picker, starfields, nebula backgrounds, the 3D lunar calendar)
are **not** being flattened to match mobile's flat SVG/wireframe
language. This is a deliberate call: the web experience exists partly
*because* it can do things mobile can't — "the whole web experience
exists for the 2D to come more alive." The 3D language stays and should
lean further into being impressive, not get retired for consistency's
sake. Any future palette/typography work on these scenes should recolor
toward the warm ivory language, not restructure the rendering approach.

**What the survey found** (full detail in the 2026-08-02 investigation,
not reproduced here — re-run a fresh survey before actually planning,
since this file will drift):

1. **Color palette** — still the old retired cool palette (the lavender-
   gray `rgba(241,234,253,...)` scale, `#c399ff`/`#74ddd6`-family hexes)
   baked into `frontend/src/css/selfinder-system.css`'s CSS variable
   layer (`--sf-accent-violet`, `--sf-accent-cyan`), not just stray
   leftovers — ~139 occurrences across ~21 files. No ivory token exists
   anywhere on web yet. This is the first thing any future pass should
   fix, since most components inherit from these shared variables.
2. **Typography** — Panchang is already in use on web, so no font
   migration needed there (unlike mobile, which separately moved off
   Panchang to Etude Noire for Cyrillic support — see the font-swap
   commits around 2026-08-02 and decide whether web should follow that
   change too, since web's Panchang usage would have the same
   zero-Cyrillic-glyph problem if web ever needs Russian support).
   Usage is inconsistent (some files hardcode the font-family string,
   one file — `FeelingLuckyButton.css` — mixes in a third typeface,
   `Quintessential`) — a mechanical, low-risk cleanup.
3. **Cards** — real bordered/filled "card" patterns are a default layout
   choice on web (`.authCard`, `.measure-optionCard`,
   `.moonMetricCard`/`.moonSelfinderCard`, `LevelCard.jsx`,
   `PersonalSpace.jsx`, `LocalDataRecord.jsx`), contrary to mobile's "no
   cards" rule. Removing these means real component restructuring on
   `PersonalSpace`, `Measure`, `LunarCalendar`, and auth pages, not a
   style tweak — this is "structural rebuild," not "retheme," work.
4. **Background** — no single consistent treatment (mobile's
   `AmbientGlow` equivalent doesn't exist on web); every major surface
   runs its own bespoke background (3D scenes on FrontPage/Luna/Measure,
   flat CSS gradients elsewhere). Given the "keep 3D" decision above,
   this item is really about the *non-3D* pages picking one consistent
   warm background treatment, not collapsing everything to one thing.
5. **Missing features** — Spill (free-write) and Breathing don't exist
   on web at all. This is new product work, not a redesign item, and
   should probably be scoped/built separately from the visual pass.
6. **No shared Button/Input components exist** — buttons/inputs are
   styled per-page. A redesign pass will likely need to introduce these
   as real shared primitives rather than retheme N per-page copies.

**Recommended shape for when this gets picked up:** split into phases
rather than one pass — (1) color token + typography cleanup across
`selfinder-system.css` and per-file overrides, likely fast and low-risk;
(2) card removal / structural cleanup on `PersonalSpace`, `Measure`,
`LunarCalendar`, auth, one page at a time; (3) Spill + Breathing as new
routes, built to match mobile's product behavior; (4) 3D scenes get a
palette pass only, kept structurally as-is per the decision above. Don't
attempt this as a single big-bang PR — the surface area (12+ routed
pages, 3D scenes, no existing shared primitives) is too large for that to
go well.
