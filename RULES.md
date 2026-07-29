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

- **Free core, paid depth — never free features, paid access.** Measure,
  Guide, Spill, Tune In, Breathing are free for everyone, unconditionally.
  What Selfinder+ sells is *accumulation over time* (Your Arc — the long
  line across every reading) and *expansion* (additional philosophers,
  deeper sound/breathing content) — never a worse version of the daily
  practice itself. The core loop being free is load-bearing for the pitch
  ("a gym, not a hospital," never gated like therapy) — don't let a growth
  idea erode it.
- **No live purchase/subscribe flow exists yet.** `YourArcTeaser.tsx` (a
  passive, non-pressable card shown once someone has 2+ readings) and the
  Depths "Talk about it" → "Keep the conversation going" copy-swap (after
  `TALK_ABOUT_IT_UPSELL_THRESHOLD` uses, see `engagementStore.ts`) are both
  *seeds*, not a checkout. Never build a tap target that looks like it
  leads to a purchase and doesn't — a soft, honest copy-swap that names
  Selfinder+ and stops there is the standing pattern until a real
  subscribe screen is built. When that screen exists, this rule should be
  rewritten, not left stale.
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
