# Russian language support — implementation plan

Supersedes the scoping note in `roadmap.md`'s "Multi-language support"
section with real implementation detail, based on a full code audit
(2026-08-01). Read `roadmap.md` first for the original cost/scope framing
(still accurate); this file is the *how*, not just the *how much*.

**Historical note (2026-08-15):** the English-locale model referenced
below, `llama-3.3-70b-versatile`, was decommissioned by Groq on
2026-08-16 and `models[0]` now points at `openai/gpt-oss-120b` instead
(see `chatController.js`/`crossingController.js`). The locale-routing
decision and reasoning below are otherwise still accurate — only the
specific English-side model name is stale.

**Target behavior** (per the product requirement): the app defaults to
whatever language the user's phone is set to (Russian phone → Russian app
on first launch), and the user can independently override that with an
in-account toggle between Russian and English at any time. The override
persists across sessions and isn't tied to being logged in.

---

## 0a. Model choice: the current Llama model isn't a good fit for Russian

`backend/controllers/chatController.js:17-21` defines the model list:

```js
const models = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
];
```

`models[0]` (`llama-3.3-70b-versatile`) is what every philosopher-facing
call actually uses (`postBadgeComment`, `postJourneyLine`,
`requestCombinationMessage` all pass `models[0]`, per the grep in the
earlier audit) — and **Meta's own official documentation for Llama 3.3
does not list Russian** among its supported/optimized languages
(English, German, French, Italian, Portuguese, Hindi, Spanish, Thai
are the eight listed). It can often still produce Russian output, but
not as a trained target — for a product whose entire differentiator is
authored voice quality (`RULES.md`, Content/voice section), "often
still works" isn't the bar.

**This is not a reason to switch away from Groq.** Groq is an inference
host, not a model — it hosts multiple model families, and one of them
(Qwen, from Alibaba) is trained with strong multilingual coverage
including Russian as a genuine first-class target, unlike Llama 3.3.
Groq's own current model list includes `qwen/qwen3.6-27b` (confirmed
via Groq's migration guidance as of their June 2026 deprecation notice
for the older `qwen3-32b` — **re-verify the exact current model ID
against Groq's live console before implementing**, model availability
and naming changes over time and this wasn't confirmed against a live
API call).

**Decided:** locale-conditional model routing, not a universal swap.
English stays on `llama-3.3-70b-versatile` (already working well,
Llama is an officially-supported-language fit for English). Russian
routes to a Qwen model — the user has direct prior experience with
Qwen and rates it highly, so this isn't just a documentation-based bet.
French (when that track starts later) gets its own model decision at
that time, evaluated the same way — don't assume Qwen is automatically
the right choice for every future language; each non-English locale's
model choice should be a deliberate pick, not inherited by default.

Concretely: `models[0]` in `chatController.js:17-21` needs to become
locale-aware rather than a single constant — e.g. a small lookup
(`{ en: "llama-3.3-70b-versatile", ru: "qwen/qwen3.6-27b" }`) selected
by the `locale` field arriving in the request body (see §4), with
English as the fallback for any locale without an explicit entry yet
(covers French until it has its own decision). **Re-verify the exact
current Qwen model ID against Groq's live console before implementing**
— `qwen/qwen3.6-27b` was confirmed via Groq's migration guidance as of
their June 2026 deprecation notice, not a live API call, and model
naming changes over time.

---

## 0. Scope decision needed before starting

The backend has **5 separate Groq call sites** generating user-facing
text, not the 2 the original roadmap scoped:

| Call site | Backend function | Reachable from a locale-aware client call today? |
|---|---|---|
| Guide chat | `postChat` | Yes — via `chat.ts`'s `sendMessage` |
| Measure interview | `postMeasureExchange` | Yes — via `chat.ts`'s `sendMeasureExchange` |
| Philosopher badge one-liners | `postBadgeComment` | **No** — backend-only prompt lookup, no client field for a directive |
| "Journey line" copy | `postJourneyLine` | **No** — same |
| Post-Measure combination message | `requestCombinationMessage` | **No** — same |

**Decided: all five, no exceptions, for every language.** The Russian
(and future French) version of the app is for people who don't
understand English — every string, every AI-generated line, every
locale's version of the app must be entirely in that language. Nothing
stays English-only in a non-English build; there's no "mostly
translated, a few corners still in English" version. This applies to
all five Groq call sites uniformly, and to the ~250 UI string sites in
§3 the same way — full parity per locale, not a partial translation
treated as good enough.

---

## 1. Device locale detection

Install `expo-localization@57.0.1` (matches installed Expo SDK
`~57.0.6`). Use the `useLocales()` hook, not the older single-value
`Localization.locale` string API:

```ts
import { useLocales } from 'expo-localization';

const locales = useLocales();
const deviceLanguageCode = locales[0].languageCode; // "ru" | "en" | ...
```

`useLocales()` over `getLocales()` specifically because it re-renders on
OS locale change while the app is foregrounded — matters on Android
(per Expo's own docs: Android detects locale changes on foreground,
iOS values are constant during runtime, so this mainly buys reactivity
on Android, but costs nothing on iOS).

No `app.json` plugin entry is required for basic `getLocales()`/
`useLocales()` use (no native permission to declare) — confirm this
against the currently-installed package version's own README once
added, since Expo has changed plugin requirements across SDK eras
before (per `mobile/AGENTS.md`'s standing instruction to check exact
versioned docs).

---

## 2. New `localeStore.ts`

None of the 8 existing stores fit. `authStore` looks like the natural
home given "toggle in account settings," but its `AuthSession` is
`null` for a signed-out user and the store doesn't persist anything at
all in that state (`app/(tabs)/you/index.tsx` renders a fully
functional signed-out `AuthForm` — most users will read the app in
Russian without ever creating an account). Folding locale into
`authStore` would mean the preference vanishes on logout, which is
wrong.

New store, same hand-rolled `SecureStore` pattern every other store in
this project already uses (no `persist` middleware anywhere in this
codebase — stay consistent):

```ts
// src/store/localeStore.ts
type Locale = 'en' | 'ru';

interface LocaleStore {
  locale: Locale;
  hydrated: boolean;
  isUserOverride: boolean; // true once the user has explicitly picked one
  hydrate: () => Promise<void>;
  setLocale: (locale: Locale, isOverride: boolean) => Promise<void>;
}
```

- `STORAGE_KEY = 'selfinder_locale'`, single key, matching every other
  store's naming convention (`selfinder_*`).
- `isUserOverride` matters: on first launch, seed `locale` from
  `useLocales()`'s device language (§1) — but if the user has since
  manually chosen a language, a later device-locale change (or app
  update) shouldn't silently override their explicit choice. Store
  both the resolved locale and whether it came from the user or the
  device.
- Hydration order: this store's `hydrate()` needs to run before first
  paint decides what language to render, same pattern `philosopherStore`
  and others already use in `app/_layout.tsx`'s startup sequence —
  check that file for the existing hydrate-on-boot pattern before
  wiring this in, don't invent a new bootstrapping mechanism.

---

## 3. i18n library and string extraction

**Library choice:** `i18next` + `react-i18next` — the standard,
best-supported choice for React Native/Expo, wide ecosystem, works
fine with the `localeStore` above driving which language bundle is
active (no need for its own device-detection plugin since `localeStore`
already owns that decision).

**Real scope** (corrects the roadmap's "a few days" estimate — that
undercounted by measuring screens, not string sites):

- **~250 distinct hardcoded string sites** across `app/` (19 files with
  content) + `src/components/*.tsx`. `AccountSection.tsx` alone is ~58
  sites (49 `<Text>` + 9 `placeholder` props) — by far the largest
  single file, covering the full auth form, account security, and
  data/privacy sections.
- Zero `Alert.alert(...)` calls exist anywhere in the app (confirmed via
  grep) — one less category to extract than a typical RN app.
- Extraction is mechanical but not fast at this volume: budget this as
  its own multi-day pass, not a side effect of adding the library.
  Recommend going file-by-file in descending size order (table in the
  audit had exact per-file counts) so the biggest wins land first and
  the tail of small files can be batched.

**Content translation** — unchanged from `roadmap.md`: ~26,000 words
across `src/content/`, with `philosophers.ts` (~2,880 words) as the
highest-stakes, voice-critical piece needing a real translator rather
than mechanical translation. This is a separate track from the
mechanical UI-string extraction above and can proceed in parallel once
the i18n library is wired in (translated content just becomes another
locale bundle).

---

## 4. Threading the language directive into AI calls

**Client side (`src/api/chat.ts`):**

- `sendMessage` (lines 19–42): currently builds
  `systemPrompt = additionalContext ? \`${philosopher.systemPrompt}\n\n${additionalContext}\` : philosopher.systemPrompt`
  (lines 24–26). Cleanest fix: give `sendMessage` its own `locale`
  parameter and build the directive *inside* this function (not at
  each call site) — e.g. append
  `Respond only in Russian.` when `locale === 'ru'`, so every caller
  gets it automatically rather than needing every call site updated
  individually.
- `sendMeasureExchange` (lines 56–69): currently sends
  `philosopher.systemPrompt` completely raw — no `additionalContext`
  equivalent exists on this function today. Needs a new parameter
  added to the signature, concatenated the same way `sendMessage` does.

**Backend side (`backend/controllers/chatController.js`)** — the
mobile-sent `systemPrompt` is never relayed as-is; the backend always
wraps it:

- `postChat`: `UNIVERSAL_RULES + "\n\n" + systemPrompt + "\n\n" + SPILL_SIGNAL_INSTRUCTION`
  (line 139) — a client-side language directive concatenated into
  `systemPrompt` lands *before* `SPILL_SIGNAL_INSTRUCTION`, which is
  itself English. Verify that instruction's own wording doesn't
  implicitly assume/demonstrate English output in a way that confuses
  the model into reverting — may need `SPILL_SIGNAL_INSTRUCTION` itself
  reviewed once this is live, not assumed fine.
- `postMeasureExchange` (line 365): same
  `UNIVERSAL_RULES + "\n\n" + systemPrompt` pattern, same approach.
- `postBadgeComment`, `postJourneyLine`, `requestCombinationMessage`:
  per §0 (decided: all five call sites, no exceptions), these three
  currently have **no field at all** for a client-sent locale/directive
  — they build their prompts entirely server-side from
  `BADGE_COMMENT_PROMPTS`/`JOURNEY_LINE_PROMPTS` lookups keyed only by
  philosopher ID. Each needs a new `locale` field added to its request
  body and threaded into its own prompt concatenation — small, uniform
  change, repeated 3 times. Same locale-conditional model routing from
  §0a applies here too (Qwen for `ru`, not just for the two originally-
  scoped chat/measure endpoints).

**Testing note:** an LLM's adherence to a "respond in Russian" system
instruction isn't 100% reliable, especially mid-conversation after
several English-context messages accumulate in history. Plan for
actual conversational testing (not just a single-turn smoke test) once
this is wired up — a philosopher persona prompt that's *also* been
translated to Russian (per §3's content-translation track) will hold
the language far more reliably than an English persona + a bolted-on
"respond in Russian" instruction alone. The two tracks (directive +
translated persona) are meant to combine, not substitute for each
other — this was already the right call from the original roadmap
scoping, confirmed still true here.

---

## 5. Date formatting fixes

Three `toLocaleDateString` call sites total, two already locale-aware
by accident and one that actively needs a code change:

- `app/(tabs)/you/your-arc.tsx:26` and `src/utils/relativeTime.ts:21` —
  both already call `toLocaleDateString(undefined, {...})`, which
  defers to device locale automatically. **No code change needed**,
  but verify on-device (not assumed) that Hermes on both iOS and
  Android actually produces correct Russian month names here — modern
  Hermes delegates to the native platform's own locale/ICU data rather
  than shipping its own (to avoid binary bloat), which should work, but
  "should" isn't "confirmed" — put an explicit on-device check for this
  in the test plan before considering this item done.
- `src/components/AccountSection.tsx:14` — **hardcoded to `'en-GB'`**,
  the one genuine bug. Used for consent-granted/withdrawn timestamps
  (line 417) and reading-history dates (line 446). This will NOT
  localize on its own even after everything else ships. Fix: replace
  the hardcoded `'en-GB'` with the locale value from `localeStore`
  (§2), mapped to a real BCP-47 tag (`'ru-RU'`/`'en-GB'` or similar).

---

## 6. UI placement for the language toggle

`app/(tabs)/you/index.tsx` → `src/components/AccountSection.tsx`
already has an established subsection pattern (kicker label + row,
thin-divider separated, no cards — matches `docs/design/aesthetic.md`).
Closest existing analogs: "Account security" (line 474) and "Your data
& privacy" (line 533).

**Decided:** visible to signed-out users too. `AccountSection.tsx`
renders a full `AuthForm` for signed-out users, and most usage doesn't
require an account — gating the toggle behind login would leave the
majority of users with no way to override their device-detected
language. Lift the toggle out of `AccountSection` entirely into its
own small section in `you/index.tsx` (between the philosopher block and
`DailyReminderSection`) so it's never gated behind login, rather than
duplicating it inside both `AuthForm` and `LoggedInAccount` branches.

---

## Suggested build order

1. `localeStore.ts` + `expo-localization` wiring, device-locale
   detection on first launch, manual override persistence (§1, §2).
2. UI toggle in `you/index.tsx`/`AccountSection.tsx`, both signed-in
   and signed-out (§6) — gets the toggle working end-to-end against a
   hardcoded/stub translation before the full extraction pass, so the
   mechanism is provably correct early.
3. i18n library + full UI string extraction (§3) — the largest single
   chunk of raw effort, ~250 sites.
4. `AccountSection.tsx`'s hardcoded `'en-GB'` fix (§5) — small, do it
   in the same pass as #3 since you're already in that file.
5. Content translation track (`src/content/*`, ~26,000 words) — can run
   in parallel with #3 once a translator is engaged; not blocked by
   engineering work.
6. Language directive in `chat.ts` + backend concatenation (§4) — do
   this after #5 has at least `philosophers.ts` translated, since a
   translated persona + directive combo needs the translated persona to
   exist to test properly.
7. Extend to the 3 backend-only Groq call sites per §0's scope
   decision, if included.
8. On-device verification pass: date formatting (§5), full
   conversational testing in Russian (§4's testing note), device-locale
   auto-detect on a real Russian-locale device (not just simulator/
   emulator locale override, which doesn't always match real-device
   behavior exactly).
