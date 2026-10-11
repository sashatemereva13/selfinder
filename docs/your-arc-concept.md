# Your Arc — the concept

What Your Arc is, how it's used, and how the Journeys feed it. Read this
before building or changing anything on Your Arc, the same way
`shift-concept.md` governs Shift and `journeys-concept.md` governs
Journeys. The governing rules are in `RULES.md` ("Three places, one
chain", "The answers are already inside the person", "History is the
product").

Status (2026-10-09): agreed in conversation, not built. Replaces the
2026-09-05 hub/sub-pager structure (`your-arc.tsx`, `your-arc-past.tsx`,
`your-arc-future.tsx`).

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

## 3. The screen

One screen: the cone, with the person's own record in it on arrival.

```
                 ✦ ✦                      ← intentions: lights in the future
               ╲     ╱
                ╲   ╱     FUTURE
                 ╲ ╱
                  ●   Today: Neutrality   ← now
                 ╱ ╲
                ╱ · ╲     PAST
               ╱ ·  ·╲    ← real points, in their states' colours,
                                nearer the vertex the more recent
              ( dial )                    ← turn to move through time
```

- **The record on arrival.** The past cone holds the person's real
  points — readings, and Shift sessions as two joined points (before and
  after) — placed by date, closer to "now" the more recent.
- **The dial moves through time.** The round dial (`ArcDial`) stays and
  gets a bigger job: turning it moves the focus down into the past,
  through now, up into the future — on this one screen, not across
  separate routes. What's in focus is named and opens on tap: a past
  point opens that moment (`DetailPage` content); "now" opens Today; an
  intention opens that intention.
- **First visit:** one plain line under the cone — "Below is where
  you've been. Above is what you're reaching toward. You stand where they
  meet." Never again after.
- **One action at a time,** chosen by the philosopher, in the same place
  as on every other screen: with no intention yet, the future invites
  ("Find your intention"); with one, the past invites understanding when
  a past Journey fits.
- **Signed out:** the readings kept on the phone, and one line — "Sign
  in to keep your whole Arc."

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
- **The second cone page** in the past (`TimeConePage`) — the first
  screen is the cone now.
- **The closing page** — its "one small act" lives in Shift sessions.
- **The facts page** — at most one plain line ("Since August: 14
  readings, 3 shifts") if it earns its place; facts, never a score.
- **The separate past/future routes and their pagers** — one screen.

## 7. Rules this must keep

- A record, never an analysis: points, dates, the person's own words.
  No line ever says what a pattern means about the person.
- Nothing ranks: the cone's vertical axis is time, not better/worse;
  states keep their ring colours.
- The future holds only the person's own intentions, never a forecast;
  "you are shaping your future", never "the future calls you".

## 8. Build order

1. Center → Explore (Receive).
2. The cone with real points (readings + Shift sessions) and the dial
   moving through time; tap to open a moment.
3. Intentions: existing wishes shown as intentions; release ("It carried
   me" / "I've set it down").
4. Possible Selves' final step creates an intention; The Threshold
   attaches to one.
5. Past Journeys' closing words placed in the past; the fitting-Journey
   offer from the past.
6. Retire the old pages and routes.
