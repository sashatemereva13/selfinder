# Your Arc expansion — working plan (2026-08-20)

Three threads from this session's conversation, not yet built. This file
tracks what's settled, what's still open, and a rough build order — a
place to keep coming back to as each thread develops, not a spec to
build from yet. Update it as decisions get made; don't let it go stale
the way a one-off chat would.

---

## Thread 1 — Reframe the cone around phenomenological time (BUILT — 2026-08-20)

**The idea:** the cone currently frames itself in personal-history terms
("the past as you've told it," "the future you're reaching toward").
Reframe it around Husserl's structure of the "living present" —
retention (the just-past, still echoing in now), primal impression (now
itself), protention (the anticipated next, already shaping now). The
cone stops being *Selfinder's own invented metaphor* and becomes an
illustration of something real about how any present moment is
structured — checkable directly (the melody example: you can't hear a
melody AS a melody in one instant; retention/protention are already
doing work in every "now").

**Why this clears Selfinder's own bar:** `RULES.md`'s standing rule is
"never ask the user to believe something new — ask them to remember
something they've already experienced." Husserl's claim is exactly that
kind of claim — not a belief to adopt, a structure to notice in
something you can check right now (listen to a few notes, feel that the
melody only exists because the earlier notes are still present in the
later one). Same "structural metaphor, no attached belief system" test
`docs/measure-experience-concept.md` already applies to the light-cone
symbol itself.

**What shipped:**
- Anchor is Husserl/phenomenology, not MindTime-style trait theory.
- Applied to the EXISTING cone (no new shape) — `coneFutureFraming`/
  `conePastFraming` in `your-arc.tsx` now read: "This moment already
  holds what you're reaching for — the way one note leans toward the
  next" (future) / "This moment still holds what came before it — tap a
  point to hear that note again" (past). Plain language, no philosophy
  jargon in-app, no "let go of the past" judgment.
- Both lines now HIDE while the cone is rotated to face the opposite
  rim (2026-08-20, follow-up review: "when the cone is turned one of the
  ways, the other hint disappears") — facing 'past' hides the future
  line and vice versa, since a hint about the rim you're not looking at
  has nothing to say in that moment.
- `RULES.md`'s own light-cone section — NOT yet updated to reflect this
  wording change; still an open follow-up (see "What's still open"
  below), since the file's own standing rule says it must never silently
  drift from what a screen actually does.

**What's still open:**
- `RULES.md`'s light-cone section (2026-08-14 entry) still documents the
  OLD framing as settled fact — needs a real edit to match the shipped
  copy above.
- Whether Thread 2's closing page (built, see below) should deepen this
  vocabulary further, or stay at its current level of echo ("held").

---

## Thread 2 — Closing page for Your Arc (BUILT — 2026-08-20)

**The idea:** a closing page combining what the past cone and future
cone (wish) both point at — "what is the need behind this?" — without
turning into a diagnostic quiz. Draws on both cones together (not a new,
third data source). Positioned as the last page in the pager.

**What shipped:** three parts, in Thread 1's own phenomenological voice
(a direct callback to "held," not a separate register):
1. **A synthesis line** naming that the latest reading and the active
   wish are both still held right now, together — personalized with real
   data (the actual level word, the wish's own words), not left
   abstract the way the cone's own lines stay. E.g. "Love is still
   close. So is what you wished for. Both are here, in this moment, the
   way a held note is still sounding after the ones before it." Adapts
   when there's no active wish yet: drops the wish half, and a quiet row
   ("Is there something you're reaching for?") invites one instead of
   assuming it exists — never forces writing one, matching "free core,
   paid depth, never gated" (RULES.md).
2. **The structural need-exists line**, exactly as originally drafted:
   "Whatever moved through what you've read and wished for has its own
   reason — you already know it." Names that a reason exists without
   naming what it is.
3. **One small optional act** — a single free-text prompt ("What would
   it mean to let this be enough, for now?"), saved as a real Spill
   entry via the same explicit, affirmative-save convention Spill's own
   "keep this moment" button uses (`saveSpillEntryIfConsented` —  no new
   backend model needed). Never scored, never reflected back by the app.
   This is what makes the page a CLOSE, not one more view: something
   done, not just read.

**Resolved along the way:**
- "Letting go of the past" / "celebrating progress" register — both
  stayed rejected (both carry a verdict). The synthesis line instead
  just states that both are still present, no verdict on either.
- Live data, not Breathing's fixed-copy model — the whole point was
  personalizing with the person's actual latest reading and actual wish.
- An interactive practice (the writing prompt), not purely
  contemplative — chosen specifically because a read-only closing page
  risked still feeling like "one more view," the exact critique that
  started this whole thread (see "Why Your Arc needed this" below).
- The "wishing to feel what you already feel" idea (a wish as
  reinforcement of a state already present, not just aspiration) came up
  while discussing the no-wish case — explicitly flagged as still
  forming, not decided, and NOT built into anything yet. Worth its own
  thread later if it develops further.

---

## Why Your Arc needed this (2026-08-20, context for both threads above)

Raised directly: "Your Arc lacks a clear direction and result the user
gets 'at the end of it.'" Before Thread 2, the pager was five pages of
separate VIEWS onto the same record (kaleidoscope, cone, list, wish) —
each answered "what does my record look like from this angle," none
answered "so what." For a PAID feature specifically (RULES.md: "the
accumulated record of you becoming fully yours to hold and return to"),
that's under-earning the price — the record without the becoming.
Thread 2's closing page is the direct fix: a real ending gesture instead
of the pager just running out of pages.

## Pager-as-journey pass (BUILT — 2026-08-20)

Follow-up to the "no clear direction" critique: "every connection
between pages should be logical," plus a real arrival beat and a more
prominent last dot.

**What shipped:**
- **Reordered pages** — the resurfaced-wish page (an OLD wish
  surfacing) previously sat between "What calls you" (the ACTIVE wish)
  and the new Closing page, meaning present-wish → past-wish → close, a
  detour into the past right before a close built around the present.
  Moved to right after Cone/Facts and before "What calls you," so the
  sequence now reads in one direction: past → an old wish returning as
  part of that past → active wish now → close.
- **Closing page arrival beat** — `PagedScrollView` gained an
  `onActiveIndexChange` prop (all pager pages stay mounted the whole
  time, so a plain mount-effect entrance would only ever play once); the
  closing page now replays a real scale/opacity entrance (same
  "gather, condense, become" curve `ArcKaleidoscope` uses) every time
  it's actually swiped to.
- **Distinct last dot** — `PagedScrollView` gained a `distinctLastDot`
  prop: the final dot renders as a hollow ring instead of a filled
  circle (same size, no new color) so the row itself hints "this one is
  the destination" before arriving there.

## Detail page prominence (BUILT — 2026-08-20)

Follow-up to the same "worth its price" conversation: the Detail page
(a reopened past reading — transcript, philosopher reflection, linked
Spill entry, linked Guide conversation) is the richest, most clearly
paid-tier content on the whole screen, but was the least discoverable —
reachable only by rotating the cone and tapping a dot, or from the Facts
page's own list.

**What shipped:**
- **Fixed a real navigation bug**: tapping a row in the Facts page's
  past-readings list set `selected` but never actually navigated to the
  Detail page (no jump token was set, unlike the cone's own explicit
  "Open full reading" link) — the page was silently appended to the end
  of the pager with nothing visibly happening unless you swiped there
  manually. `handleFactsReadingPress` now sets the same jump token
  `handleOpenFullReading` does.
- **Added a discoverability hint** — "Tap any date to open that moment
  again" now sits under the past-readings list, stating the affordance
  instead of assuming it's obvious.

---

## Thread 3 — Past/present/future "self-check" (RESOLVED — dropped)

**The idea, as originally proposed:** a three-column quiz (image
reference: "Where are you living?" — Past/Present/Future statements to
match against) that tells the user which one they're "in."

**Why the original shape didn't fit Selfinder, confirmed this session:**
1. It's a diagnostic OUTPUT ("you are living in the past") — the exact
   "teacher who tells you who you are" move `RULES.md`'s deepest rule
   exists to prevent, on a screen (Your Arc) that's already had one real
   ranking violation found and fixed this same session (the old
   sparkline).
2. It implicitly RANKS the three states (Present column reads as the
   healthy answer; Past/Future read as "stuck") — the same up=better/
   down=worse problem the cone-rotation work this session specifically
   set out to remove.

**Resolution (2026-08-20):** dropped, not just tabled. Once Thread 1's
melody-type framing was settled — every present moment already contains
retention and protention together, there is no separate "past mode" or
"future mode" a person could be sorted into — the self-check's entire
premise (three distinct places a person might mentally "be," with one
being healthiest) stopped making sense on its own terms, not just as a
Selfinder-fit problem. No non-diagnostic version is being pursued
either; the question the quiz was reaching for is now just... the cone,
reframed. Nothing further to build here.

---

## Status (2026-08-20)

All three original threads are resolved — Thread 1 and Thread 2 built,
Thread 3 dropped. The pager-as-journey pass and Detail-page-prominence
work (both above) were follow-ups from a separate "is Your Arc worth its
price" conversation, not originally-planned threads, and are also built.

## Open follow-ups

- `RULES.md`'s light-cone section (2026-08-14 entry) needs a real edit
  to match Thread 1's shipped copy — still documents the old framing.
- The "wishing to feel what you already feel" idea (reinforcement, not
  just aspiration) — explicitly still forming, not decided, not built.
  Surface it again if it develops further; don't build around it yet.
- Whether Thread 2's closing page should deepen the phenomenological
  vocabulary further over time, or stay at its current "held" echo.

## What Claude can help with

- Drafting the `RULES.md` light-cone section update, when ready.
- Thinking through the "wishing to feel what you already feel" idea
  further, whenever it's ready to be discussed concretely.
- Any next round of Your Arc review — the three original threads plus
  the two follow-up passes are all shipped; a fresh pass would start
  from a new critique, not from anything still open in this file.
