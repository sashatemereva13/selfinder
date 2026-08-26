import { JourneySlot } from '../../types';

// Control — "what am I really trying to control?" The reference
// implementation for the Journey architecture. Full worked example
// (research grounding, why this exact 8-slot shape, the object-shift
// walkthrough, the agency/influence/authorship primitive, the ending
// discipline) lives in docs/journeys-concept.md — read that before
// changing anything here. The architecture itself is fixed: the AI may
// only ever phrase THIS question live, referencing prior answers in the
// same session — never skip, reorder, or invent a slot.
export const CONTROL_SLOTS: JourneySlot[] = [
  { id: 'object', question: 'What are you trying to control?' },
  { id: 'desired-outcome', question: 'What exactly would you like to determine?' },
  { id: 'certainty', question: 'If you knew with certainty that it would happen, what would change for you?' },
  { id: 'feared-alternative', question: 'Now imagine you cannot know. What appears?' },
  { id: 'meaning', question: 'What is that fear about?' },
  { id: 'underlying-need', question: 'And what would that mean to you?' },
  { id: 'agency', question: 'Which parts of this belong to you? Which parts don’t?', primitive: 'agency-sort' },
  { id: 'recognition', question: 'What do you see differently now?' },
];
