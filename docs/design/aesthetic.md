# Selfinder visual aesthetic — the standing rule

Read this before touching any screen's visual design. It's the spec, not
a suggestion — a new screen should be built against these rules by
default, not by copying whatever the last screen happened to do.

The one-line test for anything visual added to the app: **does it still
feel like a cosy evening next to a fireplace, or does it start to feel
like a UI again?** If it's the second one, it's wrong, no matter how
clean it looks in isolation.

## Color

**One accent color for the whole app: ivory.** `#efe3cf` /
`colors.accent.ivory` (canonical hex lives in `AuraFigure.tsx` as
`AURA_NEUTRAL_COLOR` — never redeclare it elsewhere). This is the
pre-reading neutral tone and the fallback accent everywhere a screen
isn't scoped to a specific reading (buttons, links, focus states, error
text, account/settings screens).

**Once someone has a current reading, the accent becomes that reading's
level color** (`LEVEL_COLORS[slug]` from `measureConfig.ts` — the
muted-red-to-violet 17-level spectrum). Ivory is what the app looks like
before you've measured anything; the level color is what it looks like
once you have. This mapping is deliberate and should stay — the user
should feel the app is genuinely theirs once they've measured, colored
specifically by their own reading, the way a mirror shows you back to
yourself. Don't read this as "avoid color" — the goal is exactly the
opposite: keep vibration→color as a real, felt part of the product.

**The rule is ONE color per screen, not ONE color for the whole app.**
A screen scoped to a specific reading (Depths once you have a result, a
level's own detail page) shows exactly that reading's one color — this is
where personalization lives, and it should feel personal, not diluted. A
screen that is explicitly a map of the whole territory (Levels/"the map of
consciousness") is the one place showing all 17 colors together is
*correct*, because it's not reading a moment, it's showing the whole range
that exists. Never show several *different* readings' colors competing on
one screen at the same time (the old Depths sphere rows, each axis its own
hue; the old reveal-screen's gradient bar sitting under a differently-
colored combination-message, back when reveal was a separate screen from
Depths — see "One reading, one screen" below) — that's what actually read
as noise and dragged attention away from meaning. The fix was never
"remove color," it was "don't let colors fight each other on one screen."

**Depths' ring itself is a second, narrower exception to the "all 17"
rule.** `VibrationSpectrum`'s `onlySlugs` prop lets Depths show only the
four sphere colors that reading actually produced, instead of the full
17-position map — Levels, a level's own detail page, and the ring's own
arrival-spin state (see the arrival sequence in `depths/index.tsx`) all
still show all 17 unchanged; this is Depths' settled/idle ring
specifically, personalizing down to what this one reading contained
rather than repeating the shared map. The reading's own marker may land
at a fifth, distinct position from the four dots (the overall reading is
a separate computed value from any single sphere) — that's expected, not
a bug.

**Never reintroduce per-item color variety on a reading-scoped screen.**
No per-philosopher colors, no four-different-hues-for-body/mind/heart/
spirit competing on the same screen. If a reading-scoped screen wants to
distinguish N things (e.g. the four Body/Mind/Heart/Spirit readings), do
it with position, size, weight, or space, or with subdued/neutral markers
— not with N fully-saturated, competing hues. This was a real bug pattern
(`colors.axis`, per-philosopher colors, the old Depths sphere rows) that
got fixed multiple times this project; don't reintroduce it. This rule is
about competing colors on ONE reading's screen — it does not apply to the
map screen, which is showing many readings' worth of color on purpose.

**No gradient bars, anywhere — including on the map screen.** Even a
single-hue gradient bar (left = low, right = high) is a "bad → good"
visual convention (traffic lights, health bars, sentiment scores) that
Selfinder's philosophy refuses, independent of which colors are used.
The fix is shape, not just color: a closed ring/wheel has no start or
end to rank positions along — nobody reads a color wheel's red as
"worse" than its blue. `ConsciousnessWheel.tsx` (the Levels screen) and
`VibrationSpectrum.tsx` (Depths, one-color mode) both use a circle for
exactly this reason. If a future screen needs to show "position along a
range," it should be a ring, not a bar.

**One reading, one screen: Depths.** There used to be a separate "reveal"
screen that Measure finished on, showing the same reading Depths also
showed — same four spheres, same combination message, just repeated. That
was a real redundancy bug (a "see the full reading" link that led to
nothing fuller, just a repeat) fixed by folding everything reveal owned
(aura, headline, four wheel rows, conversation transcript, next-step
actions) into Depths itself, and deleting the reveal route entirely.
Measure finishing now routes straight to Depths. Any future screen that's
tempted to show "the current reading" again is very likely reintroducing
this same bug — extend Depths, or make sure the new screen's job is
genuinely different (a record of what was said, not another mirror of
what is).

**Rows with different jobs don't share a shelf just because they're
nearby.** A *reference* (e.g. the conversation transcript — what was
actually said) belongs right against the reading it explains; a *next
step* (Measure again, Talk about it) belongs with other next steps. Two
categories stacked together with no clear break read as one
undifferentiated list. When repositioning anything, ask "is this what-is,
or what-next" before deciding where it sits.

**A next step some users are meant to genuinely adopt (not just notice)
gets full row weight, not a quieter link.** "Talk about it" — continuing a
conversation about a past reading — is styled identically to "Measure
again" (label + description, same row treatment) rather than as a
smaller/quieter afterthought, because letting someone feel what an ongoing
conversation is like is a deliberate goal (it's the Selfinder+ seed — see
`RULES.md`, Product/positioning), not an incidental option to bury.

**One narrow exception: `colors.danger`** (`#f67474`) for genuinely
destructive actions (delete account). This is deliberate — a destructive
action should read as different from the calm accent, not softened into
it. Don't reach for it for anything short of "this cannot be undone."

**`LEVEL_COLORS` and `AXIS_COLORS` are warmed toward ivory, not left at
full saturation.** Both still run their original gradient/hue-family (red
low → violet high for levels; the four axis hues) — that ordering is real
information and stays. But every stop is blended toward
`AURA_NEUTRAL_COLOR` and slightly desaturated, because at full saturation
the cool end (reason/love/unconditionallove/peace, and clarity in
AXIS_COLORS) read as a jarring blue-on-warm clash against the ivory
background and text everywhere around it. If either map is ever
regenerated or a new level color is added, warm it the same way — don't
add a fresh fully-saturated hue back in.

**Text is a four-step ivory opacity ladder**, not a separate gray palette:
```
colors.text.primary   rgba(239,227,207, 0.97)
colors.text.secondary rgba(239,227,207, 0.70)
colors.text.muted     rgba(239,227,207, 0.52)
colors.text.faint     rgba(239,227,207, 0.32)
```
These replaced a cool lavender-gray scale (`rgba(241,234,253,...)`) that
was the app's original default and silently fought the warm ivory
everywhere it sat near it — 171 call sites, fixed in one pass. If you
ever see a hardcoded `rgba(241,234,253,...)` or `#c39fff` / `#74ddd6`
(the old `colors.brand.purple/teal`) anywhere, that's a regression —
replace it with the current token.

**Background: one warm, low-center glow, everywhere, always.**
`<AmbientGlow />` — ivory, ~9% opacity at its core, centered low
(`cx="50%" cy="72%"`), echoing the aura figure's own chest-glow origin
point. Not two corner blobs (that was the old, retired version — a
generic "dark SaaS app" gradient signature that also happened to be
cool-toned). Every screen gets this, including screens that don't show
the aura figure — a screen with no glow at all reads as an
inconsistency, not a deliberate choice. The glow should always be barely
perceptible; if you can describe it without squinting, it's too strong.

**Background base:** `colors.bg.base` = `#06060d`, near-black, never pure
`#000`.

## Typography

**One typeface: Panchang.** Currently mapped to the Medium weight file
for both `fonts.light` and `fonts.medium` (see the comment in
`typography.ts` — thin strokes haloed on the near-black background and
were hard to read in body text). This is a live, not-fully-settled
experiment; if a real second weight is introduced later, it should
still be exactly one typeface family.

**Hierarchy is carried by size, not weight** (since there's currently
only one weight in practice). Use the existing scale
(`fontSizes.xs` through `hero`) rather than inventing new sizes per
screen.

## Motion

**Things gather, condense, and become — they don't slide or pop.**
Reference implementations: dots converging into a word (onboarding), a
line closing into a ring that then literally travels to become the
picker's ring (not two rings faded across a cut), a body blooming in
from a spark rather than fading in place. Always ease with a slow,
soft deceleration (`Easing.bezier(0.16, 1, 0.3, 1)` is the standing
choice, named `SOFT_EASE` in onboarding) — never a bouncy/springy easing,
never a sharp linear cut.

**Causality over coincidence.** If two things happen close together in
time, one should visibly cause the other (spark ignites → body blooms
because of it), not just both start "at the same time" for no reason a
viewer could name.

**No motion without meaning.** A "breathing" ambient pulse is fine on
the aura figure specifically (it's alive), but don't add idle animation
just to make a screen feel less static — cut dead time instead of
padding it with motion. (Cautionary tale: the onboarding intro used to
have ~400ms of pure idle breathing before the first word appeared,
purely because two independently-tuned timers didn't line up — it read
as pointless, not alive, and got cut.)

## Structural rules

**No cards.** No bordered/filled rectangles as the default way to
separate content (`borderWidth` + `backgroundColor: colors.bg.elevated`
boxes). Separate things with space, typographic hierarchy, and group
labels instead — the philosopher-picker screen and onboarding never use
a box to mean "this is a thing." (Depths used to be built entirely from
cards — sphere rows, tool rows, the lucky row — and was the one screen
that didn't match; it was rebuilt around this rule.)

**Position and size carry differentiation, not boxes or color.** The
philosopher-picker distinguishes five philosophers by ring position and
label placement, not by five different background colors or five
bordered boxes.

**Reuse an existing pattern before inventing a new one.** The ring-based
position marker (`VibrationSpectrum.tsx`, `ConsciousnessWheel.tsx`) exists
specifically because a fill-bar/percentage/raw-score display implies
"more filled = better" — a judgment Selfinder's whole philosophy refuses
to make about any vibration. Never show a bare numeric score next to a
level name; show position on a ring instead, or drop the number and name
the level.

## Interaction

**Explore by dragging, not by reading a list of labels.** When a screen
needs to represent many named positions at once (e.g. all 17 vibration
levels on the map), prefer a single draggable marker on a ring over
static labels crowding the shape — `ConsciousnessWheel.tsx` shows no text
at all until you're pointing at something, then names exactly the one
thing you're touching. This keeps the shape itself quiet (per the "no
motion/decoration without meaning" rule) while still making all the
positions genuinely explorable, not just visible.

**Snap to real positions, don't allow arbitrary values.** There are 17
named vibration levels, not a continuous scale — a drag gesture should
snap the marker to the nearest real level (see `nearestLevelIndex` in
`ConsciousnessWheel.tsx`), never leave it resting "between" two levels.
The drag itself can track the finger continuously for feel; only the
settled/rest state needs to snap.

## Copy register that pairs with the visual rules

Not strictly "visual," but load-bearing for the aesthetic: prefer a real
sentence over a label-colon-data row ("today, you read as reason" not
"Your last reading — today: Reason · 412"). A philosopher's own voice
(italic) sits above a plain, unitalicized clarifying line when a term
needs explaining (e.g. "Measure" on first meeting) — two layers, not one
replacing the other. See `RULES.md`'s Content/voice section for the full
copy/voice rules, and `docs/pitch.md` for the outward-facing pitch itself;
this file is about how that voice is *styled*, not what it says.

## What's still open / not yet decided

- Whether Panchang ever gets a second real weight, or whether
  single-weight-forever becomes the permanent rule.
- No enforcement mechanism exists yet (no lint rule blocking a
  reintroduced `colors.brand.purple`-style hardcoded hex) — this doc is
  the only guard right now. If a future session is asked to add a lint
  rule for this, that's a reasonable thing to build.
