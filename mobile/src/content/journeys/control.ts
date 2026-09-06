import { JourneyStage } from '../../types';

// Control — "what am I really trying to control?" The reference
// implementation for the Journey architecture. Full worked example
// (research grounding, why this exact 6-stage shape, the desire/need
// split, the agency/influence/authorship primitive, the ending
// discipline) lives in docs/journeys-concept.md — read that before
// changing anything here. The stage SEQUENCE is fixed: the AI may only
// ever phrase THIS stage's opening question live, referencing prior
// answers in the same session — never skip, reorder, or invent a stage.
// Within a stage, the AI may ask further grounding sub-questions before
// advancing (see backend/controllers/journeyController.js's STAGE_GOALS
// and stageComplete decision) — every stage now carries its own explicit
// sub-question cap in its goal text, not just "name".
//
// 2026-08-29 rewrite: collapsed from 8 stages to 6, after a real on-device
// test showed the old 8-stage shape running 20+ exchanges — most stages had
// no sub-question ceiling at all, so the model kept "manufacturing depth"
// (certainty -> steadiness -> calm interior -> timing -> safety/belonging,
// five hops for one stage) instead of discovering it. The old
// feared-alternative/meaning/underlying-need trio (three separate
// conversational stages, each vulnerable to the same over-probing) is
// replaced by ONE stage, "separate": a fixed, authored reveal built
// directly from what was already said in "observable"/"represents"
// (no new AI call to generate the reveal itself — see
// buildSeparateReveal in journeyController.js), stating the desire/need
// split back to the person before asking one grounded follow-up. This is
// the "reflect -> contrast -> classify -> move on" pattern instead of
// open-ended probing.
//
// 2026-09-03: replaced the old opener, "What are you trying to control?",
// with two concrete stages, "situation" then "wish" — the old opener
// presupposed the person already knows the object of control, which is
// exactly what this Journey exists to help them discover. Starting from a
// concrete situation ("what's happening?") and only then asking what they
// wish were different surfaces the object of control rather than asking
// the person to name it cold. "wish" fully replaces the old "name" stage —
// its answer is now the thing "observable"/"represents" refer to as what
// the person is trying to control, and it's what the ending's "You began
// with" quote (JourneyReflection, control.tsx) reads from.
export const CONTROL_STAGES: JourneyStage[] = [
  { id: 'situation', openingQuestion: 'Think of a situation you wish would unfold differently. What’s happening?' },
  { id: 'wish', openingQuestion: 'What do you wish happened instead?' },
  { id: 'observable', openingQuestion: 'What would tell you that was happening?' },
  { id: 'represents', openingQuestion: 'If that happened, what would it give you?' },
  { id: 'separate', openingQuestion: 'Leave their choice out of it for a moment — if it stayed exactly as it is, what would still be yours to change?' },
  { id: 'agency', openingQuestion: 'Place what you’ve said into where it actually belongs.', primitive: 'agency-sort' },
  { id: 'recognition', openingQuestion: 'What do you see differently now?' },
];
