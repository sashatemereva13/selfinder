# App architecture — DEPTHS / JOURNEYS / YOUR ARC (concept draft)

Status: concept/design draft only. Nothing in this file is implemented
yet. Captured after a design conversation proposing a full navigation
restructure, reconciled against the actual current app (verified via
direct code exploration, not assumption — see "Current state, verified"
below). Supersedes `docs/depths-structure-concept.md`'s scope (that
doc's own zone logic — Find out / Understand it / Shift it — is *kept
and extended*, not replaced; see "What carries forward" below) by
widening from "how is Depths itself organized" to "how is the whole app
organized." Governing rules: `docs/design/aesthetic.md` (position/size/
weight/space as the only sanctioned differentiation levers — no cards,
no icons, no per-row color) and `RULES.md`'s Product/positioning section
(free-core-never-gated, Your Arc vs. Journeys' different shapes of paid
depth, the anti-diagnosis rule). The visual world built this session and
prior sessions — the spiral, the aura figure, the kaleidoscope, the
symbol cards — **stays**; this document changes what role each piece
plays, never proposes removing the world itself.

## The core reframe

Selfinder currently reads as an app that accumulated good features —
Measure, Guide, Spill, Cards, Levels, Tune In, Breathing, Your Arc,
Journeys — organized as a list of things you *can do*, not as a
coherent world with places you *go*. The fix is not removing capability.
It's giving everything a role inside one underlying question:

> Something is happening within me. What do I want to do with it?

Three fundamentally different relationships a person can have with
themselves, matching three tabs:

- **DEPTHS — where am I now?** The immediate state. Measure → reading →
  a small set of intentions for what to do with it.
- **JOURNEYS — what do I want to understand?** A question that needs
  deliberate investigation across several turns. The 12-Journey catalog,
  organized by the Past/Present/Future temporal architecture already
  built in `docs/journeys-concept.md`.
- **YOUR ARC — what has been happening across time?** Memory,
  continuity, pattern, every past reading/conversation/card/Journey
  result, one connected record.

## Current state, verified (2026-08-27) — the actual starting point

This section is the ground truth the rest of this doc designs against,
confirmed via direct code exploration rather than recalled from memory.

**Bottom tabs today**: `Depths · Guide · You` (`app/(tabs)/_layout.tsx`).
Guide's tab icon carries a small dot badge when a philosopher has been
chosen but not yet "met" (clears the instant Guide opens).

**Depths' spiral** (`src/components/DepthsSpiral.tsx`,
`app/(tabs)/depths/index.tsx`) is a real Dürer-style conical spiral, 3
full winds, already organized into three named zones per
`depths-structure-concept.md`'s own resolved design — "Find out where
you are," "Understand it," "Shift it, if you want to" — mapped onto 8
fixed slots:

- **Wind 1 ("find yourself")**: Measure, Spill, Talk about it, Cards
  ("Draw a symbol")
- **Wind 2 ("learn")**: Your Arc, Levels
- **Wind 3 ("regulate")**: Tune In, Breathing

Each slot has a fixed angular position (always reserved) and its own
visibility gate:
- Measure — always present, label swaps to "Measure again" once a
  reading exists.
- Spill — only once `discovered.spill` (engagement-store flag) is true.
- Talk about it — only once both a reading AND a philosopher exist.
- Cards — only once any reading exists.
- Your Arc — only once 2+ readings exist (local device log or server
  count, whichever is higher).
- Levels, Tune In, Breathing — always present, never gated.

There's also **Feeling Lucky**, deliberately outside the spiral/sequence
("an alternative to the whole thing," per its own code comment) — "A
message for right now" / "Skip finding out — let something find you
instead." And **Moon**, deliberately parked/unlinked from any nav,
reserved for future paid content — not part of this restructure.

**Cards ("Draw a symbol")** (`app/(tabs)/depths/cards/index.tsx`,
`docs/cards-concept.md`): draws one random symbol from a 20-card deck,
no inference from the reading (deliberately — the reading only
*motivates the offer*, never influences *which* card is drawn). From the
card: "Talk to {philosopher} about it" (seeds Guide), "Spill about it"
(seeds Spill), "Draw again." Single current entry point: the spiral's
Cards slot.

**Guide** (`app/(tabs)/guide/index.tsx`): a single persistent chat per
philosopher, not gated behind a reading — if `!currentResult`, Guide
shows an explainer + a "Take Measure" CTA, meaning **Guide today is
already reachable as its own destination, unprompted, via the tab**.
Two real reading-continuation mechanisms exist beyond the spiral's own
"Talk about it": `handleTalkAboutIt` (whole-reading context) and
`handleTalkAboutSphere` (a *specific* Body/Mind/Heart/Spirit answer's own
context, triggered from tapping that sphere directly under the aura
ring, not from the spiral) — both set `pendingMeasureResultId` and seed
an opening message. A **nudge banner** inside Guide itself (after a
reading, if the philosopher's been met before) offers "Levels" and
"Tune In" as two more buttons — meaning **Levels/Tune In are already
reachable from inside Guide today**, not just from the spiral.

**You tab** (`app/(tabs)/you/index.tsx`), full current row order:
philosopher (name/mode/description + "Change who walks beside you →")
→ Language → Appearance → Daily reminder → "How to use Selfinder →" →
"Products →" → "Where this comes from →" → Account (sign-in/consent/
Arc-subscription-status/Center-purchase-count/reading-history/security/
privacy/sign-out).

**Levels, Tune In, Breathing**: Levels and Tune In each have a second
entry point via Guide's nudge banner (above); Breathing has none beyond
the spiral. All three also appear in a first-time "discovery nudge"
mechanism inside Depths for users who haven't tried them yet.

**Products/Journeys** (`app/products.tsx`): single entry point, You
tab's "Products →" row. Already organized by the Past/Present/Future
temporal groups from `docs/journeys-concept.md`, with Center given
top billing above the three groups (only Journey with real content
today).

**Center** (`app/center.tsx`): single entry point, `products.tsx`'s own
catalog row. Its purchase count is *shown* (not linked) inside You's
Account section.

**Your Arc**: single entry point, the spiral's Your Arc slot, which
overrides its nominal route at click time (`isSubscribed ? '/your-arc' :
'/your-arc-preview'`). Not linked anywhere from the You tab today (only
subscription-status *text*, no navigable link).

## What carries forward from `depths-structure-concept.md`

That document's core idea — three zones, differentiated by *distance
from the center* using only position/size/space, never icons or color —
is not being replaced. It's the origin of the "Find out / Understand it
/ Shift it" language this document reuses for Depths' own post-reading
choice. What changes is scope: that doc designed this as an in-Depths
spatial metaphor for *all 8 slots at once*; this document keeps the same
zone *logic* but changes *what's inside each zone* once Journeys and
Your Arc become their own tabs (see below) — Depths' own zones get
smaller, not because the idea was wrong, but because two of the three
current winds (Your Arc/Levels, in "learn") no longer belong entirely
inside Depths once Your Arc has its own tab.

## The three tabs

### DEPTHS — where am I now?

Stays the entry point (Measure remains first-run's obvious action,
unchanged). **The aura figure and the spiral both stay exactly where
they are, visually — this restructure does not remove or shrink them.**
They remain Depths' actual centerpiece, pre- and post-reading alike; the
spiral's *job* changes (see "The spiral's new meaning" below) but its
presence on screen doesn't. Stay/Understand/Shift is a **new layer added
beneath the existing aura+spiral**, not a replacement of that screen —
reached by scrolling down from the aura, the same "hero first, next beat
follows" pattern already used elsewhere in this app (e.g. Your Arc's own
paged screens), not a second competing focal point fighting the aura for
attention. Concretely, top to bottom on the same screen: aura figure +
spiral (unchanged position, now tracing what's been done rather than
listing what can be done) → the reading's own level name, tappable →
Stay/Understand/Shift, appearing once a reading exists:

> **Willingness.** [reading, unchanged]
>
> What would you like to do with what's here?
>
> **Stay with it** — Draw a symbol
> **Understand it** — Talk with {philosopher}
> **Shift it** — Breathe · Tune In

Reconciling this against verified current gating, not inventing new
rules: "Stay with it" (Cards) already requires a reading to appear
(matches today's gate exactly). "Understand it" (Guide) already requires
both a reading and a chosen philosopher for the *reading-continuation*
version (`handleTalkAboutIt`) — this is unchanged, just re-labeled and
re-grouped. "Shift it" bundles Tune In and Breathing under one
intention, replacing two separately-named spiral nodes with one choice
between two modalities — the two are peers under this framing, neither
implied as more correct, matching `RULES.md`'s standing "never implies a
vibration is good or bad" applied here to *regulation methods* rather
than *states themselves*: choosing to stay is as valid an answer as
choosing to shift.

**Spill's placement — decided: joins "Stay with it," alongside Cards.**
Not explicitly covered in the original proposal (it lists Cards/Guide/
Tune In/Breathing but omits Spill, confirmed via code that Spill is a
real 4th "find yourself" slot today, gated on `discovered.spill`, not
always-visible). "Stay with it" is about staying with what's here
without needing to explain or resolve it yet — free-writing fits that
intention as naturally as drawing a symbol does, just through words
instead of image. Both become "Stay with it"'s two options once Spill
has been discovered:

> **Stay with it**
> Draw a symbol · Spill

Spill's own gating (`discovered.spill`) stays as-is — it only appears
once discovered through some other path (Guide's `suggestSpill` CTA,
Cards' "Spill about it"), same as today; "Stay with it" simply shows
Cards alone until Spill has been discovered, then shows both.

**Levels' placement**: pulled out of the action list entirely, matching
the proposal's own reasoning (Levels is knowledge, not an action) — the
reading's own level name becomes the entry point ("Willingness" itself
tappable → that level's own detail page, which already exists as a
separate route from the Levels map/index — confirmed via exploration),
plus a quieter "Explore the map of states →" link for browsing the whole
framework, not equal-weight with Stay/Understand/Shift.

**Feeling Lucky and Moon**: unaffected by this restructure — Feeling
Lucky stays exactly as it is today (deliberately outside the sequence);
Moon stays parked.

### JOURNEYS — what do I want to understand?

Gets promoted from a `You → Products →` sub-page to its own tab. Content
is already built correctly for this: `products.tsx`'s existing Past/
Present/Future grouping (from the already-completed Journeys-catalog
follow-up) becomes this tab's actual content, largely as-is — the
restructure here is almost entirely about **where it's reached from**,
not what's on the page. Two real content changes worth making at the
same time, both already implied by the proposal and consistent with
existing rules:

- **Rename "Products" away** — per RULES.md's own "never build a tap
  target that looks like it leads to a purchase and doesn't" discipline,
  applied in reverse here: a page titled "Products" undersells what's
  actually there. The catalog's own question-first framing (already
  built — "What am I really trying to control?" not "Control") already
  does the work of making this feel like a library of questions, not a
  shop; the page title should say the same thing. A working title:
  **"Journeys"** as both the tab label and the screen's own `t('...
  title')` — no separate "Products" word needed anywhere in the
  experience once "Journeys" is doing that job as the tab name itself.
- **Center's framing**: stays reachable from this tab (it's still a
  one-time-purchase experience, per RULES.md's own product/positioning
  section, unchanged commercially) but reconsider its *presentation* —
  see "Center's home" below, since the proposal makes a real, separate
  argument about where Center is best understood from, distinct from
  where it's purchased from.

### YOUR ARC — what has been happening across time?

Promoted from a spiral slot (reached only after 2+ readings, nested
three levels deep: tab → spiral → Your Arc) to its own top-level tab —
the single largest structural elevation in this whole restructure,
consistent with the proposal's own strongest instinct ("Your Arc has
become important enough that it changes the navigation architecture").

The 2+-reading gate for the tab's own *content* doesn't disappear — it
becomes what Your Arc's tab *shows* rather than whether the tab exists:
someone with 0-1 readings still sees a Your Arc tab, landing on
`your-arc-preview`'s existing content (unchanged mechanism, just reached
directly instead of via the spiral). This matches RULES.md's own
"Your Arc is free-trial-then-subscribe, not gated from reading #1" rule
exactly — the tab itself is never gated, only its depth of content is,
identical to how the screen already works today.

**Center's home — decided: Your Arc, primary, not just a second door.**
This isn't a new idea being tested — it's closer to a reversion. Per
`RULES.md`'s own product-history account, Center was originally spun out
*of* Your Arc's own Cover/Cone pages (the light cone + kaleidoscope lived
inside Your Arc before becoming a standalone one-time-purchase product).
Confirmed via `kaleidoscopeData.ts`'s own header comment that Center is
still, mechanically, generated live from the person's saved reading
history (`getMeasureHistory`) — nothing about *how* Center works ever
stopped being an Arc-shaped operation, only where it was surfaced did.
Resolution: Center's primary, prominent home becomes Your Arc's own
screen — implemented as a full-weight row (label + description, same
treatment as `journeys/index.tsx`'s own catalog rows) on Your Arc's Facts
page, right after the intro line and before the dense stat rows, showing
a real purchase count once one exists (`useJourneyPurchases('center')`)
and always routing to `/center`. Center's own purchase-count *text* was
removed from the profile screen's Account section at the same time,
since the connective-tissue principle this document states means a fact
shouldn't live in two places once one of them is a real link, not just
status text (`src/components/AccountSection.tsx`).

**Center's secondary listing — decided: keep it.** Whether Center also
keeps a listing in the Journeys tab's catalog (for discoverability/
consistent purchase-flow treatment with its siblings) or moves out of
that catalog entirely now that it has a real home in Your Arc — resolved
in favor of keeping it: the Journeys tab is "every Journey," and Center
is still a Journey commercially, so removing it there would make the
catalog inconsistently incomplete for no real benefit. The commercial
mechanism (one-time purchase, `journeyPurchases[]`) is unaffected either
way — this was a presentation/IA decision, not a pricing or entitlement
one.

## The spiral's new meaning

The proposal's most conceptually interesting single idea: the spiral
stops being a menu (implying a sequence — Measure → Talk → Draw → Arc →
Levels → Tune In → Breathe — that doesn't actually exist as a real
order) and becomes **a trace of what actually happened in this specific
visit to this specific state**. Confirmed against the existing
implementation that this is a real rebuild, not a relabel: today's
`prefixCount`/`PREFIX_WALK_KEYS` mechanism already tracks *today's*
Levels→Tune In→Breathing visits as a bright dashed trace — this proposal
generalizes that exact mechanic (already built, already proven) to the
whole spiral and to the current reading specifically, not just "today."

Recommended shape, grounded in the existing trace mechanism rather than
invented fresh: each spiral slot's dot brightens/fills the moment the
person actually does that thing during this reading's session (Measured
→ dot fills; talked with the philosopher → dot fills; drew a card → dot
fills), using the same visual language `PREFIX_WALK_KEYS`'s dashed trace
already establishes. The spiral is still always fully visible (every
slot's position is fixed and reachable, per the existing "always
reserved" design) — what changes is that the **trace** now means "what I
did," not "what I could do," and that trace is what gets carried into
Your Arc once the reading's own visit ends (see below).

## The connective tissue: everything leaves a trace in Your Arc

The proposal's strongest structural claim, worth stating as a hard
requirement rather than an aspiration: every meaningful action anywhere
in the app — a Measure reading, a Guide conversation, a drawn card, a
completed Journey — should be visible from Your Arc afterward. Most of
this already exists in some form (Your Arc's own current build already
surfaces reading history, wishes, and linked conversations, per earlier
session work on `your-arc.tsx`) — the restructure's job is making Your
Arc's own screen the *one place* all of these are actually reachable
from, rather than scattered (Center's purchase count sitting in You's
Account section, unlinked; a Journey's own reflection having no
after-the-fact home at all today, since `JourneyReflection.tsx` is a
terminal in-wizard screen, not something revisited from anywhere).

## You becomes a profile page, not a tab

Matches the proposal's own reasoning closely — nearly everything
currently on You (language, appearance, reminders, account, privacy) is
genuinely settings, not a "place" in the DEPTHS/JOURNEYS/YOUR ARC sense.
Recommended: a profile/settings icon (top corner, likely on Depths or
globally) replaces You's tab slot. Reorganized content, reconciling the
proposal's suggested grouping against the verified actual current rows
so nothing gets silently dropped:

- **Your guide** — philosopher name/mode/description + "Change who
  walks beside you" (unchanged mechanism).
- **Selfinder** — "How to use Selfinder," "Where this comes from" (both
  unchanged rows, just regrouped under a clearer heading than today's
  flat list).
- **Preferences** — Language, Appearance, Daily reminder (unchanged).
- **Account** — sign-in/consent/Arc-subscription-status/reading-history/
  security/privacy/sign-out (unchanged) — **with reading history and
  Center's purchase count removed from here**, since both now belong in
  Your Arc per the connective-tissue principle above (reading history
  literally *is* Your Arc's own content; Center's purchase count becomes
  a real link once Center is reachable from Your Arc, not just a status
  string).

## What Guide's demotion actually means (resolved, not still open)

Confirmed with the user directly: Guide loses its bottom-tab slot, but
**stays reachable as its own standalone destination, not gated behind
having just measured something** — this is a real constraint on the
design, not a detail to improvise later. Concretely: Guide needs a real,
prominent (not buried) entry point once it's no longer a tab — the
strongest candidate, consistent with "the philosopher becomes a presence
throughout Selfinder rather than a destination" (the proposal's own
framing) is a persistent, quiet philosopher-presence affordance on
Depths itself (e.g. a name/portrait element near the aura, always
tappable, always leads to Guide regardless of reading state) — this
needs its own visual design pass, not specified further here, but the
requirement itself (standalone entry, unprompted, no reading required)
is settled and must survive whatever that pass produces.

## Summary table

| | DEPTHS | JOURNEYS | YOUR ARC |
|---|---|---|---|
| Question | Where am I? | What am I trying to understand? | What has been happening over time? |
| Time | Now | Past ↔ Now ↔ Future | Across time |
| Nature | Experience | Investigation | Memory |
| Free/paid | Core free experience | Paid individually | Free-trial-then-subscribe |
| Contains | Measure, philosopher presence (→ Guide), Stay with it (Cards, Spill), Tune In, Breathing, Feeling Lucky | The 12-Journey catalog (Past/Present/Future) | History, conversations, drawn symbols, completed Journeys, Center (primary home) |

Levels sits underneath the whole system as its conceptual map, reached
contextually (a reading's own level name, a quiet "explore the map"
link) rather than as a peer destination.

## What's still open / not yet decided

- **Resolved 2026-08-27, implemented**: Depths' post-reading Stay/
  Understand/Shift choice is built (`app/(tabs)/depths/index.tsx`, new
  `intentionSection`) — appears once `currentResult` exists, right below
  the unchanged aura+spiral, above the pre-existing "Feeling Lucky"
  section. Verified live via `run-mobile`: all three rows navigate
  correctly (Cards, Guide via `handleTalkAboutIt`, Tune In), Spill's
  existing `discovered.spill` gate still governs "Stay with it"'s second
  option, "Explore the map of states →" reaches the Levels index. The
  spiral itself kept every remaining dot as a live tap target (Your Arc's
  own slot removed since it's now a tab; Cards/Spill/Talk-about-it/
  Levels/Tune In/Breathing dots still work exactly as before) — a
  deliberate scope decision, not an oversight: the "spiral becomes pure
  trace, dots stop being tap targets" idea from this doc's own "The
  spiral's new meaning" section was explicitly deferred, accepting the
  resulting duplication (e.g. "Draw a symbol" reachable both from the
  spiral's Cards dot and the new Stay row) as a smaller follow-up rather
  than risking `DepthsSpiral.tsx`'s hand-tuned geometry in the same pass.
- **Resolved 2026-08-27, implemented**: the persistent philosopher-
  presence affordance that replaces Guide's tab slot is built
  (`src/components/PhilosopherPresence.tsx`) — a quiet name + badge row
  above the aura+spiral, always visible once a philosopher is chosen,
  always routes to `/guide`. Verified live: visible with zero readings,
  tapping it reaches Guide correctly.
- **Resolved 2026-08-27, implemented**: the profile/settings icon is a
  persistent element visible from all three tabs, not just Depths —
  settings should be reachable from wherever someone is. Built as a
  shared component (`src/components/ProfileIcon.tsx`, reusing the
  existing `YouTabIcon` glyph), rendered at the same absolute top-right
  position on Depths' index, Journeys' catalog, and both Your Arc screens
  (`your-arc.tsx` subscribed, `your-arc-preview.tsx` unsubscribed) — not
  on Depths' nested tool sub-routes (Measure, Cards, etc.), matching the
  intent that this marks the three tab roots specifically. Always routes
  to `/profile` (You's replacement, see the section above). Verified live
  via `run-mobile`: visible and correctly positioned on Journeys and
  Your Arc-preview, tapping it reaches the profile screen correctly.
- The exact mechanism for "every action leaves a trace in Your Arc" for
  the pieces that don't yet have one — specifically, Journey completions
  (today's `JourneyReflection.tsx` is a terminal, non-revisitable screen)
  need a real persisted, browsable home in Your Arc; this is real
  implementation work, not just a re-link, and should get its own
  planning pass once this document's IA is agreed.
- Whether Center keeps a secondary listing in the Journeys tab's catalog
  once Your Arc becomes its real home, or moves out of that catalog
  entirely — noted above as a smaller follow-up, not blocking.
- Implementation phasing — this restructure touches navigation config,
  Depths, You, Journeys' entry point, Your Arc's entry point, and the
  spiral's own rendering logic. A phased implementation plan is a
  separate deliverable from this design document.
