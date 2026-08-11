# Session result / the wish — concept draft (not yet built)

Status: concept/content draft only. Nothing in this file is implemented.
Captured here so the direction isn't lost. Governing rule: `RULES.md`,
"The answers are already inside the person" — this feature exists
specifically to give the free session a felt close without ever having
the app supply, complete, or judge the user's own material. See also
`docs/cards-concept.md` for a related but separate mechanism.

## The problem this solves

Depths currently shows the result of *Measure*, not the result of a
*session* — if someone does Tune In, Guide, or Spill after Measure and
returns to Depths, nothing on screen reflects that anything happened
after the reading. There's no felt close to the visit as a whole, only
to the reading itself. This is the gap this feature fills — not by
adding a summary/score screen (that would reintroduce the reveal-vs-
Depths redundancy bug RULES.md already documents), but by giving Depths
slightly more to hold: what was wished for, and lightly, what was done.

## The wish

Right after Measure's four questions (body/mind/heart/spirit), a fifth,
distinct beat: something like *"If this could feel like anything you
wanted, what would that be?"* — free text, same register as the other
Measure questions. This is captured once per reading, alongside it, not
a recurring daily prompt.

**Why this works inside the no-advice rule:** the app never evaluates,
completes, or responds to the content of the wish. Articulating it is
already the mechanism — the value is in the person writing it, not in
anything the app does with it afterward. The app's only jobs are: hold
it, protect it, and optionally return it later, unedited.

### Visibility — held, not displayed

The wish should not be quoted back verbatim on Depths' main surface by
default. It's sacred (the user's own framing) and showing it too
prominently risks reading as a goal to be graded against, which would
reintroduce judgment ("did you achieve your wish?") by the back door.
Instead: it exists, tucked behind a tap (same pattern as the collapsed
conversation transcript), available to whoever wants to look, never
pushed back in front of them uninvited in the same session.

### No content-echoing, ever — this is a hard boundary

Rejected direction, recorded here so it isn't proposed again: having
Depths respond to the *content* of the wish, e.g. user writes "I wish I
were more successful" → app replies "welcome to the most successful
version of you." This was considered and explicitly ruled out for two
reasons:

1. It's the app completing the user's sentence for them — an identity
   claim about the user, which is exactly what "never tells the user
   what they think, feel, or should do" forbids. Positive judgment is
   still judgment.
2. It requires the system to parse and meaningfully respond to arbitrary
   free text, which has no safe general solution — a response mechanism
   built to affirm "I wish I were more confident" cannot distinguish that
   from concerning or harmful content without becoming a full moderation
   + interpretation system (see Safety section below). The two problems
   (reflect content / stay safe) can't both be solved by "the app reads
   and responds to what you wrote."

**Standing rule:** nothing in this feature ever paraphrases, interprets,
or generates a response calibrated to what the user wrote in a wish.
Later resurfacing (see Open questions) must show the wish's own words,
unedited, or not at all — never a transformed/responded-to version.

### Routing into Tune In / Breathing — content-agnostic

Instead of echoing the wish's content, the app can route toward Tune In
or Breathing with framing that works identically no matter what was
written — e.g. *"Sit with this as if it's already so"* before a sound or
breathing sequence. This keeps the known power of "imagine it's already
real" (a real technique, not app-invented) while requiring zero parsing
of what the wish actually said. The invitation is the same sentence
every time; the person supplies the specific content themselves,
silently, in their own head.

## What was done — the session's second half

If the person goes on to Tune In, Breathing, Guide, or Spill after
Measure and returns to Depths **in the same visit**, Depths should
update live (not just on a future visit) with a quiet trace of that —
one plain sentence per tool used, in the app's existing register, e.g.
"You sat with this for a while afterward." Not a checklist, not a badge,
not a timer — just acknowledgment that the session extended beyond the
reading. This is what actually makes a longer session feel like it
*closed*, versus Measure alone which already closes itself via the
existing arrival ritual.

This likely needs a small piece of session-scoped state (not
permanently baked into the saved reading the way the wish is, since
"what was done after" can accumulate across a single visit) — probably
new, not an extension of `measureStore`'s persisted reading shape.
Analytics (`mobile/src/utils/analytics.ts`) already knows when these
tools are used; this is a matter of also surfacing that back to the UI
in-session, not new tracking.

## Safety: wishes must not target harming or taking from anyone

A wish is for the person, about themselves — not a vehicle for wishing
harm on, or control over, someone else. This needs to be handled as
content moderation, architecturally separate from the reflection
mechanism above (the no-content-echoing rule above means the *reflection*
path never reads the wish's meaning — the *safety* path is a different,
narrower system that only ever returns pass/fail, never a generated
response about the content):

1. **A stated ground rule as a footnote on the question itself**, not a
   separate explainer block — e.g.:
   > How do you wish it was?
   > *A wish can't harm or take from anyone.*

   Small, asterisked, always present (not just first-time) since it's
   short enough to not intrude — same "plain clarifying line under the
   voice" pattern used elsewhere (`RULES.md`, Content/voice), just
   condensed to its shortest form and attached directly to the question
   rather than shown as a separate paragraph.
2. **A moderation check on submission**, separate infrastructure from
   anything in the reflection/resurfacing pipeline — checks for wishing
   harm on a real person, violence, or self-harm intent. On a trip: the
   wish is not saved, and the user gets a gentle redirect, not a lecture
   ("that doesn't sound like a wish for yourself — want to try again?").
   Self-harm-specific signals should route to a more serious path (crisis
   resources), independent of this feature.
3. This moderation gate must never become a second content-echoing
   mechanism — it only ever classifies pass/fail (+ category, for
   routing), never summarizes or responds to the wish's specific content.
4. Privacy implication: a moderation pass means the wish's content is
   read by something (even if only an automated filter) before storage.
   Worth reflecting in a future privacy policy update if this ships,
   alongside whatever consent line covers wishes/session data generally.

## Relationship to the paid tier

The wish is the cleanest instance yet of the three resurfacing
mechanisms already agreed on for Selfinder+ (see prior conversation,
not yet written into a dedicated paid-tier doc):
- **Pure resurfacing**: "Two months ago, you wished it could feel like
  ease. Here's what you wrote today." — verbatim, no interpretation.
- Must stay **valence-blind**: resurfaced wishes are chosen by
  recurrence/timing, never by whether they read as struggle vs. ease —
  otherwise the feature silently becomes a problem-finder despite
  neutral wording.
- Resurfacing a wish should be **offered, not pushed** — same "held, not
  displayed" stance as the free-tier version, just extended across time
  instead of within one session.

## Open questions (not yet decided)

- Exact copy for the wish question and the ground-rule line.
- Where exactly the wish sits on Depths (which tap-to-reveal element it
  lives near — proposed: adjacent to the collapsed conversation
  transcript, since both are "what was said" material).
- Data model for session-scoped "what was done" state — new store vs.
  extending an existing one.
- Whether "what was done" resets if the user leaves the app entirely and
  returns later, or persists as part of that reading's permanent record.
- Concrete moderation implementation (which model/classifier call, where
  it lives in `backend/`).
