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
  conversation is like is a deliberate product goal (the Selfinder+ seed),
  not an incidental option to bury as a footnote link.

## Product / positioning

Full pitch, mechanisms, and business model: **[`docs/pitch.md`](docs/pitch.md)**
(and **[`docs/pitch-text.md`](docs/pitch-text.md)** for the same content as
flowing copy) — read before writing anything user-facing about what
Selfinder is or why it costs money.

- **History is the product. Not more philosophers, not more sounds.**
  Selfinder+ sells exactly one thing: the accumulated record of you
  becoming fully yours to hold and return to. That means the full line
  across every reading (not a recent slice), rich re-entry into any past
  moment (reopening what you said, what your philosopher said back, not
  just a date and a dot), and the app actively bringing a past moment back
  to you at a meaningful time — not five more philosophers, not a deeper
  sound library. This is a deliberate, considered choice (see
  `collaboration-log.md` for the reasoning), not a placeholder waiting for
  more content to be built. **The single experience to make magical is
  revisiting your own past** — every other feature (Measure, Guide, Spill,
  Tune In, Breathing) exists to make that history worth having, by feeding
  it. Cross-app research on what retains paying subscribers long-term
  (Oura, Strava, Day One, Timehop-style memory surfacing) converges on the
  same mechanism: people don't resubscribe because the feature list grew,
  they resubscribe because the app is where a year of themselves lives,
  and losing access would mean losing that. Two things make this
  legitimate rather than a dark pattern: the record was always theirs (see
  the GDPR/profiling point above — it's a mirror, not an analysis), and it
  must stay exportable even if someone cancels — never lock someone out of
  their own past to punish non-payment. That distinction — richer *access
  to your own record* vs. richer *content the app supplies* — is the whole
  rewrite; treat "more philosophers" or "more sound/breathing content" as
  explicitly off-brief for Selfinder+ until this file says otherwise.
- **The sharpest one-line description of Selfinder+ (2026-08-14):**
  Selfinder+ adds *dimensionality* — it lets someone look at the present
  moment in light of their own past and their own future, not alone.
  **Selfinder+ doesn't tell you who you are. It helps you notice where
  you are — between what has shaped you and what is calling you
  forward.** This is "History is the product" restated at its sharpest,
  not a new rule — the same anti-diagnosis constraint above still fully
  applies. Visual/copy metaphor: a light cone (fixed past below, open
  future above, meeting at "here and now") — borrowed deliberately as a
  *shape*, never a physics claim, same "structural metaphor, no attached
  belief system" test `docs/measure-experience-concept.md` already
  applies to the cultural-symbol boundary. Two things this framing must
  never become: the past cone is *the user's own account* of what
  happened (a Measure answer, a wish, a kept Spill entry), never
  asserted as raw objective fact — Selfinder never had access to
  anything but someone's own telling of it. The future cone is never a
  projection, forecast, or "expected trajectory" (already forbidden
  elsewhere in this file) — it holds only the active wish, the one real,
  stated thing reaching forward. Say "you are shaping your future," never
  "the future is calling/pulling you" — the present moment is the
  source, not the effect of something ahead of it; agency stays with the
  person, matching "the answers are already inside the person" above.
  Price, decided the same day: €7.99/month, €49.99/year (not yet live —
  see the no-live-purchase-flow note below).
- **Free core, paid depth — never free features, paid access.** Measure,
  Guide, Spill, Tune In, Breathing are free for everyone, unconditionally,
  and stay exactly as rich as they are today — free is never made to feel
  incomplete on purpose. What's paid is depth of *history*: the full arc
  instead of a preview slice, and richer ways back into an old moment.
  The core loop being free is load-bearing for the pitch ("a gym, not a
  hospital," never gated like therapy) — don't let a growth idea erode it.
- **No live purchase/subscribe flow exists yet — but real entitlement-
  gated depth does.** As of the 2026-08-10 "history features and real
  entitlement system" rewrite, `useIsSubscribed.ts` is a live `GET /user/
  me` check against `User.subscription.active` (`backend/models/User.js`)
  — no client-side dev toggle exists anymore. The only way that field
  becomes `true` today is a manual admin grant
  (`backend/scripts/grantSubscription.js <username>`); nothing writes
  `source: "apple"/"google"` yet, so there is still no real checkout.
  `YourArcTeaser.tsx` no longer exists — the "Your arc" entry point now
  lives as a permanent, pressable row directly in Depths' spiral
  (`SLOT_META.yourArc`, `depths/index.tsx`), routing to `/your-arc` if
  subscribed or `/your-arc-preview` if not. Depths' own "Talk about it"
  row is now permanently static (always "Talk about it," never swaps
  copy, always opens Guide) — the upsell copy-swap
  (`TALK_ABOUT_IT_UPSELL_THRESHOLD`, `engagementStore.ts`) moved to a
  separate, conditionally-rendered row on `your-arc-preview.tsx` itself
  ("Keep the conversation going"), shown only to non-subscribers past the
  threshold. Beyond these seeds, real subscriber-only depth already
  ships: server-linked Guide-conversation persistence, Spill's "keep this
  moment" affordance, per-sphere history on Your Arc, and richer
  same-day re-entry into a past reading (transcript + matched Spill
  entry) — all entitlement-gated via the same live check, not additional
  UI seeds. Never build a tap target that looks like it leads to a
  purchase and doesn't — that discipline still stands even though real
  depth now sits behind the entitlement check. When a real IAP/checkout
  flow is built, this rule should be rewritten again, not left stale —
  the same fate that already happened to it once (see collaboration
  history around commit `5753a0d7`).
- **Every change should lean toward "what makes this a paid app?"** — not
  by adding friction to the free core, but by asking whether a change adds
  polish, a funnel-analytics touchpoint, or a Selfinder+ seed. A change
  that does none of these isn't wrong, but a change that actively works
  against this (e.g. making free content feel already-complete with
  nothing more to want) is worth a second look.
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
