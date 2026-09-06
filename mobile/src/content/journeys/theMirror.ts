import { JourneyStage } from '../../types';

// The Mirror — "why does this person affect me so strongly?" Seventh
// worked example (docs/journeys-concept.md's "The Mirror" section). The
// founding distinction this Journey's whole design rests on: three
// sources of intensity, not one — what belongs to them, what belongs to
// me, and what happens specifically between us. This Journey's central
// discipline is preserving the other person's reality and separateness
// throughout — get this wrong and Selfinder becomes a tool for
// self-gaslighting, not just an app with a weak premise.
//
// REALITY CHECK (its own stage below, deliberately not folded into
// anything else) is, per the doc, "the single most load-bearing slot in
// this Journey, and arguably across the whole document so far" —
// psychoanalytic exploration can become dangerous if every real behavior
// gets reduced to "it's just your projection." This stage must be able
// to conclude "no, they are actually repeatedly doing something real"
// and STOP there fully — not every answer routes back into "this is
// about my past." The word "projection" is never used anywhere in this
// Journey's own copy, per the doc's own deliberate content choice.
//
// 2026-09-03 research-verification pass (see the psychoanalytic-grounding
// review of this Journey): reality-check was rewritten from a single
// proportionality question ("how much does your reaction make sense as a
// response to what's actually happening") to a two-part check, because
// proportionality alone is a weak solo criterion — a small-looking
// trigger can produce a large, entirely reasonable reaction when it
// reproduces a REAL, REPEATED pattern from that specific person, and
// treating "big reaction to small-looking event" as automatic evidence
// of "it's about my history" is itself a non sequitur, exactly the kind
// of over-interpretation this stage exists to prevent. The two parts,
// pulled from CCRT scoring discipline (a theme is only real once it
// recurs across more than one instance, corroborated by specific
// behavior — not felt intensity alone): (1) evidence — has this
// SPECIFIC person done this SPECIFIC thing more than once, concretely;
// (2) fit — does the size/shape of the reaction match what a reasonable
// person would feel toward that documented pattern, or does it carry
// more weight than this one relationship could account for. Both can be
// true at once (a real, repeated harm AND some extra personal weight) —
// the stage must never force an either/or, and "this is real, this is
// about them, and that's the whole answer" must be modeled as a complete
// stopping point, not a lesser one.
//
// The stage's own goal text (see journeyController.js's STAGE_GOALS)
// also now offers a third alternative candidate answer, not just the
// binary of {about-them, about-my-history}: sometimes the intensity
// genuinely started somewhere else entirely (a bad day, an unrelated
// stress, a bodily state) and simply landed on this person because they
// were the most salient thing in the room when it surfaced — a real,
// well-evidenced pattern (misattribution of arousal/affect, distinct from
// both transference and projection) that this Journey should leave room
// for without asserting it's what's happening for any particular user.
//
// ROLE (below) was also tightened to stay purely descriptive ("what part
// are they playing in what just happened") rather than archetypal/
// interpretive framing, since naming a relational pairing in interpretive
// language BEFORE reality-check has run risks pre-loading the conclusion
// reality-check is supposed to test.
//
// Collapsed from the doc's 16 numbered slots to 10 stages: PERSON absorbs
// REACTION and TRIGGER (who affects me, what happens inside me, what
// specifically triggers it — one grounding exchange, the doc's own
// "reaction, not the person" opening move); REALITY stays separate from
// MEANING (the THEM/ME/MEANING triad's own THEM half must be named
// before MEANING bridges to how it was interpreted — keeping them as two
// turns preserves the doc's own "the other person's reality is kept
// structurally distinct from the start" mechanic); DESIRE absorbs
// SPECIFICITY (what I want from them, then why specifically from them);
// SELF absorbs QUALITY (who I become around them, then what they embody
// that produces that); ROLE stays separate but descriptive-only (see
// above); FAMILIARITY stays separate (only reached this late on
// purpose, per the doc — it's also the stage doing the real CCRT-style
// theme-identification work, comparing across more than one instance);
// REALITY CHECK stays fully its own stage, never merged with anything,
// per its load-bearing status above; AUTHORITY absorbs REMOVE THE
// VERDICT (what their approval/rejection would prove, then the
// counterfactual with that verdict removed); THE MIRROR absorbs NOW as
// the single closing stage.
export const THE_MIRROR_STAGES: JourneyStage[] = [
  { id: 'person', openingQuestion: 'Who affects you so strongly? What happens inside you around them, and what specifically seems to bring that out?' },
  { id: 'reality', openingQuestion: 'What did they actually do or say — just the facts, not what you made of it yet?' },
  { id: 'meaning', openingQuestion: 'What did you make their behavior mean?' },
  { id: 'desire', openingQuestion: 'What do you want from this person — and why does it matter that it comes from them specifically?' },
  { id: 'self', openingQuestion: 'Complete the sentence: around this person, I become... And what do they seem to embody that brings that out in you?' },
  { id: 'role', openingQuestion: 'What part does this person seem to be playing in what just happened between you — and what part does that leave you playing?' },
  { id: 'familiarity', openingQuestion: 'Have you played these same two parts before, even with a completely different kind of person?' },
  { id: 'reality-check', openingQuestion: 'Has this person actually done this specific thing more than once? And does the size of your reaction match what a reasonable person would feel toward that — or does it feel like it\'s carrying more weight than this one relationship accounts for?' },
  { id: 'authority', openingQuestion: 'If this person approved of you completely, what would that seem to prove? If they rejected you completely, what would that seem to prove? Now imagine their opinion could tell you nothing definitive about your worth — what changes?' },
  { id: 'the-mirror-now', openingQuestion: 'What does being around this person make visible in you — and knowing all of this, why do you think they affect you so strongly?' },
];
