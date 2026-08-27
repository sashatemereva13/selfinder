import { JourneyStage } from '../../types';

// Control — "what am I really trying to control?" The reference
// implementation for the Journey architecture. Full worked example
// (research grounding, why this exact 8-stage shape, the object-shift
// walkthrough, the agency/influence/authorship primitive, the ending
// discipline) lives in docs/journeys-concept.md — read that before
// changing anything here. The stage SEQUENCE is fixed: the AI may only
// ever phrase THIS stage's opening question live, referencing prior
// answers in the same session — never skip, reorder, or invent a stage.
// Within a stage, the AI may ask further grounding sub-questions before
// advancing (see backend/controllers/journeyController.js's STAGE_GOALS
// and stageComplete decision, 2026-08-26) — the "object" stage
// specifically is expected to need this when the answer starts abstract
// ("I don't know"), concretizing into a real situation before the stage
// completes.
export const CONTROL_STAGES: JourneyStage[] = [
  { id: 'object', openingQuestion: 'What are you trying to control?' },
  { id: 'desired-outcome', openingQuestion: 'What exactly would you like to determine?' },
  { id: 'certainty', openingQuestion: 'If you knew with certainty that it would happen, what would change for you?' },
  { id: 'feared-alternative', openingQuestion: 'Now imagine you cannot know. What appears?' },
  { id: 'meaning', openingQuestion: 'What is that fear about?' },
  { id: 'underlying-need', openingQuestion: 'And what would that mean to you?' },
  { id: 'agency', openingQuestion: 'Which parts of this belong to you? Which parts don’t?', primitive: 'agency-sort' },
  { id: 'recognition', openingQuestion: 'What do you see differently now?' },
];
