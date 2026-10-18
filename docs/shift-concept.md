# Shift — the concept

What Shift is, when it's offered, and what happens inside it. Read this
before building or changing anything in the Shift flow, the same way
`journeys-concept.md` governs Journeys. The governing rules are in
`RULES.md` ("Shift has destinations, not a summit", "The answers are
already inside the person"); this file is how they become a product.

Status (2026-10-08): agreed in conversation, not built. Stage lengths and
cue wording are starting points to be changed after on-device testing.

---

## 1. The idea in one paragraph

A reading tells someone where they are. Shift asks what they want to do
with it — and there are always two equal answers. **Use it**: the state
is energy with a job (anger can power a workout, fear sharpens attention,
grief honours what mattered), and the philosopher guides them to put it
to work in their actual day. **Shift toward love**: the philosopher
guides them to move toward love — chosen because it feels warm and
peaceful, never because where they are is wrong. Neither door is the
right one. Choosing is the point.

## 2. When it's offered

Not straight after Measure. Right after a reading, someone is curious
("anger — why?"), not ready to do anything with it; an offer then reads
as "your result is a problem, here's the fix."

The order is:

> **Measure** → **why?** (tap a sphere, see your own answer) →
> **what is it?** (the state's page) → **talk** (optional) → **the offer**

The philosopher's one step (`depthsSeam.ts`) gains a new state after
`talk`: `offer`, then `rest` once the offer has been seen (answered or
not). "Talk" counts as done only when a message is actually sent about
today's reading, not when the conversation is merely opened. Built
2026-10-08: the offer is `app/(tabs)/depths/shift/index.tsx`, its words
`src/content/shiftContent.ts`. Talking turned out to be a gate in
testing (someone who had already talked was stuck on "talk"), so the
step now goes from the state's page straight to the offer; the
conversation stays a place on the map.

Shift is always reachable from the map's ring for anyone who goes
looking; the philosopher just never *leads* with it before the person
has met their state.

**One Measure, one way in.** There is no quick "place yourself on the
ring" alternative to Measure — two ways to measure would confuse a new
person about how the app works. Shift starts from the current reading.
If the reading is from an earlier day, the philosopher's step is Measure
first (as it already is), and the offer follows from the new reading.

## 3. The offer (superseded 2026-10-18)

**Since 2026-10-18 the two doors are a sequence, one step per screen:**
the state's page hands over to Use it; the end of Use it offers Shift
toward love as the next step (one quiet line); Shift toward love is also
always reachable from Explore → Settle. The Choose screen is gone. The
reasoning below is kept as history.


A question from the philosopher, in their voice, with two answers of
equal visual weight — same size, same style, side by side or stacked
without one being the "primary" button:

> *"Anger is here, and it's yours. You can put it to work — or move
> toward love. Which would you like?"*
>
> **[ Use it ]**   **[ Shift toward love ]**

- **Not choosing is also fine.** No third button saying "no thanks" —
  the map and the minimap are always there, and simply leaving is an
  answer. The offer isn't repeated that day.
- **No hint of which is better.** No colour difference beyond the two
  destinations' own (the current state's colour for Use it, love's
  colour for Shift toward love), no "recommended", no order implying
  priority. The order is fixed — Use it first, because it starts from
  where the person already is.

### When the reading is love, or a neighbour of it

- **Love:** "Shift toward love" makes no sense. The two doors become
  **Use it** (warmth with somewhere to go — toward someone today) and
  nothing else needs to be offered; Use it *is* the deepening.
- **Unconditional love, peace, enlightenment:** these sit beside love on
  the ring, not above it. Love here is described as what it is in the
  level content — warmth with a direction, toward someone. So "Shift
  toward love" from peace means *giving a wide stillness a direction*,
  and the philosopher frames it that way ("your warmth has no direction
  right now — would you like to give it one?"). Never "down", never
  "back".

## 4. The two sessions

Both are authored, not live AI (`RULES.md`, Content/voice: practice cues
are hardcoded narration — a pause for an AI reply breaks a breath's
rhythm). Both are guided by the philosopher in their own voice. Both
share one shell: the ring at the top with the person's point lit, the
philosopher's cue in the middle, sound underneath, a slow breathing
light as the only progress indicator — no timers, no step counters.

### 4a. Shift toward love (~7 min)

| Stage | What happens | Drawn from |
|---|---|---|
| **Arrive** (1 min) | Slow breathing, about six breaths a minute; the light on your point breathes with you | Slow-paced breathing research; breathwork in Kyle Gray's *Raise Your Vibration* |
| **Start where you are** (1 min) | Different by state (see §5). Let it be fully felt before moving anywhere | Hawkins, *Letting Go* |
| **Find warmth** (1.5 min) | Recall one person or moment where warmth came easily | Loving-kindness meditation; Fredrickson |
| **Gratitude** (1 min) | Three small things from today, silently or one word each | Emmons & McCullough; a core practice in Gray |
| **Widen it** (1 min) | Let the warmth reach yourself, then someone neutral | The classic loving-kindness sequence |
| **One act** (30 s) | "Is there one small kind thing you could do today?" Optional, kept on the phone | Lyubomirsky (acts of kindness); Gray's "service" |
| **Return** | Drag your point to where you are now | The ring |

### 4b. Use it (~5 min)

Built from what each state's page already says it's *for* (the "What
it's for" and "Try this now" sections in `levelsContent.ts`) — the
person has just read that page, so the session puts it into practice.

| Stage | What happens |
|---|---|
| **Arrive** (1 min) | Same breathing as above — settle so the state is felt, not acted out |
| **Feel where it is** (1 min) | Where it sits in the body, how much of it there is. No changing it |
| **What it's for** (1 min) | The philosopher names, as a question, what this state is known to be for — anger: "something matters to you; what is it?" — never stating what the person feels |
| **Where it goes** (1.5 min) | "Where in your day could this go?" The person answers in their own words (optional, one line, kept on the phone). Examples are offered only as possibilities: a workout, a hard conversation, finishing something |
| **Return** | Drag your point to where you are now — it may not have moved, and that's the expected outcome of Use it, not a failure |

The philosopher never supplies the answer to "what matters" or "where it
goes" — they ask, and offer possibilities only as examples.

## 5. "Start where you are" / "Feel where it is", by state

Written per family of states, not per state, so v1 stays testable; split
further if a family feels wrong in testing. Families are about how a
state is *met in the body*, not a ranking:

- **Heavy** — shame, guilt, apathy, grief: allow it; let the breath be
  slow; nothing needs to be done with it yet.
- **Charged** — fear, desire, anger, pride: feel the energy; long
  exhales; feet on the floor; let it move (shake out the hands).
- **Steady** — courage, neutrality, willingness, acceptance, reason:
  notice what's already steady; where it sits.
- **Open** — love, unconditional love, peace, enlightenment: notice the
  stillness or warmth; nothing to add.

## 6. After a session

- **The record.** Your Arc gets two points — before and after — joined,
  with the door that was chosen ("used anger", "shifted toward love").
  The before/after is the person's own placement, never computed.
  Nothing on screen says the shift "worked".
- **The step.** The philosopher's step becomes `rest`: the minimap
  handle shows a closing line ("That's today's walk") with no action.
  The next day, the cycle starts again with Measure.
- **A longer walk, sometimes.** At most once a week, under the closing
  line, the philosopher names the Journey that fits the state (fear →
  Control, grief → Letting Go, desire → Enough…) as one quiet link.
- **What the person wrote** (the one act, the "where it goes" line)
  stays on the phone, and can be seen again on Your Arc at that point.

## 7. What's deliberately left out

From the "raise your vibration" genre: angels, energy cords, manifesting,
"high vibes only", chakras. All of them require belief, and Selfinder
asks people to remember, not to believe (`RULES.md`, Content/voice).
The practices kept are the ones that work without any cosmology:
breathing, letting a feeling be felt, recalling warmth, gratitude,
kindness.

Also left out: any claim after the session about how the person changed,
any score for the session, streaks or "sessions completed" counts.

## 8. Build order

Status 2026-10-08: 1–3 built — the doors on Practice
(`src/components/practice/ShiftDoors.tsx`), the session
(`app/(tabs)/practice/session.tsx`, cues in
`src/content/shiftSession.ts`; all five voices since 2026-10-14), sessions
kept on the phone (`src/store/shiftStore.ts`). No sound yet.

1. `offer` and `rest` states in `depthsSeam.ts` (+ "talk" done only on a
   sent message); the offer screen with the two doors.
2. The session shell (ring, cue, breathing light, sound, return drag)
   and Shift toward love, with cues for one philosopher first.
3. Use it, on the same shell.
4. Before/after on Your Arc.
5. Cues for the other four philosophers; Russian.
