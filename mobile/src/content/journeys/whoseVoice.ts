import { JourneyStage } from '../../types';

// Whose Voice? — "is this really what I believe or want?" Fourth worked
// example (docs/journeys-concept.md's "Whose Voice?" section). The
// central reframe this Journey's whole design rests on: tracing an
// origin never settles whether a belief is kept — discovering "my mother
// taught me this" doesn't answer "do I believe it," and discovering
// "nobody taught me this" doesn't prove authenticity either. The real
// spine is "wherever this came from — do I choose it now?"
//
// Hard content constraint carried into INTEGRATION and MY-VOICE's own
// goal text below: "it came from someone else, and I've discovered I
// choose it too" must be a fully legitimate, even celebrated outcome —
// this Journey must never validate only origin-tracing-toward-rejection
// ("you were only taught this, you don't really want it"), which would
// make Selfinder an app that calls every external influence inauthentic.
//
// Collapsed from the doc's 14 numbered slots to 8 stages, same discipline
// as Control/The Loop's own collapsing: STATEMENT absorbs LANGUAGE
// (name the belief, then classify want/should/must/have to in the same
// exchange); CONSEQUENCE absorbs EMOTION (what happens if I don't, what
// feeling appears); ORIGIN absorbs VOICES (when, and who carried it);
// MEANING keeps THEN and NOW as one paired exchange (the doc's own
// "meaning then vs. meaning now" discovery, asked together); REMOVE
// absorbs both counterfactual strips (audience, then judgment) in one
// stage; DISAGREEMENT absorbs LOYALTY (same underlying "what would
// changing this cost relationally" territory). INTEGRATION and MY VOICE
// stay as the doc's own two-part close.
//
// 2026-09-03: this build ships the core 8-stage conversational sequence
// only. The doc's own "bring the others into the room" visual primitive
// (the belief centered, each voice arranged around it) is real new UI
// work deliberately deferred to a follow-up pass — VOICES' material is
// still gathered here (folded into "origin"), just rendered as plain
// conversational text for now, the same way The Loop's PAST stage
// gathers material for a Your-Arc integration that isn't wired up yet.
export const WHOSE_VOICE_STAGES: JourneyStage[] = [
  { id: 'statement', openingQuestion: 'What do you believe, or want? And is it a want, a should, a must, a need, or something you\'re "supposed to" do?' },
  { id: 'consequence', openingQuestion: 'What do you imagine would happen if you didn\'t follow it — and what do you feel when you imagine that?' },
  { id: 'origin', openingQuestion: 'When do you remember first encountering this idea, and who or what around you seemed to carry it?' },
  { id: 'meaning', openingQuestion: 'What did it mean in that world, back then — and what does it mean to you now?' },
  { id: 'remove', openingQuestion: 'Imagine nobody who knows you will ever find out what you chose, and nobody could be proud or disappointed — what remains?' },
  { id: 'disagreement', openingQuestion: 'Who would you be disagreeing with if you let this belief go — and would it feel like leaving anything, or anyone, behind?' },
  { id: 'integration', openingQuestion: 'Regardless of where it came from, do you endorse it today?' },
  { id: 'my-voice', openingQuestion: 'In your own words, what do you believe?' },
];
