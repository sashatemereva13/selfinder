# Your Arc — the concept

What Your Arc is, how it's used, and how the Journeys feed it. Read this
before building or changing anything on Your Arc, the same way
`shift-concept.md` governs Shift and `journeys-concept.md` governs
Journeys. The governing rules are in `RULES.md` ("Three places, one
chain", "The answers are already inside the person", "History is the
product").

Status (2026-10-21): the entry cone and the Past page are built; the
Future page (intentions) is not. The 2026-10-09 version put the dial on
the entry; it moved to the Past page so the entry is only about time.

---

## 1. The idea

**Now is shaped by how you understand your past and what you're reaching
toward.** Your Arc draws exactly that: a light cone — the past below, the
future above, and you at the point where they meet. It's the one place in
Selfinder that is about time rather than about today.

Its one job: **see where you've been, and what you're reaching toward,
from where you stand.**

## 2. What was wrong before

- The first screen was an empty diagram — the person had to decode it
  before seeing anything of theirs, and it was unclear what to do.
- Past and future were separate swipe sequences that felt disjointed
  from the rest of the app; the past read as a collection, the future as
  a dry form (wish → outcome → obstacle → plan).
- Center appeared both at "now" and inside the past.
- Shift sessions — the flagship — left no trace.

## 3. The screens (revised 2026-10-21)

**The entry is only the cone, and it is about time itself:** the past
narrows into one point, now; the future opens out of it. Three parts, each
a door — nothing else on the screen (no dial, no names, no links):

```
          ✦        ✦             What you're reaching toward  → Future page
      ╲               ╱
          ╲       ╱
              ●                  Now                          → Today
          ╱  ·    ╲
        ╱   ·  ·    ╲            Where you've been            → Past page
     (·  ·  ·    ·   · )
```

- **Her points are drawn, not tappable.** Distance from now is time (a
  point reaches the rim at about three months, on a logarithmic scale);
  the angle around the cone is the state — each rim is the seventeen-
  state ring seen in perspective — so a state she keeps returning to
  draws a trail. A shape from the record alone, never an interpretation.
- **Now → Today** (the tab). Today already is the "now" page; a second
  one would be the redundancy RULES.md warns about.
- **Past → "Where you've been"** (`your-arc-past.tsx`): every moment —
  readings, Shift sessions, completed Journeys — on the dial, oldest to
  newest, landing on the most recent. The moment the dial is on shows in
  full right above it: what was said, the reflection, the conversation
  and writing kept close to it; a session's from → to and its words; a
  Journey's result. Free: the last 14 days, the dial's last stop beyond
  them the Selfinder+ offer ("Your whole Arc") — built as a switch that
  starts off. Selfinder+: every moment.
- **Future → "What you're reaching toward"** (`your-arc-future.tsx`):
  Selfinder+ — her intentions, each its own (§5); with none, "Find your
  intention" → Possible Selves. Free — one line on what an intention is,
  and the offer. Until intentions are built, this still opens the old
  future pages.
- **Signed out:** the past shows the readings kept on the phone; the
  future, one line about signing in.

## 4. The past — a story, not a collection

Turning the dial down walks the past moment by moment. Between the
points sit **what the person has understood**: the closing words of each
past-facing Journey they've walked, placed on the day they walked it —
in their own words, never the app's.

The past-facing Journeys — **The Loop, Whose Voice?, The Road Not
Taken, Letting Go** — are what make the past more than a list ("the
sauce"). The philosopher may offer the one that fits from the past
itself, as one quiet line, never a gate — e.g. when the same state keeps
returning: "This keeps coming back. Would you walk The Loop?" (The
trigger is a plain fact about the record — the same state appearing
again — never an interpretation of what it means.)

## 5. The future — intentions, arrived at, not asked for

"Wish" becomes **intention**: an energy that leads the present into the
future — not a target to be achieved.

- **Arrived at through Journeys, not a form.** The future-facing
  Journeys each have a job:
  - **Becoming** — who you are becoming.
  - **Possible Selves** — your intention within that. Gains a final step
    (after `return-answer`): put it into one sentence, in your own
    words. That sentence becomes an intention — a light in the future
    cone.
  - **The Threshold** — what stands in the way of an intention, and a
    first step. Attaches to the intention it was walked for.
  The old wish → outcome → obstacle → plan form is retired; its
  substance now comes from these Journeys.
- **Several intentions, each clear on its own.** Life holds more than
  one; the app shows each one separately — its own light, its own page
  (its words, when it was set, what stands in the way and the first step
  if The Threshold was walked for it).
- **When an intention has done its work,** the person says so — "It
  carried me" or "I've set it down", equally valid, neither a failure.
  It then passes through now into the past, as a point on the day it was
  released. Never "achieved", never "failed", never a count of either.
- **Existing wishes carry over** as intentions; nothing saved is lost.

The present-facing Journeys (Control, The Choice, The Mirror, The
Unsaid, Enough) stay in Explore and at the end of Shift sessions.

## 6. What moves or goes

- **Center** (the kaleidoscope) → Explore, Receive: "A pattern from your
  history." One place only.
- **The second cone page** in the past (`TimeConePage`) — gone
  (2026-10-21); the entry is the cone now.
- **The closing page** — its "one small act" lives in Shift sessions.
- **The facts page** — gone (2026-10-21); the cone already shows it, and
  a count edges toward a score.
- **The old past pager** — replaced by the Past page (2026-10-21), with
  the Journeys list and the separate moment screen folded into the dial.
- **The old future pager** (wish form, crossings) — replaced by the
  Future page once intentions exist. Crossings stop being shown (texts
  the app generated about a wish); their data stays, covered by export
  and deletion.

## 7. Rules this must keep

- A record, never an analysis: points, dates, the person's own words.
  No line ever says what a pattern means about the person.
- Nothing ranks: the cone's vertical axis is time, not better/worse;
  states keep their ring colours.
- The future holds only the person's own intentions, never a forecast;
  "you are shaping your future", never "the future calls you".

## 8. Build order

1. Center → Explore (Receive). Done.
2. The entry cone — points by time and state, the three doors — and the
   Past page with the dial; Journeys as stops on it. Done 2026-10-21.
3. The cone's arrival motion: the past settles, now lights in today's
   colour, the future opens.
4. Intentions: the Future page; existing wishes shown as intentions;
   release ("It carried me" / "I've set it down", a backend change:
   `releasedAt`, `releasedAs`); a released intention becomes a stop on
   the Past page.
5. Possible Selves' final step creates an intention; The Threshold
   attaches to one.
6. The free 14-day line on the Past page and the offer on the Future
   page, as switches that start off.
7. The fitting-Journey offer from the past.
8. Retire the old future pager and its pages.
