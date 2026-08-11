# Depths structure / "traveling in cosmos" — concept draft (not yet built)

Status: concept/thinking draft only. Nothing in this file is implemented.
Captured here so the direction from a design conversation isn't lost.
Governing rules: `docs/design/aesthetic.md` (position/size/weight/space
as the only sanctioned levers for differentiation — no cards, no per-row
color, no icons) and `RULES.md`'s "never diagnoses, never judges" section
(the journey-progress idea in this doc was tested against that rule
directly — see "What this is not," below). Related but separate:
`docs/measure-experience-concept.md` traces back to the same root
complaint (first-run overwhelm) but is about how Measure's *questions*
work; this doc is about how *Depths itself* is organized and felt.

## The problem this solves

Depths groups its rows into three labeled sections today — "Find out
where you are," "Understand it," "Shift it, if you want to" (the actual
group headers already in `depths/index.tsx`) — but every row inside every
group is pixel-identical: same font, same size, same color, same spacing,
no icon (the app has no icon vocabulary anywhere in its content layer,
confirmed). The only thing separating a "discover" row from a "regulate"
row is a small muted caption above each cluster, easy to skim past. The
complaint, in the user's own words: *"every button feels like it's the
same as another one, but they all lead to something very different...
the app's UI should be descriptive in itself."*

**What this is not:** a request for icons, per-row color, or cards — all
three are directly ruled out by `docs/design/aesthetic.md`'s standing
rules (see that file's own "No cards," "Position and size carry
differentiation, not boxes or color," and "Never reintroduce per-item
color variety" sections, all confirmed still in force). The sanctioned
toolbox is explicitly **position, size, weight, space** — this document
works entirely within that constraint, not around it.

## The core reframe: zones as territory, not sections

An early direction (differentiate the three groups by giving each a
different rhythm/weight within the existing single scrolling list) was
considered and superseded by a bigger idea, stated directly: *"I see it
as a travel within one's depths, visualised, like travelling in
cosmos."* This reframes Depths from "one list with three labeled
sections" to **a single continuous space with three genuinely different
territories at different distances from a center** — the aura/ring,
which is already the screen's visual and symbolic heart.

**Resolved: distance has to be visible on Depths itself, not just felt
through screen transitions.** For the cosmos feeling to be real rather
than evocative language, you should be able to *see* that Regulate is
farther before ever tapping into it — more visual space, more emptiness
between the ring and that territory — not just experience a more
deliberate transition animation once you commit to entering it. Both
could still matter (see "Open questions," below), but the spatial cue on
the home screen itself was the resolved starting requirement, not an
optional enhancement.

## How the three zones map onto what they actually are

Not just abstract distance — the distance assigned to each zone is meant
to be honest to what that category of experience actually is, not
arbitrary:

- **Discover** (Talk about it, Draw a card, Your arc, Measure) — the
  least travel. These are either instant (a Guide message fires
  immediately) or a short flow that returns you straight to Depths when
  done (Measure already ends by routing back here — see RULES.md's "one
  reading, one screen" rule). This zone should sit *at* or immediately
  around the ring — barely needs inventing, mostly needs acknowledging
  territory that's already implicitly there.
- **Understand** (Levels) — pure reference. You go, you read, you're not
  changed by the visit the way you are by a practice. This argues for a
  zone that's reachable without much commitment — present, easy to
  reach, but positioned as a quieter margin rather than requiring a real
  departure, because visiting it isn't psychologically a departure.
- **Regulate** (Tune In, Breathing) — the one real *practice*, where time
  passes and you're meant to be different after than before. This is the
  strongest case for genuine travel-distance: visually farther on the
  screen (more space/emptiness to cross before reaching it) and a more
  deliberate tap to enter, because entering it is supposed to feel like
  leaving "checking in" mode and entering "doing something" mode. The
  distance itself does honest work — it's farther because it *asks more*
  of you once you arrive, not as decoration.

## The distance-as-journey idea — carefully scoped

A further idea, worth being precise about since it was refined mid-
conversation and the refinement matters: the distance a user visibly
travels through this space could represent **the shape of a single
session's walk through the app today** — how much of Depths' territory
was actually visited in this sitting (been to Measure, been to Levels,
haven't yet gone to Regulate) — **not** an accumulated claim about how
the person themselves has changed over time.

**This distinction is load-bearing, not a nuance.** The user's own
correction: *"the thing about the change is not about how a person
changed but a change in terms of the journey, like how much you walked
across the path or how much of the Selfinder journey you went through
today."* Concretely:

- **Allowed, and the actual proposal:** the space quietly reflects where
  taps have already gone *today* — a breadcrumb/session record, the same
  category of thing as `readingLog` remembering that a reading happened.
  This resets or refreshes per session/day; it's never a running total
  implying overall growth.
- **Explicitly ruled out, and flagged as the risk to watch for if this is
  ever built:** the space asserting or implying anything about the
  person from that record — no "you've barely explored today," no
  visual reward for having traveled further, no comparison across days.
  The moment the space starts *interpreting* the walk instead of just
  showing it, it crosses from mirror to verdict — the identical failure
  mode RULES.md already names for Your Arc, just in spatial form instead
  of a claim in words. The zones can show *what happened* (you've been
  here, not yet there); they must never suggest *what it means* or which
  direction is better.

## The first-run sequence — a special, once-only case of the same space

A further concrete idea: a first-time user shouldn't be shown the full
zoned cosmos at once (that would reproduce the exact overwhelm this
whole thread started from). Instead: **Measure is what a first-time user
sees first** — prominent, maybe the only thing emphasized — and once it
completes, the user is *visibly carried* toward Levels next, as the
natural following question ("okay, now what does this mean?"). This is
not a permanent mechanic — **resolved directly: this happens once, as a
first-run teaching moment, not every time someone completes a Measure.**
After that first walk, the full zoned Depths is simply available in
whatever its normal, settled shape is.

**Hard constraint, stated explicitly and non-negotiable:** Measure must
always remain immediately reachable, every session, regardless of
whichever zone visual emphasis currently favors. RULES.md's "free core,
paid depth" rule already requires Measure/Guide/Spill/Tune In/Breathing
to stay unconditionally available — "visibly moved toward Levels" can
never mean Measure becomes harder to find or reach, even for a moment,
even as a deliberate design choice. Emphasis and pacing, never gating.

## Open questions, not yet resolved

- **Exact visual mechanism for "distance you can see."** More vertical
  space between zones? A different background treatment (still within
  the no-cards/no-color rules) that reads as emptiness vs. territory?
  Not designed yet — needs real prototyping, not description.
- **Does the transition-into-a-zone (tapping to actually enter Regulate)
  also need to feel different/longer than entering Discover**, on top of
  the static spatial cue — i.e. do both halves of "spatial position AND
  travel-distance reinforcing each other" (the resolved combination from
  earlier in the conversation) need building, or does the static spatial
  cue alone already carry enough of the feeling? Not resolved.
- **What "today's walk" visually looks like** — a path with literal
  checkpoints (the user's own first suggestion, offered as "one of
  possible representations," not a commitment) is one option; something
  more diffuse (the space itself subtly settling/opening as more is
  visited) is another. Not designed.
- **Whether the once-only first-run sequence should be skippable/replay-
  able** (e.g. for a returning user who reset onboarding via the dev
  tools, or wants to see it again) — not discussed.

## Suggested order, if/when this moves from concept to work

Not a commitment, just the shape that emerged from how these ideas
depend on each other:

1. **The static zone layout itself** (discover near the ring, understand
   as a near margin, regulate visibly farther) — the foundational piece;
   everything else either decorates or activates this base structure.
2. **The once-only first-run sequence** — depends on the zone layout
   existing first (there's nowhere to "carry" a new user toward without
   Levels already occupying a distinct territory to carry them to).
3. **Today's-walk / session-breadcrumb reflection** — the most delicate
   piece to get right against the no-verdict rule; best attempted last,
   once the base space is proven out and feels right on its own, without
   yet trying to make it also carry session-history meaning.
