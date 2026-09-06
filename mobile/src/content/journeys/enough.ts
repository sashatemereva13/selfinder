import { JourneyStage } from '../../types';

// Enough — "what would actually be enough for me?" Twelfth and final
// worked example in the current catalog (docs/journeys-concept.md's
// "Enough" section). Deceptively named: it sounds like a Journey about
// moderation, about learning to want less — it is explicitly not that.
// The actual question is "what am I expecting 'more' to eventually give
// me, and is there a point at which I would recognize I have it?" A
// reusable lens across any domain (money, success, attractiveness,
// reassurance, recognition, improvement) rather than one specific
// psychological territory — this Journey is built to work on any of them
// without needing a different architecture per domain.
//
// Hard content constraint: Selfinder must never rank goals as worthy or
// unworthy (wanting money or recognition is not inherently unhealthy) —
// it can only ask what a given goal is doing for the person, the same
// discipline every prior Journey's UNDERNEATH/MEANING-style slot follows.
//
// Collapsed from the doc's 20 numbered slots to 11 stages (matching The
// Threshold's own 20-slot-origin size): MORE absorbs THRESHOLD (what
// they don't feel they have enough of, then how they'd know when they
// had enough — the doc's own fastest-revealing mechanic: MONEY moving to
// SECURITY within two questions); UNDERNEATH absorbs THEN-I'LL (what they
// expect enough to give them, then what they're postponing until they
// reach it); HISTORY absorbs ADAPTATION (what once would have felt like
// enough, then what they reached that eventually became normal — the
// hedonic-treadmill mechanic made concrete); AUTHORITY absorbs
// COMPARISON and REMOVE THE AUDIENCE (who determines whether they have
// enough, compared with whom, then what changes if nobody can see what
// they have); PURPOSE absorbs LEVELS (enough for what, then the
// survival/safety/wanted-life/simply-more distinction); ENOUGH≠NO DESIRE
// stays separate (the doc's own explicit guard against "wanting nothing
// further" being mistaken for the goal); FEAR OF ENOUGH absorbs
// MOTIVATION (what feels threatening about saying "this is enough," then
// whether they believe they need dissatisfaction to keep moving);
// MAXIMIZING stays separate (its own sharp, evidence-grounded distinction
// — seeking the best possible outcome versus an adequate one); RECOGNITION
// absorbs CONDITION (where they already know what enough feels like in
// some part of life, then what conditions rather than a number would make
// something count as enough); PERMISSION stays separate (would they
// actually let those conditions count, if they existed); NOW absorbs
// ANSWER as the single closing stage.
export const ENOUGH_STAGES: JourneyStage[] = [
  { id: 'more-threshold', openingQuestion: 'What don\'t you feel you have enough of? How would you actually know when you had enough of it?' },
  { id: 'underneath', openingQuestion: 'What do you expect having enough of this would actually give you? What are you postponing until you reach it?' },
  { id: 'history-adaptation', openingQuestion: 'What once would have felt like plenty to you? What did you eventually reach that became normal, expected, or unremarkable?' },
  { id: 'authority', openingQuestion: 'Who or what determines whether you have enough? Enough compared with whom? And what changes if nobody could see what you have?' },
  { id: 'purpose-levels', openingQuestion: 'Enough for what, exactly? What would be enough for survival, for safety, for the life you actually want — and where does it just become more?' },
  { id: 'not-no-desire', openingQuestion: 'Even if you had enough of this, what would you still want?' },
  { id: 'fear-motivation', openingQuestion: 'What feels threatening about saying "this is enough"? Do you believe you need some dissatisfaction to keep moving?' },
  { id: 'maximizing', openingQuestion: 'Are you actually looking for enough — or for the maximum possible?' },
  { id: 'recognition-condition', openingQuestion: 'Is there somewhere in your life where you already know what enough feels like? If it\'s not a number, what conditions would make this feel like enough?' },
  { id: 'permission', openingQuestion: 'If those conditions actually existed, would you let yourself count them?' },
  { id: 'now-answer', openingQuestion: 'How much of what you\'d call enough is already here? What would actually be enough for you?' },
];
