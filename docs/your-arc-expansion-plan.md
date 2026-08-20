# Your Arc expansion — working plan (2026-08-20)

Three threads from this session's conversation, not yet built. This file
tracks what's settled, what's still open, and a rough build order — a
place to keep coming back to as each thread develops, not a spec to
build from yet. Update it as decisions get made; don't let it go stale
the way a one-off chat would.

---

## Thread 1 — Reframe the cone around phenomenological time

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

**What's settled:**
- Anchor is Husserl/phenomenology, not MindTime-style trait theory
  (MindTime sorts people into past/present/future "types" with wellbeing
  correlations — too close to the diagnosis/ranking problem this session
  already fixed once on this same screen).
- The reframe applies to the EXISTING cone (RULES.md + TimeCone's own
  copy), not a new shape.

**What's still open:**
- Exact wording for the top/bottom framing text (`coneFutureFraming`/
  `conePastFraming` in `your-arc.tsx`) — needs to state the
  retention/protention idea in plain language, not philosophy jargon,
  without smuggling in a "the past is over, let it go" judgment (a trap
  already flagged and avoided once this session on the closing-page
  idea — same discipline applies here).
- Whether this is a REPLACEMENT of the current framing or an optional
  second layer (e.g. tap to reveal the deeper "why this shape" — similar
  to the existing philosopher-voice/plain-line two-layer pattern already
  used everywhere else in the app).
- `RULES.md`'s own light-cone section (2026-08-14, quoted in full in that
  file) documents the CURRENT framing as settled — if this reframe
  sticks, that file needs a real edit, not just the screen, per its own
  standing rule that the file must never silently drift from what a
  screen actually does.
- Whether "Now" (Thread 2) and the closing page (Thread 3) should also
  adopt this vocabulary, or whether the cone alone carries it.

**Rough scope if/when built:** doc edit (RULES.md) + copy-only change to
`your-arc.tsx`'s two Text strings + `TimeCone.tsx`'s "now" label — no new
geometry, no new interaction. Small build, once the wording is right.

---

## Thread 2 — "Honoring your needs" — final page of Your Arc

**The idea:** a closing page combining what the past cone and future
cone (wish) both point at — "what is the need behind this?" — without
turning into a diagnostic quiz. Draws on both cones together (not a new,
third data source). Positioned as the last page in the pager.

**What's settled:**
- Register: a structural invitation, not a claim — e.g. "whatever moved
  through what you've read and wished for has its own reason — you
  already know it." Names that a need exists and matters without naming
  WHAT it is. The app never outputs a specific need on the person's
  behalf (that would be exactly the "teacher who tells you what's inside
  you" move `RULES.md`'s deepest rule forbids).
- "Letting go of the past" and "celebrating progress" — both rejected as
  originally phrased (both carry a verdict: releasing the past is good,
  change is improvement). Reframed as ACKNOWLEDGMENT instead: honoring
  that a past state was real and is not the current state (no verdict on
  whether letting go is good), and "what has genuinely changed" stated
  as plain fact (same register `arcFacts.ts` already uses for "you've
  measured N times this month" — true, never spun as better or worse).

**What's still open (the big one — explicitly not decided yet):**
- **What the page actually CONTAINS.** No practices/techniques chosen
  yet. This is the main blocker to building anything here at all.
- Does it pull live data (facts, wish, latest reading) the way the arc-
  line/Facts page already does, or is it closer to Breathing's
  authored-content model (fixed copy, personalized only by which
  reading/wish it references)?
- Any interactive practice at all, or a purely contemplative closing
  page (read, then done — no input)?
- Relationship to the (also unbuilt) phenomenological reframe in Thread
  1 — does this page use retention/protention language too, once that's
  settled, or stay in its own separate voice?

**Rough scope if/when built:** depends entirely on the still-open
content question above — could be as small as a new static page (like
Cover) or as large as a new interactive practice with its own state,
comparable in size to "Try it as if it's already true."

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

## Suggested order

1. **Thread 1 — in progress.** Smallest scope, Thread 2 will want to
   borrow its vocabulary once it exists. Mostly a conceptual/wording
   problem, not a technical one.
2. **Thread 2 next** — the content question ("what practices") needs
   real thought regardless of Thread 1's outcome, but can lean on
   Thread 1's language once it's settled.

## What Claude can help with in the meantime

- More research for Thread 1 (contemplative/plain-language treatments
  of retention-protention; whether other apps/practices have found
  honest ways to talk about "noticing the structure of now").
- Drafting candidate wording for Thread 1's framing text, once you want
  to see options rather than keep discussing the idea in the abstract.
- Thinking through Thread 2's practice options once you're ready to
  brainstorm concretely (would need your steer on what KIND of practice
  — breath-based, writing-based, purely visual/contemplative, etc.).
- Nothing on Thread 3 until 1 has more shape.
