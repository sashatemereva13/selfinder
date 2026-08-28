# Selfinder — standing rules

This file is the durable, cross-session rulebook for Selfinder. It's not a
log of what happened (see `collaboration-log.md` for that) — it's what is
currently true and must be followed. Read this before making product,
design, or engineering decisions; if something here conflicts with what a
particular screen or file currently does, the file is the thing that's
wrong, not this document.

Sections are added as rules get established, not written speculatively
ahead of time. A new session should read this file top to bottom before
touching anything — it's the whole shape of the project, not just the
visual layer.

---

## What Selfinder is

A self-reflection app built around dialogue with five philosophers —
Socrates, Marcus Aurelius, Kierkegaard, Camus, Aristotle — each with a
hand-written voice true to what they actually taught (`mobile/src/content/
philosophers.ts`). The core loop: **Measure** (four questions, one per
sphere — body/mind/heart/spirit) produces a reading — where you stand right
now on a 17-level map of emotional states, shame to peace/enlightenment.
Around that core: **Guide** (open conversation with your chosen
philosopher), **Spill** (free-writing, never judged), **Tune In** (sound),
**Breathing**. Every reading adds a point; over time the points draw
**Your Arc** — see `docs/pitch.md` for the full positioning, mechanisms,
and business model, and `docs/pitch-text.md` for the pitch as flowing copy.

**The one-line test that governs every layer, not just visual ones:** does
this still feel like a cosy evening next to a fireplace, or does it start
to feel like a UI/app/product again? Whenever this file and a screen
disagree, distrust the screen — but also distrust a "fix" that solves the
letter of a rule while losing this feeling.

**Never diagnoses, never judges, never implies a state is good or bad.**
This is the single deepest rule in the whole project — it is the reason
the vibration wheel is a closed ring and not a bar, the reason there is no
numeric score shown, the reason Selfinder explicitly isn't therapy (see
`docs/pitch.md`, "Isn't this therapy?"). If a new feature's honest
description requires the words "better," "worse," "should," or "fix,"
that's a signal something is off-brief, not a copy-editing problem.

**The answers are already inside the person — Selfinder never supplies
them, even in the paid tier.** Like Socrates questioning rather than
lecturing, every product in Selfinder — free or paid — is an *experience*
(a question, a sound, a breath, a prompt, a reading revisited) that
creates the conditions for someone to hear their own answer, not a
mechanism that generates that answer for them and hands it over. Tune In
never says anything; it calms the nervous system so the person can hear
themselves underneath the noise. Breathing doesn't interpret; it settles
the body so what was already there becomes audible. Guide questions,
it doesn't conclude. This is a stronger and more specific version of the
anti-diagnosis rule above: it's not just "don't say something is good or
bad," it's "don't say anything about what's inside someone at all — offer
the conditions for them to say it to themselves." Concretely, this means:
  - No feature — including any future paid one — should output a claim
    about the user ("you tend to avoid conflict," "you're calmer than
    last month," "this relationship brings out your anxious side"). If a
    feature's honest description requires the app to state a fact about
    who the user is or how they've changed, that's the app being the
    "teacher who tells you what to do" — off-brief, not a wording issue.
  - Longitudinal/historical features (Your Arc, and its future
    extensions) are the record of experience, not an analysis of it. They
    can show the shape of what happened — points, a line, dates,
    revisiting an old reading in the person's own words — because that's
    just memory, not inference. The moment a feature adds interpretation
    on top of that record ("this pattern means X"), it has crossed from
    holding a mirror to being a teacher. Depth on the paid side comes from
    the record itself getting richer to hold and to return to — the full
    line instead of a slice, better ways back into an old moment, more of
    what was actually said or felt preserved and reachable — never from
    more content (philosophers, sounds) or from the app generating insight
    about the person and asserting it as true. See "History is the
    product" below.
  - This also shapes what data processing is legitimate under GDPR: an
    app that only ever reflects a user's own words back to them (a
    record) is on much firmer ground than one that runs inference over
    accumulated psychological data to produce claims about the user
    (profiling, GDPR Art. 4(4)/Art. 9 territory) — so this rule is a
    product/brand commitment and a real constraint on what the backend
    is allowed to compute, not just a tone note.

---

## UI / Visual

Full spec: **[`docs/design/aesthetic.md`](docs/design/aesthetic.md)** —
read that before any visual/design work on the mobile app. Summary below;
the linked doc has the reasoning and the "what's still open" list.

**The one-line test:** does it still feel like a cosy evening next to a
fireplace, or does it start to feel like a UI again? If the second, it's
wrong regardless of how clean it looks in isolation.

- **One accent color: ivory** (`#efe3cf` / `colors.accent.ivory`) —
  pre-reading and as the level-agnostic fallback everywhere. Once a
  reading exists, the accent becomes that reading's `LEVEL_COLORS` hue —
  this personalization is intentional and should stay; the app becoming
  "yours, colored by your own reading" is the goal, not something to
  minimize.
- **The rule is ONE color per screen, not one color for the whole app.**
  A reading-scoped screen (Depths, a level page) shows exactly that one
  reading's color. The Levels/"map of consciousness" screen is
  the one deliberate exception — it legitimately shows all 17 colors at
  once, because it's a map of the whole territory, not a reading of one
  moment. Never let several different readings' colors compete on one
  screen (that's the actual thing that read as noise) — that's different
  from "no color allowed."
- **Depths' own ring (`VibrationSpectrum` via its `onlySlugs` prop) shows
  only that reading's four sphere colors, not the full 17.** This is a
  second, narrower exception layered on the rule above: Levels/level-
  detail/the arrival spin itself still show all 17 (the shared map stays
  intact everywhere else), but once a reading exists, Depths' ring drops
  to just the four colors that reading actually produced (plus the
  overall-reading marker, which may sit at a fifth, distinct position) —
  the point is for Depths specifically to feel personalized to what this
  one reading contained, not a repeat of the shared 17-level map. Don't
  read this as license to trim the ring elsewhere; it's scoped to Depths.
- **One narrow exception:** `colors.danger` (`#f67474`) for genuinely
  destructive actions only (e.g. delete account).
- **`LEVEL_COLORS`/`AXIS_COLORS` are warmed toward ivory**, not left at
  full saturation — same gradient/hue-family and ordering as before
  (that's real information), just blended toward ivory and desaturated
  so the cool end doesn't clash with the warm background/text around it.
- **No gradient bars, ever, regardless of color.** A left-to-right bar
  implies low↔high ranking no matter what hue it uses — use a closed
  ring instead (`ConsciousnessWheel.tsx`, `VibrationSpectrum.tsx`), which
  has no start/end to rank along.
- **Text is a four-step ivory opacity ladder**
  (`colors.text.primary/secondary/muted/faint`), not a separate gray
  palette. A hardcoded `rgba(241,234,253,...)` or `#c39fff`/`#74ddd6`
  anywhere is a regression to the old cool-toned scale — replace it.
- **One warm, low-center ambient glow** (`<AmbientGlow />`) on every
  screen — not two corner blobs (the old, retired version). Barely
  perceptible; if you can describe it without squinting, it's too strong.
- **One typeface (Panchang).** Hierarchy via size, not weight.
- **Motion gathers, condenses, becomes — never slides or pops.** Causality
  over coincidence. No idle motion without meaning (cut dead time instead
  of padding it with animation).
- **No cards.** No bordered/filled boxes as the default separator — space
  and typography do that job.
- **Never show a bare numeric score next to a level name** — position on
  a ring instead. This is a deliberate anti-judgment rule: Selfinder
  never implies a vibration is good or bad.
- **Explore many named positions by dragging a marker on a ring**, not by
  reading a list of static labels — the ring stays quiet (no text) until
  you're pointing at something. Snap to real positions on release; there
  is no vibration "between" two named levels.
- **A reading lives in exactly one screen: Depths.** There is no separate
  "results"/reveal screen anymore — Measure finishing routes straight back
  to Depths, which owns the aura, the headline, the four wheel rows, the
  conversation transcript, and the next-step actions (Measure again, Talk
  about it). Before this was fixed, reveal and Depths showed nearly
  identical content (the four spheres, the philosopher's combination
  message) and "see the full reading" was a lie — there was no fuller
  version, just a repeat. If a future screen is tempted to show "the
  reading" again, that's the redundancy bug recurring — extend Depths
  instead, or give the new screen a genuinely different job (a record, not
  another mirror).
- **Rows that do different jobs don't share a shelf just because they're
  nearby.** A *reference* (the conversation transcript — what was actually
  said) belongs right against the reading it explains, not down by the
  *next-step actions* (Measure again, Talk about it) — those two
  categories read as one undifferentiated list if stacked together without
  a clear break. When repositioning anything, ask "is this what-is, or
  what-next" before deciding where it sits.
- **A next step earns the same visual weight as its neighbors, not a
  quieter afterthought, if it's meant to be genuinely chosen rather than
  merely available.** "Talk about it" (continuing a conversation about a
  past reading) sits as a full row — label + description, same as "Measure
  again" — specifically because letting someone feel what an ongoing
  conversation is like is a deliberate product goal (the Your Arc seed),
  not an incidental option to bury as a footnote link.

## Product / positioning

Full pitch, mechanisms, and business model: **[`docs/pitch.md`](docs/pitch.md)**
(and **[`docs/pitch-text.md`](docs/pitch-text.md)** for the same content as
flowing copy) — read before writing anything user-facing about what
Selfinder is or why it costs money.

- **Selfinder is fully free right now, for everyone, no gates
  (2026-08-28).** There's no legal entity yet to receive real payment —
  Selfinder is operated by an individual, not a registered business (see
  the privacy policy, `https://selfinder.online/privacy`) — so pretending
  to gate depth behind a "subscription" or "purchase" that can't actually
  be sold would be dishonest, and the free-trial mechanism that used to
  enforce it was actively *deleting* people's own older readings once
  they passed a cap. Both are gone: **Your Arc's full history** (every
  saved reading, not a recent slice) and **every Journey** (Center,
  Control, and the rest as they're built) are available to any signed-in,
  consented user, unconditionally. A Journey is still "bought" in the
  sense that opening one for the first time creates a real
  `journeyPurchases[]` entry (`POST /journeys/purchase`,
  `backend/controllers/journeyController.js`'s `postJourneyPurchase`) —
  that mechanism (session-keying, per-account ownership checks, a fresh
  seed each time) is unchanged and still load-bearing; only what's
  required to *reach* it changed, from an admin-only grant to a
  self-service free one (`source: "free"` in the data, distinct from
  `"manual"`/`"apple"`/`"google"`, so the record itself keeps saying which
  kind of grant it was). **Two things stay true regardless of any of
  this**: the free trial's own original reasoning (a person experiencing
  their own Arc actually forming, rather than an abstract promise of
  future value) doesn't need a cap to be true — it's just how the record
  looks with nothing hidden — and the record must stay exportable and
  deletable per the person's own consent choice regardless of payment
  status, same as always. **This is explicitly reversible, not
  permanent** — `arcSubscription`, `journeyPurchases`'s `manual`/`apple`/
  `google` sources, `grantArcSubscription.js`, `grantJourney.js`, and
  `useJourneyPurchases.ts` all stay in the codebase, unused for gating
  today, specifically so real payment can be turned back on later without
  a rebuild. When a real legal entity and IAP/checkout flow exist, this
  rule should be rewritten again, not left stale — the same fate that
  already happened to an earlier version of this section once (see
  collaboration history around commit `5753a0d7`).
- **Journeys are generated experiences, standalone from Your
  Arc — an open-ended, growing family, not a fixed set.** Every Journey
  is an environment for examining what is happening within the person in
  relation to their external reality — this is the unifying definition
  of the category, and the actual test for whether something pitched as
  "just content" belongs in it at all. A Journey is not content
  Selfinder gives the user — it's a carefully designed sequence of
  questions that takes someone somewhere they probably wouldn't reach by
  asking themselves one question directly; the product is the path to
  an answer, not the answer itself. Full architecture (the four-layer
  design process, the fixed-tree/responsive-questioning split, what
  Selfinder's AI may and may not do inside a Journey, and Control's full
  worked example) lives in **[`docs/journeys-concept.md`](docs/journeys-concept.md)**
  — read that before designing or building any Journey, the same way
  `docs/pitch.md` governs outward-facing positioning. **Center** (the
  light cone + kaleidoscope, spun out of Your Arc's old Cover/Cone
  pages, Selfinder's first Journey) is the only Journey with real
  content today. The next set to build toward,
  framed as the question in the user's own voice rather than a feature
  name (2026-08-23, replacing the earlier placeholder Either/Or/Identity
  entries, which had no worked-through architecture): **Control** ("what
  am I really trying to control?" — the reference implementation, see
  `docs/journeys-concept.md`), **The Choice**, **The Loop**, **Whose
  Voice?**, **The Road Not Taken**, **Letting Go**, **The Mirror**,
  **The Unsaid**, **Becoming**, **The Threshold**, **Possible Selves**,
  **Enough** — named, not yet built, and still not a final fixed list;
  more are expected over time, so nothing about a Journey's
  infrastructure (the `journey` discriminator on `User.journeyPurchases`,
  the Products catalog array, `useJourneyPurchases`) should assume
  exactly this set. **A Journey requires no Your Arc dependency** —
  anyone signed in can open and complete one standalone (2026-08-23:
  reverses the previous day's rule that Center required an active Your
  Arc subscription; that dependency turned out to be the wrong shape for
  the funnel — see the sign-in-incentive note below for what actually
  motivates an account instead).
  **Your Arc's relationship to Journeys is additive, not gatekeeping** —
  a Journey's result stands alone whether or not the person has Your Arc
  history; Your Arc is what would let a Journey's result connect into a
  person's broader longitudinal record over time (the exact connection
  mechanism is future work, not built yet — don't imply it exists in any
  copy).
  **Opened again, not owned once** — each fresh grant of the same Journey
  generates a new, different result from a fresh seed (a grant-scoped
  nonce, see `kaleidoscopeData.ts`'s `seedFromLog` for Center) even
  against completely unchanged history, the same way returning to a
  kaleidoscope and giving it a turn produces a new pattern from the same
  shards. Every past result stays individually browsable, not just the
  latest — someone should be able to look back at an earlier Journey
  result the way they'd look back at a photo, even though it was never
  folded into "the record" Your Arc holds. Center's own content
  constraints (anti-diagnosis — "doesn't tell you who you are, helps you
  notice where you are"; the past cone as the user's own account, never
  raw fact; the future cone holding only the active wish, never a
  forecast; "you are shaping your future," never "the future calls you")
  are unchanged by any of this — they govern content, not payment status.
- **Free core, and now free depth too — never free features, paid
  access, until there's a legal entity to actually sell to.** Measure,
  Guide, Spill, Tune In, Breathing are free for everyone, unconditionally,
  and stay exactly as rich as they are today — free is never made to feel
  incomplete on purpose. Your Arc's full history and every Journey are
  now free too (see the fully-free bullet above), not because the
  underlying value changed but because there's currently no honest way to
  charge for it. Both still stay true to "a gym, not a hospital, never
  gated like therapy" — neither the free core nor the now-free depth
  layers should ever feel incomplete on purpose.
- **How entitlement actually works today.** `useJourneyPurchases.ts`
  checks `User.journeyPurchases`, an array keyed by a `journey`
  discriminator rather than a boolean, since a Journey can be opened
  repeatedly and each result stays browsable on its own
  (`backend/models/User.js` / `backend/controllers/userController.js`).
  A signed-in user with no existing purchase gets one self-granted
  automatically the first time they open a Journey (`POST /journeys/
  purchase`, `source: "free"`) — `control.tsx` does this on mount,
  `center.tsx` does it on tapping "Get Center" (kept as an explicit tap
  there since Center's own teaser copy is part of the experience, not
  just a gate to skip past). `arcSubscription`/`grantArcSubscription.js`
  still exist but gate nothing today — Your Arc's tab always shows the
  full experience regardless (`(tabs)/your-arc/index.tsx`). Never build a
  tap target that looks like it leads to a purchase and doesn't — that
  discipline still stands even though nothing is actually gated right
  now, since a fake "coming soon" dead end is exactly the pattern this
  rule warns against, whichever direction it points.
- **Selfinder needs a real incentive to sign in — not yet designed.**
  Both saving Your Arc history and every Journey depend on being signed
  in, but nothing in the app currently gives someone a reason to create an
  account beyond "so these features work" — a purely functional, not
  felt, motivation. Direction: something in the spirit of belonging/
  membership ("join the club"), not a bare "sign in to continue" prompt.
  This is a noted gap, not designed or built yet — a future session
  should design where it appears, what it says, and how it avoids reading
  as a dark pattern, rather than bolting on a generic prompt.
- **"What makes this a paid app?" is now a future-facing question, not a
  present-tense one — don't let that erode the free experience while it
  waits for an answer.** Everything is free right now, with no live
  payment path (see the fully-free bullet above), but that's a legal/
  business-entity gap, not a decision that depth stops mattering. Keep
  building Your Arc and Journeys with the same care as before — polish,
  a funnel-analytics touchpoint, richer history, a new Journey — the
  seeds of a future paid layer are still worth planting, they just don't
  gate anything yet. A change that makes free content feel already-
  complete with nothing more to want is still worth a second look, same
  as before this pivot.
- **Never diagnose, gate, or imply urgency like a medical or gamified
  app would.** No streaks, no badges, no guilt mechanics, no "you missed a
  day" — this is explicit positioning against wellness-app fatigue (see
  `docs/pitch.md`, "Why now"). A discovery nudge (e.g. "haven't tried
  Levels yet?") is fine because it's informational, not because it creates
  pressure — if a nudge ever starts to read as guilt, it's off-brief.
- **First-party analytics only, stated in the privacy policy — this is
  brand, not just compliance.** In a category where users confess personal
  things, privacy is the trust layer the whole pitch leans on (see
  `docs/pitch.md`, "Moat"). Don't add a third-party analytics/tracking SDK
  without recognizing this is a positioning decision, not a routine
  dependency add.

## Engineering conventions

- **`mobile/` is the sole working copy.** `selfinder-app` (a separate
  directory) is backup only — never sync or commit there.
- **Verify visually before claiming a UI change is done — but web is an
  approximation, not proof.** Use the `run-mobile` skill
  (`mobile/.claude/skills/run-mobile/`): run Expo web headlessly via
  Playwright, screenshot the actual result. Known limits: `expo-secure-
  store` has no web implementation (always null) — screens gated on
  persisted state need a temporary fixture scaffold (`storeResult ??
  {...fixture}`, commented `TEMP VISUAL-VERIFICATION SCAFFOLD — DO NOT
  SHIP`, always reverted and confirmed via `git diff --stat` before
  finishing); Reanimated worklet bugs (missing `'worklet'` directives)
  never surface on web, since web runs everything on one JS thread — only
  an on-device check catches those. Treat a web screenshot as layout/flow
  verification, on-device as the real check, and say so explicitly rather
  than claiming a worklet-touching change is confirmed working.
- **Don't screenshot-verify every small tweak.** The user checks small,
  low-risk visual changes on-device themselves — reserve the full
  fixture-scaffold verification loop for changes with real layout risk or
  ambiguity, not routine style edits.
- **State lives in Zustand stores** (`mobile/src/store/`), one per domain:
  `measureStore` (current/past readings), `philosopherStore` (chosen
  philosopher), `guideChatStore` (conversation), `engagementStore`
  (usage/segmentation signals — recency, vibrational register, discovery
  nudges, upsell counters), `authStore`, `reminderStore`, `spillStore`.
  Add new cross-screen state as a new store rather than threading props or
  reaching into an unrelated store for a loosely-related concern.
- **Message objects sent to the chat API must be stripped to `{role,
  content}` before sending.** Groq's API rejects unknown properties on a
  message object — a client-only field like `suggestSpill` (kept on
  assistant messages for local UI purposes) silently broke every Guide
  conversation after exactly one reply until this was found and fixed in
  `mobile/src/api/chat.ts`. Any new client-only field added to a message
  type must be stripped the same way before it's sent back as history.
- **For a UI-heavy flow change, verify the actual end-to-end path in the
  running app, not just a diff of changed files.** A gap in an unrelated,
  unchanged file (e.g. a screen that was affected by a flow change but
  wasn't itself edited) will not show up in code review of the diff —
  only in actually walking the path. (See `collaboration-log.md`,
  "LevelDetail.jsx gap caught in browser" — this is where that lesson
  came from.)

## Content / voice

- **Two layers, not one replacing the other: philosopher voice (italic),
  then a plain unitalicized clarifying line** when a term needs explaining
  (e.g. "Measure" on first meeting). The philosopher's voice carries the
  feeling; the plain line carries the meaning. Neither layer should have
  to do both jobs alone.
- **Every philosopher has a hand-written, distinct system prompt**
  (`mobile/src/content/philosophers.ts`) true to what they actually
  taught — Socrates questions, Marcus Aurelius writes like a Stoic
  emperor's private notebook, Kierkegaard probes anxiety/choice,
  Camus sits with absurdity, Aristotle moves toward action. This
  authored specificity is explicitly the moat (see `docs/pitch.md`,
  "Moat: Taste") — a vaguer or more generic prompt measurably produces
  worse conversations (see `collaboration-log.md`, Groq integration
  notes) and also erodes the actual product differentiation.
  Never flatten a philosopher's voice toward a generic "helpful
  assistant" register, even under a formatting or safety fix.
  Deliberate architectural split: **hardcoded narration** (transition
  beats, ambient copy — authored, consistent, zero latency) vs.
  **live AI conversation** (Guide, Measure's interview — generative,
  responsive). Ambient/badge commentary was tried as live AI and
  reverted to static text — it added latency and drifted from the
  intended voice (see `collaboration-log.md`). Don't reach for a live
  AI call where authored static copy would do the same job better.
- **Prefer a real sentence over a label-colon-data row.** "Today, you
  read as reason" not "Your last reading — today: Reason · 412." A
  data-shaped line reads as a debug string, not something a philosopher
  or the app itself would actually say.
- **Never ask the user to believe anything — ask them to remember
  something they've already experienced.** The whole pitch voice avoids
  cosmological claims (vibrations, energy, souls) in outward-facing copy
  and translates them into plain, no-belief-required language (see the
  translation table in `docs/pitch.md`). This applies to in-app copy too,
  not just marketing: don't have the app assert something as fact that
  only makes sense to someone who already buys the cosmology.
- **Never diagnose, never judge, never say "you should."** Consistent
  with the anti-judgment visual rules (no bare score, no gradient bar) —
  the copy register carries the same rule. A line like "a moment, not a
  verdict, you don't need to change it" was cut from the reveal/Depths
  flow specifically because it was answering an objection nobody was
  making — don't add reassurance copy for a judgment the design itself
  already doesn't imply; that's over-explaining, and it's also the kind
  of thing that draws attention to the judgment it's denying.
- **Selfinder is practice, not therapy, and says so.** Never use clinical
  or diagnostic language (symptoms, treatment, disorder) anywhere in the
  product. See `docs/pitch.md`, "Isn't this therapy?" — this is both the
  honest line and the App Store legal line; they're the same line on
  purpose.
