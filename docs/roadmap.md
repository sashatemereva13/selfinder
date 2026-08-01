# Roadmap — scoped future work

Tasks that have been discussed and scoped, but deliberately deferred past
the current release. Not a backlog of ideas — only things with a real
scoping conversation behind them. See `RULES.md` for what's currently true;
this file is what's next.

---

## Multi-language support (Russian, French, ...)

**Status:** scoped, not started. Deferred past v1 (English-only) submission.
For Russian specifically, a full implementation-level plan (real file/line
detail, not just cost estimates) now exists at
**[`docs/i18n-plan.md`](i18n-plan.md)** — read that before starting; it
supersedes some of the estimates below (e.g. the real UI-string count is
~250 sites across ~20 files, not just "a few days").

**What exists today:** nothing. No i18n library, no locale state, no
`app.json` locale config — this is a from-scratch build, not a config flag.

**Two distinct kinds of work:**

1. **UI strings** (buttons, labels, screen copy) — mechanical. Pick a
   library (`i18next`/`react-i18next` is the standard RN choice), extract
   ~17 screens' worth of inline `<Text>` strings into translation files.
   Bounded, normal engineering — roughly a few days once the library is
   wired in.

2. **Content translation — the real cost.** ~26,000 words total across
   `src/content/`:
   - `philosophers.ts` (~2,880 words) — the highest-stakes: five
     hand-written philosopher voices, each with a long AI system prompt.
     Per `RULES.md`, this authored specificity is explicitly the product's
     moat ("a vaguer or more generic prompt measurably produces worse
     conversations"). Machine translation risks flattening exactly what
     differentiates the app — this needs quality, in-character
     translation, not string-table translation.
   - `levelsContent.ts` (~13,800 words) — literary prose, larger than
     philosophers.ts.
   - Remaining ~9,000 words spread across `feelingLuckyList.json`,
     `guideNudges.ts`, `moonConfig.ts`, `breathingPatterns.ts`,
     `measureConfig.ts`, `tuneInStates.ts`, `auraLevelImages.ts`.

**The part that's easy to miss: the live AI conversation.** Guide and
Measure's interview are real-time Groq calls (`src/api/chat.ts`), not
static text. Translating `philosophers.ts` alone doesn't make the
philosopher *reply* in the target language — the app needs to:
- Store the user's chosen language (new state — no existing store
  tracks locale; would need a new store or a field on an existing one).
- Inject an explicit "respond in [language]" instruction into every
  request built in `chat.ts` (`sendMessage` and `sendMeasureExchange`,
  where `systemPrompt`/`additionalContext` is assembled before the
  `request()` call).

Both pieces are needed together: the explicit instruction is what
actually keeps the model from falling back to English or code-switching
mid-conversation, but it only reads well if the underlying persona prompt
is also well-translated — otherwise the model is improvising a
Russian/French-speaking philosopher from an English character sheet,
which drifts from the authored voice.

**Recommendation when this gets picked up:** the engineering (i18n
library, locale store, string extraction, language directive in
`chat.ts`) is a boundable, moderate task. The philosopher-voice
translation is the real risk and cost — treat it as requiring a
translator who can preserve tone and character, not a mechanical
translation pass, given how central authored voice is to the product
(see `RULES.md`, Content/voice section).

---

## Crash / diagnostics reporting

**Status:** scoped, not started. Deferred past v1 submission.

**What exists today:** nothing. Confirmed via a full mobile-app audit (see
the privacy-policy verification pass, 2026-07-30) — no Sentry, Bugsnag,
Crashlytics, or any crash/diagnostics SDK anywhere in `mobile/`. Zero
visibility into crashes once the app is in users' hands beyond what they
self-report.

**Why it's worth doing:** real blind spot once real users are on the app
— a crash a reviewer or early user hits and doesn't report is currently
invisible. Standard tooling (Sentry is the usual Expo/React Native
choice) would close this.

**Why it's not a quick add — the actual tradeoff:**
- `RULES.md` states "first-party analytics only... privacy is the trust
  layer the whole pitch leans on" (see Engineering conventions and
  Product/positioning sections). Sentry-as-a-service is a **third
  party** — adding it makes "we don't use... third-party analytics" in
  the privacy policy (`frontend/src/auth/PrivacyPolicyContent.jsx`)
  false the moment it ships, requiring a new disclosed data flow (device
  info, stack traces, sometimes IP) to a named vendor.
- Crash stack traces can inadvertently capture more than intended — a
  trace touching `guideChatStore`/`authStore` state could in principle
  surface fragments of conversation content or tokens if not carefully
  scrubbed before reporting, which cuts against the "anything you say to
  your guide [is] sensitive personal data" commitment.
- A self-hosted option (Sentry self-hosted, or GlitchTip as a lighter
  Sentry-compatible self-hosted alternative) would preserve the
  first-party-only claim, at the cost of standing up and maintaining
  another service.

**When this gets picked up:** decide third-party-hosted vs. self-hosted
explicitly before adding anything — this is a privacy-positioning
decision, not a routine dependency add (same standing rule `RULES.md`
already states for analytics SDKs generally). Whichever is chosen, the
privacy policy needs a corresponding update in the same change, not
after.
