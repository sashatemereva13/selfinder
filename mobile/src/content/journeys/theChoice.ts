import { JourneyStage } from '../../types';

// The Choice — "what do I actually want?" Second worked example after
// Control (see docs/journeys-concept.md's "The Choice — the second
// worked example" section for the full design: research grounding in
// Self-Determination Theory's regulation spectrum and Winnicott's true
// self / false self, and the hard "not one hidden true desire" guardrail
// this Journey must never violate — it separates competing desires the
// person already recognizes as theirs, it never resolves "I want both"
// into a manufactured single "real" answer).
//
// Unlike Control, The Choice has no authored reveal and no sort
// primitive — every stage is a plain conversational exchange, so this
// Journey needs no journeyController.js special-casing beyond its own
// STAGE_GOALS/STAGE_SUBQUESTION_CAP/STAGE_FALLBACK_NUDGE entries.
//
// The doc's own worked architecture runs 12 numbered slots, several of
// which (Fear/Desire, Symbol, Future A/Future B) are richer than a single
// exchange can responsibly hold in one pass. Collapsed here to 8 stages
// following the same discipline Control's own 2026-08-29 rewrite
// established (cap sub-questions per stage rather than one open-ended
// stage per slot) — Attraction folds in Symbol (what draws me AND what
// it would give me), Pressure/Audience are merged into one
// counterfactual-stripping stage, and Future A/B are combined into one
// stage asking for both imagined lives back to back rather than two
// separate stages, since they're read together at Return-to-now regardless.
export const THE_CHOICE_STAGES: JourneyStage[] = [
  { id: 'choice', openingQuestion: 'What am I choosing between?' },
  { id: 'attraction', openingQuestion: 'What draws me toward each — and what would having it actually give me?' },
  { id: 'pressure', openingQuestion: 'What do I believe I should choose, and whose reaction matters most in that?' },
  { id: 'audience', openingQuestion: 'If nobody would know what you chose, and nobody could be proud or disappointed — what changes?' },
  { id: 'fear', openingQuestion: 'What am I afraid will happen under each choice?' },
  { id: 'cost', openingQuestion: 'What do I lose by choosing each one?' },
  { id: 'futures', openingQuestion: 'Imagine you chose each one six months ago — what does each imagined life draw you toward, and what makes you pull away from it?' },
  { id: 'choice-again', openingQuestion: 'Knowing everything above, what do you want?' },
];
