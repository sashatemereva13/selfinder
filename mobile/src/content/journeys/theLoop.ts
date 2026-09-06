import { JourneyStage } from '../../types';

// The Loop — "why does this keep happening to me?" Third worked example
// (docs/journeys-concept.md's "The Loop" section) — the defining move is
// that the Journey never actually answers "why." It reframes the question
// from "why does this keep happening" to "what, exactly, is repeating" —
// find the repetition first, only then (if ever) look for its meaning.
//
// The hard ethical guardrail carried into every relevant stage's own goal
// text below: the Journey must leave real room for "this isn't a pattern
// at all" as a fully legitimate outcome — someone can repeatedly
// encounter similar circumstances because of environment, chance, or
// other people's actual choices, not because of anything they themselves
// are doing or expecting. FAMILIARITY, COMPARE, and PATTERN below must
// all be able to conclude "not actually similar" / "no real repetition
// here" without treating that as an incomplete or failed stage.
//
// Collapsed from the doc's 12 numbered slots to 9 stages, following the
// same discipline as Control's 2026-08-29 rewrite (cap sub-questions,
// don't run every doc-slot as its own open-ended stage): PRESENT absorbs
// the doc's own SEQUENCE chain (event -> interpretation -> feeling ->
// response -> outcome) for the current situation; PAST does the same for
// the earlier one, so COMPARE has two full chains to actually compare,
// not two vague situations. FUNCTION, VARIATION, and NOW (the doc's own
// closing three) are folded into one final "recognition" stage, matching
// Control's own single closing stage rather than three separate ones.
//
// 2026-09-03: this build ships the core 9-stage conversational sequence
// only. The doc's own "Bringing in Your Arc" mechanic — surfacing
// resemblance across the user's own saved Measure/Guide history mid-
// Journey ("Something you said today resembles things you've said
// before... would you like to look at them?") — is real additional scope
// (reading MeasureResult/Conversation history, a similarity step, careful
// consent handling) deliberately deferred to a focused follow-up pass,
// not built here. PAST's opening question below asks the person to recall
// an earlier moment from memory, in-session, exactly as Control and The
// Choice already do — it does not yet reach into their saved record.
export const THE_LOOP_STAGES: JourneyStage[] = [
  { id: 'present', openingQuestion: 'What happened this time? Walk me through it — what happened, what did you think it meant, what did you feel, and what did you do?' },
  { id: 'familiarity', openingQuestion: 'What about this feels familiar?' },
  { id: 'past', openingQuestion: 'When else have you felt something like this? Walk me through that one too.' },
  { id: 'compare', openingQuestion: 'What is actually the same between these two? What is different?' },
  { id: 'desire', openingQuestion: 'What did you want in each of these situations?' },
  { id: 'expectation', openingQuestion: 'What did you expect from the other person, or from the world, in each?' },
  { id: 'response', openingQuestion: 'What did you do in anticipation of that?' },
  { id: 'pattern', openingQuestion: 'Where does the repetition actually live — the situation, a feeling, an expectation, your response, a role you play, or the outcome?' },
  { id: 'recognition', openingQuestion: 'If one part of this could be different next time, which part would you want to change — and what do you now think keeps happening?' },
];
