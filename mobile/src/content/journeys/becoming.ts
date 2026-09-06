import { JourneyStage } from '../../types';

// Becoming — "who am I becoming?" Ninth worked example (docs/journeys-
// concept.md's "Becoming" section). The founding premise: who you're
// becoming isn't necessarily who you say you want to become — it may
// already be visible in what you're repeatedly choosing, protecting,
// practicing, tolerating, and leaving behind. This rules out the
// Journey's most tempting wrong shape: a vision-board exercise where the
// person designs an ideal future self. Becoming is detection, not
// aspiration-first — Selfinder cannot say "this is who you're becoming,"
// it can only ask what seems to be changing and let the person examine
// the evidence themselves.
//
// Hard content constraint carried into "evidence" below: a claimed
// transformation ("I think I'm becoming more confident") is never
// accepted on its own — it must be tied to something they actually did
// differently. This single requirement is what keeps the whole Journey
// grounded rather than aspirational.
//
// Collapsed from the doc's 18 numbered slots to 10 stages: CHANGE absorbs
// CONTINUITY (what feels different, then what hasn't changed — both
// halves needed from the first stage or the Journey risks reading as
// "everything is in flux," which is rarely true); EVIDENCE absorbs
// REPETITION (what they've actually done differently, then what they
// keep choosing repeatedly — the doc's own "removed narrator" move: what
// would someone see from actions alone); PRACTICE absorbs CAPACITY (what
// way of being is being rehearsed through those repeated choices, then
// what they're becoming better at); NORMAL absorbs BOUNDARIES (what
// they're becoming accustomed to, then what they tolerate now versus
// what they've stopped tolerating); the three possible selves — HOPED,
// FEARED, OUGHT — are asked together in one stage, since the doc's own
// point is that comparing all three at once is what makes the
// discrepancies visible; CURRENT TRAJECTORY absorbs LEAVING (which one
// their actual life resembles, then which version of themselves they're
// becoming less like); FEELING REAL stays its own stage (distinct
// territory — inhabited versus performed, not a possible-self comparison);
// EXTRAPOLATE absorbs CONTINUE/REDIRECT/WATCH (if this continued exactly
// as is what would strengthen, then which directions they choose to
// strengthen, reconsider, or simply observe); NAME IT absorbs NOW as the
// closing stage.
export const BECOMING_STAGES: JourneyStage[] = [
  { id: 'change', openingQuestion: 'What feels different about you lately? What hasn\'t changed?' },
  { id: 'evidence', openingQuestion: 'What have you actually done differently — not a feeling, an action? What choices have you been making repeatedly?' },
  { id: 'practice', openingQuestion: 'What way of being do those repeated choices seem to be rehearsing? What are you becoming better at?' },
  { id: 'normal', openingQuestion: 'What are you becoming accustomed to? What do you tolerate now that you didn\'t before — or what have you stopped tolerating?' },
  { id: 'possible-selves', openingQuestion: 'Who do you hope you\'re becoming? Who are you afraid you\'re becoming? And who do you think you\'re supposed to become?' },
  { id: 'trajectory', openingQuestion: 'Looking at your actual life right now, which of those does it resemble most? Which version of yourself are you becoming less like?' },
  { id: 'feeling-real', openingQuestion: 'Where in your current life do you feel most like yourself?' },
  { id: 'extrapolate', openingQuestion: 'If you continued exactly as you are, what might become stronger? Which of these directions do you want to strengthen, reconsider, or just keep watching?' },
  { id: 'name-it-now', openingQuestion: 'Finish this sentence: "I am becoming someone who..." And what are you doing today that is already creating that person?' },
];
