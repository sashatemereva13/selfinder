import { JourneyStage } from '../../types';

// The Unsaid — "what do I actually want to say?" Eighth worked example
// (docs/journeys-concept.md's "The Unsaid" section). Distinctive
// boundary from every other Journey: completion never requires any
// real-world action — this Journey succeeds whether or not the person
// ever says anything to anyone. The goal is expression to oneself first.
//
// Hard content constraint carried into "communication" and the final
// stage's own goal text below: "no, this doesn't need to reach them, I
// just needed to say it to myself" must be a fully legitimate, complete,
// successful outcome — never treated as an unfinished Journey. The app
// must never draft the actual message to send — doing so crosses from
// self-discovery into communication advice.
//
// 2026-09-03 research-verification pass: the doc's own Freud/inhibition
// citation is accurate as far as it goes but under-covers stages 5-6
// specifically (silence/exposure) — Gross's process model of emotion
// regulation (expressive suppression's real costs: heightened arousal,
// worse memory of the interaction, perceived relational distance) and
// self-disclosure/fear-of-judgment research (Jourard) are the more
// current, better-fitting accounts for why withholding and exposure
// specifically feel costly, alongside Freud rather than replacing him.
// EXPRESSION/OUTCOME's split (stage 3) is confirmed as a real,
// evidence-grounded distinction, not just clinical intuition — named
// precisely, it's the assertiveness-training separation of expressing a
// feeling/need from demanding a specific response (Alberti & Emmons),
// and Emotion-Focused Therapy's "unfinished business" work (Greenberg)
// is the closest clinical analogue: the therapeutic goal is articulating
// the unexpressed feeling, explicitly NOT contingent on the other
// person's reaction — a sharper, better anchor for this Journey's whole
// premise than Freud alone. REMOVE THE LISTENER/EDITOR (stage 7) is a
// reasonable disinhibition technique but should not overclaim Pennebaker
// — his expressive-writing protocol is normally 3-4 consecutive daily
// sessions on the same material, and single-session free-writing has
// weaker, mixed effect sizes in the literature; this stage is grounded
// more modestly in disinhibition/private-writing effects, not a full
// implementation of Pennebaker's own studied protocol.
//
// Collapsed from the doc's 18 numbered slots to 10 stages: PERSON absorbs
// EDGE and FIRST WORDS (who this is about, what feels unsaid, and a
// low-stakes incomplete opening sentence — one grounding exchange, per
// the doc's own "never ask for the perfect sentence first" move);
// REACTION absorbs EXPECTED RESPONSE (what happens imagining saying it,
// then what they imagine the other person would do); EXPRESSION/OUTCOME
// stays its own stage (the doc's signature mechanic — separating what I
// want to SAY from what I want to HAPPEN); MEANING absorbs PURPOSE (what
// I need them to understand, then what I want my words to DO); SILENCE
// absorbs PRICE OF SILENCE (what staying silent protects, then what it
// asks); EXPOSURE stays separate (locating the barrier as vulnerability,
// not wording); REMOVE THE LISTENER absorbs REMOVE THE EDITOR (both
// counterfactual strips, back to back, since they're the same underlying
// experiment in two escalating passes); CONTRADICTION stays separate
// (the explicit acknowledgment that there may be two opposed true
// wants); DISTILL is folded into the final exchange rather than its own
// stage (which part of everything written feels most true); COMMUNICATION
// absorbs THE LISTENER and NOW as the single closing stage (does this
// need to reach them, who really needs to hear it, and the Journey's own
// final answer).
export const THE_UNSAID_STAGES: JourneyStage[] = [
  { id: 'person', openingQuestion: 'Who is this about, and what feels unsaid? If you didn\'t need the perfect sentence, what would you begin with — even an incomplete one?' },
  { id: 'reaction', openingQuestion: 'What happens inside you when you imagine actually saying it? What do you imagine they would do?' },
  { id: 'expression-outcome', openingQuestion: 'What do you actually want to say, versus what do you want to happen once you\'ve said it?' },
  { id: 'meaning', openingQuestion: 'What do you need them to understand — and what do you want your words to actually do?' },
  { id: 'silence', openingQuestion: 'What does staying silent protect? What does staying silent ask of you?' },
  { id: 'exposure', openingQuestion: 'What would this person know about you if you said what you really mean — and how does it feel to imagine them knowing that?' },
  { id: 'remove-listener-editor', openingQuestion: 'Imagine they will never hear this — what do you want to say? Now imagine you don\'t have to be fair, reasonable, or eloquent — what else is there?' },
  { id: 'contradiction', openingQuestion: 'Is there another part of you that wants to say something different — or even the opposite?' },
  { id: 'distill', openingQuestion: 'Looking at everything you\'ve written, which part feels most true?' },
  { id: 'communication', openingQuestion: 'Does any of this actually need to reach them? And who really needs to hear it — them, you, both, or someone else entirely?' },
];
