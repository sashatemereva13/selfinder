# Selfinder Cards — concept draft, now live in the app

Status: **wired and working**. The deck (20 cards — the original 8
physics/math cards, 6 cycle-phase cards, and 6 archetype cards), draw
screen, Depths entry row, and Guide/Spill routing are all implemented —
see "What's actually built" below for exact files. This
doc remains the design record: read it before changing any of it, since
several choices here (no card selection based on reading data, no
content-echoing, statement/instruction format) are deliberate constraints
that aren't obvious from the code alone. See `RULES.md`, "The answers
are already inside the person" for the governing rule this feature must
stay inside of.

## What's actually built

- **Deck content**: `mobile/src/content/cardsDeck.ts` — 20 cards total
  (the original 8 physics/math cards + 6 cycle-phase cards + 6 archetype
  cards, see "Cycle-phase cards" and "Archetype cards" below),
  `{id, name: {en,ru}, kind, line: {en,ru}, rgb}`, plus `drawCard()`
  (uniform random pick across all 20, no weighting, no separate mode/
  theme — every sub-family is shuffled into the same pool).
- **Symbols**: `mobile/src/components/CardSymbol.tsx` — the original 8
  physics/math forms, a shared `cycleRing()` construction +
  `CYCLE_PHASES` position table powering the 6 cycle-phase symbols, and 6
  standalone constructions (no shared base) for the archetype cards.
- **Draw screen**: `mobile/app/(tabs)/depths/cards/index.tsx` — draws
  once per visit (`useState(() => drawCard())`, no reroll, same rule as
  Feeling Lucky), shows the symbol + kind label ("Receive"/"Notice") +
  name + line, a Save/Share action (`SaveMessageAction`, reused as-is),
  and three routes: **Talk about it** (seeds a Guide message via
  `guideChatStore.send()`, exact same imperative pattern as Feeling
  Lucky — no route params, no seed-state field), **Write about it
  instead** (routes to Spill; since `spillStore` has no prefill
  mechanism, this only seeds intent, not text — Spill still starts
  blank), and **Draw again** (quiet, low-weight link, redraws in place
  without leaving the screen).
- **Depths entry point**: a row inside the `findOutWhereYouAre` group,
  directly below "Talk about it," gated on `currentResult` (appears once
  any reading exists — not the 2+ threshold Your Arc uses). Real row
  weight (`styles.row`), not Feeling-Lucky-style quiet aside, per the
  "standing invitation, real peer to Talk about it/Measure again"
  decision below.
- **i18n**: `depths.cardsLabel`/`depths.cardsDescription` (en/ru) for the
  row; a new `cards` namespace (`receive`, `notice`, `talkAboutIt`,
  `talkAboutItMessage`, `spillAboutIt`, `backLabel`) for the screen
  itself, in both `en.json` and `ru.json`.
- **Analytics**: `cards_drawn`, `cards_talk_about_it`, `cards_spill_it`
  added to `backend/controllers/eventsController.js`'s
  `ALLOWED_EVENT_NAMES` allow-list (events silently drop otherwise).
- **Persistence**: none, deliberately — ephemeral like Feeling Lucky.
  Nothing about which card was drawn is saved; a fresh visit draws fresh.
  This was a deliberate scope decision (see conversation record) to keep
  the draw feeling spontaneous rather than becoming tracked history, and
  to avoid building new store/session-state infrastructure in the first
  pass.
- **Visually verified** end-to-end via the `run-mobile` skill: Depths row
  renders and routes correctly, the draw screen renders a real symbol
  with layered geometry, Save/Share/Talk-about-it/Write-about-it all
  work, and the Guide handoff correctly seeds "I drew a card just now —
  {name}: "{line}" Can we talk about it?" as the opening message.

## What it is

A small deck of original, wholly-Selfinder archetypal cards — not tarot,
not any borrowed tradition. Each card pairs one short evocative name with
one line — either a quiet statement to receive, or a simple instruction
to notice something, never a question demanding an answer (see "Why not
questions" below). No "meaning" text, no upright/reversed duality, no
combinatorics between cards. The entire content of a card is the name
and its one line — there is nothing else to "read," which is what keeps
this from becoming fortune-telling: the person supplies whatever meaning
arises, the card never asserts one.

### Why not questions

Early drafts (still visible in "Themes" and "Unthemed drafts" below, kept
for the record) phrased every card as a direct question — "Whose
permission are you actually waiting for — and have you asked?" In
practice, this was found to be genuinely hard to sit with, for a precise
reason: a question that demands you name something specific ("whose,"
"what," "why") asks you to already have conscious access to the answer,
which is backwards from how insight actually tends to arrive — sideways,
later, unforced, not on demand under a question that has a right answer.
A first revision tried softening the question toward present-tense
sensation ("where in your body does 'not yet' live right now?") — this
was still wrong for the same underlying reason: it's still a question
aimed *at* the person, expecting them to locate and report something
correctly. Swapping "why" for "where in the body" relocated the
interrogation, it didn't remove it.

The actual fix: a card should never require an answer at all. Two
formats, used across the deck rather than one fixed template for every
card:
- **A statement to receive, not answer** — e.g. "Something you've
  stopped closing is still open, waiting for someone who may never come
  back through it." Nothing to solve; it either resonates or it doesn't.
  Deliberately underdetermined (never says *what* was left open) so it
  stays true-feeling on its own rather than depending on the reader
  supplying the missing specific.
- **An instruction to notice, not explain** — e.g. "Notice what you're
  carrying. Not why — just its weight, right now." Attention is the
  whole task; there's no wrong way to do it, no content to get right or
  wrong. Closer to how Tune In and Breathing already work (they never
  ask anything, they just give the person something to be with) than to
  how Measure works (which does ask direct questions, appropriately,
  because it's building a reading, not offering a quiet moment).

This is the same underlying mechanism as `feelingLuckyList.json` (a
random, non-inferential draw the user projects their own meaning onto,
one draw per visit, no reroll, routes into Guide via "talk to {name}
about it") — Cards is that mechanism's visual/archetypal sibling, not a
replacement. Keep the register distinct from Feeling Lucky's dense,
oracular prose: Cards should read sparse and archetypal, closer to the
philosophers' aphoristic voice.

Mechanism note (from the conversation that produced this): a tarot-style
card works the same way Measure and `FeelingLuckyList` already do — it
reflects the present moment and lets something surface from the user's
own subconscious that only the user can actually interpret. Measure does
this through 17 named states; Feeling Lucky does it through found text;
Cards would do the same thing visually, through a symbol + a question.

## How it plugs into the existing app

- **Draw → routes into Guide**: the card's line becomes the opening beat
  of a Guide conversation, same pattern as Feeling Lucky's "This found me
  just now... Can we talk about it?" forward — the philosopher picks up
  from there in their own voice, rather than the card itself demanding a
  response.
- **Draw → routes into Spill**: the line becomes a free-writing seed
  instead, for people who'd rather sit with it alone.
- **Draw stands alone**: no forced next step, same as Tune In — reading
  the line and closing the app is a complete, valid use, arguably the
  most common one given the card is a statement/instruction, not a
  question expecting a reply.

### Cards as "a second layer of a reading" — how it attaches to Depths

Every reading gets a standing invitation on Depths, always available (not
occasional/rare like Feeling Lucky) — something like "there may be
something underneath this — draw a card," offered as a real peer to Talk
about it / Measure again, not a quiet aside. Likely lives inside the
"Find out where you are" group alongside those two, since drawing a card
is another way of finding out where you are, just through a symbol
instead of words.

**Critical constraint on how this must NOT work:** the reading must never
select or influence *which* card is drawn. It was tempting (and is the
literal ChatGPT-draft framing) to have the app pick a "relevant" card
based on the reading's sphere scores — e.g. a reading where Heart and
Mind diverge surfacing a Shadow-themed card because the app inferred
that's what's "underneath." This was considered and rejected: it's the
same violation as content-echoing the wish (see
`docs/session-result-concept.md`) — the app would be making an
inferential judgment about the person and dressing it as randomness.

**What "underneath this reading" actually means here:** the reading
*motivates the offer* to draw, not the *content* of the draw. The card
itself stays fully random within the deck (or within a theme, if the
user picks one themselves — see "Themes" below), same as before. The
felt sense of "something underneath" comes from the user's own
juxtaposition — they just answered four deep questions, then a random
symbol+line happens to land near that same territory, and *they* draw
the connection. That's real when it happens on its own; it would be
hollow and dishonest if the system manufactured it by rigging the draw.

## What it must never do

Per `RULES.md`'s "the answers are already inside the person" rule:
- Never claim to predict, reveal a hidden truth, or say what a card
  "means for you."
- Never frame the draw as the system choosing meaningfully for them —
  it must read as genuinely random, so the only source of meaning is the
  person, not the app. This includes never selecting a card (or, more
  subtly, a theme) based on a reading's sphere scores or any other
  inference about the user — see "Cards as a second layer of a reading"
  above.
- No reversed/shadow-meaning text, no "this card near that card means X"
  — the name and its one line are the entire content, permanently.
- Never phrase a card as a question demanding a specific answer — see
  "Why not questions" above. A card is a statement to receive or an
  instruction to notice, never an assignment with a right answer.

## Physics/math vocabulary — why, and the boundary it must respect

Early drafts used architectural/object forms (a door, a lever, a room).
Revised after noting the app's existing symbol language
(`PhilosopherObject.tsx`) never draws a picture of a specific thing in
the world — a spiral isn't a picture of anything, a cube isn't a picture
of a box, they're referenced at the level of pure form. Camus' boulder is
the one near-exception, and it's telling: it only reads as "boulder"
because the viewer already knows the Sisyphus myth — the meaning rides
on the myth, not on illustration.

The actual boundary isn't "no recognizable objects," it's **the shape
can't pre-load a story**. A train, a house, a key already carry cultural
narrative before the card's question is even read — that narrative
competes with the user's own answer for what supplies meaning. A wave,
an orbit, a phase-space field carry zero narrative (nobody has a
cultural story about a waveform) but carry real *structural* meaning
(resonance, decay, oscillation, collision) that maps onto emotional
territory with precision, entirely through form. This also ties Cards
tighter to the rest of the app than an architectural vocabulary would —
"vibration," "frequency," "field," "reading" are already Selfinder's
operative words everywhere else (Depths' rings animate at a rate tied to
the reading's own score, described in-code as a "frequency metaphor").

## Cards drafted so far (current versions — statement/instruction format)

- **The Open System** (`openSystem`) — a wave that doesn't close into a
  loop, both ends trailing off past the frame. *Statement: "Something
  you've stopped closing is still open, waiting for someone who may
  never come back through it."*
- **What You're Carrying** (`whatYoureCarrying`) — two nested orbits
  around a shared center, one pulled elliptical by an unseen second mass.
  *Instruction: "Notice what you're carrying. Not why — just its weight,
  right now."*
- **Standing Wave** (`standingWave`) — most amplitude damped near-flat
  except one antinode still at full height. *Statement: "Something you
  thought you released is still moving, quietly, underneath everything
  else."*
- **Interference Pattern** (`interference`) — two wave trains with real
  constructive/destructive interference where they cross. *Instruction:
  "Let both voices speak at once. Don't choose. Just listen to what
  happens when they overlap."*
- **The Fixed Point** (`fixedPoint`) — a scattered field of points with
  one point held still against the drift. *Statement: "In the middle of
  everything that's shifted, one thing in you has stayed exactly
  still."*
- **Incomplete Resonance** (`incompleteResonance`) — a loop that almost
  closes on itself but the phase is slightly detuned, so it spirals
  instead of repeating. *Instruction: "Let this thought come back
  around, one more time, without trying to finish it."*
- **Signal Beneath Noise** (`signalBeneathNoise`) — high-frequency chaos
  with one clean low-frequency wave visible underneath. *Statement:
  "Underneath everything loud today, something quieter has been trying
  to be heard."*
- **Below the Threshold** (`belowThreshold`) — a trajectory rising
  toward a barrier, approaching but never crossing it. *Instruction:
  "Notice how close you've already come. Not whether to cross — just how
  close."*

## Cycle-phase cards

Everything in life has a cycle, and it can be useful to have language for
which phase of one you're in. Six cards, shuffled into the same deck as
the eight above (not a separate mode/theme, not user-selectable) — drawn
at random exactly like everything else.

**Why these needed more care than the other eight.** A "phase of a
cycle" is inherently a *positional* claim — where you are on a sequence —
in a way none of the other eight cards are (a wave, a fixed point, an
interference pattern don't claim you're anywhere in particular). That
puts cycle cards structurally closer to the 17-level vibration map, which
already has a hard rule about this: the app never asserts a position, it
only ever *computes* one from what the user themselves said (via
Measure). A randomly-drawn card that flatly states "you're in the
releasing phase" would be the app guessing a fact about where someone
currently stands in their life — a materially stronger claim than
anything else in the deck makes, and a direct violation of "the answers
are already inside the person."

**How they stay inside the rule.** Same fix as everywhere else in this
deck: the card names a phase as a *possibility to check against*, never
asserts it. "Beginning" doesn't say "you are beginning something" — it
says "something in you may have already started, even if nothing shows
yet." The phase is offered; the person decides if it's true. All six use
the same statement/instruction discipline as the rest of the deck (see
"Why not questions").

**The six**, drawn from a deliberately generic, non-borrowed cycle model
(Beginning → Rising → Peak → Turning → Releasing → Rest — not seasons,
not moon phases, not any named tradition, consistent with "wholly
Selfinder, not tarot, not any borrowed tradition"):

- **Beginning** (`cycleBeginning`) — *Statement: "Something in you may
  have already started, even if nothing shows yet."*
- **Rising** (`cycleRising`) — *Instruction: "Notice where the momentum
  is building. You may already be moving before you decide to."*
- **Peak** (`cyclePeak`) — *Instruction: "This might be the fullest a
  thing gets. Notice it, before it starts to change."*
- **Turning** (`cycleTurning`) — *Statement: "Something may be about to
  reverse direction — see if you can feel it before it does."*
- **Releasing** (`cycleReleasing`) — *Instruction: "Notice what's
  loosening its grip on its own, without you having to let go of it."*
- **Rest** (`cycleRest`) — *Instruction: "Nothing here is asking to be
  done. Notice what it's like to let that be true."*

**Shared visual construction — a deliberate sub-family within the deck.**
All six are built from one base form (`cycleRing()` in
`CardSymbol.tsx`): a full ring, always drawn faint and complete, with
**one arc segment emphasized** (brighter, thicker stroke) at a different
position around the ring per phase, plus a small marker dot at the arc's
leading edge. This reads as a coherent family the way Aristotle's sphere
and Camus' rock both read as "solid forms" while staying visually
distinct from each other — useful since these six are shuffled in with
the other eight and should still feel like they belong to one deck, not
a bolted-on second system.

**Critical constraint, enforced in the code itself:** a cycle card must
NEVER show more than one phase's position at once. Only the drawn card's
own arc is ever rendered — there is no shared "whole cycle" view where
you could see where Beginning sits relative to Rest. This is what keeps
a cycle card from quietly becoming a wheel/map (which is a different,
already-existing instrument — `ConsciousnessWheel.tsx`/
`VibrationSpectrum.tsx` — that legitimately shows every position at once
because a map's whole job is showing the full territory). A cycle card
shows one moment, the same way every other card in the deck does.

## Archetype cards

Six cards built around a different idea than the original eight or the
cycle-phase six, but following the exact same visual/copy discipline:
**physics concepts that are themselves archetypal motifs**, not
archetypes illustrated with narrative imagery. Simple harmonic motion IS
the archetype of return/oscillation; a phase transition IS the archetype
of a threshold; a random walk IS the archetype of searching without yet
having found. The physics form doesn't stand in for the archetype the
way a drawn door or mask would (see "Physics/math vocabulary" above,
"the shape can't pre-load a story") — the archetype and the physics
concept are the same thing looked at from two angles, so naming the card
after the archetype doesn't add narrative the symbol wasn't already
carrying structurally.

Each of the six needed its own distinct geometry — unlike the cycle-
phase cards, there's no single shared base construction, since a
double-well potential and a phase-locking pair of oscillators aren't
built from the same math. All six still use the deck's existing
statement/instruction discipline (see "Why not questions" above) and the
same layered-wireframe rendering technique (a primary trace, a fainter
`rest` layer, an optional `emphasis` marker) as every other card.

- **The Threshold** (`threshold`) — a double-well potential, the
  trajectory approaching the saddle point between the two wells and
  slowing as it nears it (real "critical slowing down" near a tipping
  point), never crossing decisively into either side. *Statement:
  "Something in you has been standing at the exact center, not yet
  leaning toward either side."*
- **The Guardian** (`guardian`) — a dense field of points contained
  within an irregular but closed boundary curve, with a few points
  having drifted just outside it (the boundary holds, but isn't
  absolute). *Instruction: "Notice what's being held inside a boundary
  right now, without deciding if it still needs one."*
- **The Hidden Root** (`hiddenRoot`) — a visible surface wave whose
  shape is distorted by a second, unseen component (drawn only as a
  faint dashed loop, never directly) — the influence is visible, the
  source isn't. *Statement: "Something you can't see directly has been
  shaping the shape of what you can."*
- **The Seeker** (`seeker`) — a genuine random walk (each step a random
  turn, not aimed at anything) with a couple of other possible walks
  from the same start drawn faint underneath, and deliberately no
  endpoint marker — unlike Fixed Point or the cycle cards, nothing here
  is emphasized as "arrived." *Instruction: "Notice the searching
  itself, not what it's looking for — it hasn't landed yet, and that's
  allowed."*
- **The Return** (`theReturn`) — a hysteresis loop: an outbound curve and
  a visibly different return curve, sharing only their start/end point,
  enclosing real area rather than retracing the same path. *Statement:
  "You're arriving back somewhere familiar, but not by the path that
  took you away from it."*
- **The Union** (`union`) — two oscillators with different phase/
  frequency at the left edge, gradually converging until they trace the
  same curve by the right edge — the process of phase-locking, not two
  waves that already agree. *Instruction: "Notice two things that
  started out of step with each other, quietly finding the same
  rhythm."*

## Themes (earlier question-format draft — retired, kept only for the
record of what didn't work; see "Why not questions" above)

Open question raised in conversation, not yet resolved: **who selects
the theme?** Leaning toward user-chooses-theme, then random draw within
it — same "user directs, app offers" shape as choosing a philosopher
before Measure. The app should not pick a theme *for* someone (e.g.
"today's theme is Shadow") since that would imply something about their
current state, which the governing rule forbids.

### Shadow — what you hide from yourself
- **The Mask That Fits Too Well** — Which version of you shows up so
  easily now that you forget you chose it?
- **The Room You Don't Go Into** — What would you find there, if you
  let yourself look?
- **What You Judge Fastest** — The thing that irritates you most in
  someone else — where else have you met it before?
- **The Apology You Owe Yourself** — What have you forgiven everyone
  for, except you?

### Longing — what you want but haven't said
- **What Waits for Permission** — Whose permission are you actually
  waiting for — and have you asked?
- **The Unsent Message** — If there were no consequences at all, what
  would you finally say, and to whom?
- **The Life Running Beside This One** — What does the version of you
  who chose differently get to feel that you don't?

### Ground — where you actually stand right now
- **What Survived** — Of everything you've let go of, what's still
  quietly shaping how you move?
- **The Weight You Chose** — If you set this down today, what would you
  have to admit you never needed to carry?
- **The Second Voice** — When you disagree with yourself, which voice
  do you usually believe, and why that one?

### Change — what's already shifting whether you notice or not
- **The Guest Who Stayed** — What feeling moved in a long time ago and
  never told you it was leaving?
- **What the Noise Was Covering** — In the quietest moment of today,
  what surfaced first?
- **The Undone Thing** — What have you been finishing in your head, but
  never in your life?

## Unthemed drafts (not yet sorted)

- **The Door Left Open** — What have you stopped closing, because some
  part of you is still waiting for someone to walk through it?

## Open questions (not yet decided)

- Who chooses the theme — user only, or ever the app? (leaning
  user-only, see above)
- Free vs. paid split: how much of the deck/how many themes are free,
  vs. gated behind Selfinder+ — connects to the broader Selfinder+
  segmentation discussion in progress as of 2026-08-06.
- Visual treatment: **prototyped and verified** —
  `mobile/src/components/CardSymbol.tsx`, sibling to
  `PhilosopherObject.tsx` (same wireframe register: `react-native-svg`,
  thin strokes ~1.3–2.2px, `fill="none"` except small marker dots, one
  soft radial-gradient core behind everything, `rgb(${rgb})` color prop,
  200×200 viewBox). Where `PhilosopherObject` draws platonic solids
  (cone/cube/sphere), `CardSymbol` draws physics/math forms (waves,
  orbits, phase-space fields) — see "Physics/math vocabulary" below for
  why. Eight symbols implemented and visually verified via the
  `run-mobile` skill: `openSystem`, `whatYoureCarrying`, `standingWave`,
  `interference`, `fixedPoint`, `incompleteResonance`,
  `signalBeneathNoise`, `belowThreshold` — see "Cards drafted so far"
  below for which named card each maps to. Each symbol is built from
  several layered passes (a faint construction/echo layer, harmonics of
  the main trace, scattered field points) rather than a single stroke —
  more visual presence while staying strictly wireframe, same
  opacity-for-depth technique `PhilosopherObject` already uses. The
  component draws static geometry only; per-card motion (the "barely
  perceptible drift" each one wants) is deliberately left to whatever
  screen renders a drawn card, driven by Reanimated worklets the same way
  `ConsciousnessWheel.tsx` animates its marker, not baked into the path
  math — still not implemented.
- Final name for the feature/deck — "Selfinder Cards," "the Cards," "The
  Mirror Deck" all floated, nothing chosen.
