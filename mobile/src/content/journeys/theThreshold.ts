import { JourneyStage } from '../../types';

// The Threshold — "what is stopping me from moving forward?" Tenth
// worked example (docs/journeys-concept.md's "The Threshold" section).
// The founding premise: not moving is not necessarily the absence of
// motivation — something can pull forward and something else pull back
// at the same time, both real, both legitimate. The Journey's own
// closing discipline, stated directly in the doc: the desired outcome is
// CLARITY about non-action, not action itself — this must never secretly
// become a motivational tool measuring success by whether the person
// eventually crosses the threshold.
//
// Hard content constraint carried into the closing stage's own goal text
// below: staying exactly where they are, with real clarity about why,
// must be a fully legitimate, complete, successful outcome — never
// treated as an unfinished Journey or nudged toward crossing.
//
// Collapsed from the doc's 20 numbered slots to 11 stages (the largest
// architecture so far, matching its own 20-slot doc origin): MOVEMENT
// absorbs THE LINE (what moving forward actually means, then the one
// concrete action that would make it real — establishing a real
// BEFORE/THRESHOLD/AFTER structure before anything else, per the doc's
// own "concretize before exploring the hesitation" discipline); FORWARD
// absorbs BACK (what pulls toward it, what pulls away — kept as two
// halves of one exchange, not two separate stages, since the doc's own
// point is that both are simultaneously real); REALITY absorbs KNOWING
// (what becomes real once they cross, what they'll find out that they
// don't have to know yet — the doc's own sharpest single insight);
// FAILURE absorbs SUCCESS (paired, symmetric); LOSS absorbs STAYING and
// COST OF STAYING (what could be lost by moving, what staying gives,
// what could be lost by NOT moving — the doc's own deliberately
// symmetric MOVE-has-gains-and-losses / STAY-has-gains-and-losses
// structure, all in one exchange rather than three separate stages);
// THE VOICE THAT STOPS ME absorbs REALITY/ANTICIPATION (what the
// hesitation would say if it could speak, then which concerns respond to
// what's actually happening versus what might happen); AMBIVALENCE stays
// separate (asking both inner parts what they want FOR the person, not
// just what they want); IDENTITY absorbs PERMISSION (who they'd become
// on the other side, whose permission they're waiting for); STAYING
// FUTURE absorbs IRREVERSIBILITY (what feels impossible to undo and
// whether that's actually true, then where staying leads if nothing
// changes); RETURN TO THE LINE absorbs ANSWER as the single closing
// stage.
export const THE_THRESHOLD_STAGES: JourneyStage[] = [
  { id: 'movement', openingQuestion: 'What does "moving forward" actually mean here? What\'s the one concrete action that would make it real?' },
  { id: 'forward-back', openingQuestion: 'What pulls you toward it? What pulls you away from it?' },
  { id: 'reality-knowing', openingQuestion: 'What becomes real once you cross this line? What will you find out that you don\'t actually have to know yet?' },
  { id: 'failure-success', openingQuestion: 'What do you fear if it goes badly? What changes if it goes well?' },
  { id: 'loss-staying', openingQuestion: 'What could you lose by moving? What does staying give you? And what could you lose by not moving?' },
  { id: 'voice', openingQuestion: 'If your hesitation could speak, what would it say? Which of those concerns respond to what\'s actually happening right now, and which respond to what might happen?' },
  { id: 'ambivalence', openingQuestion: 'What does the part of you that wants to move want FOR you? What does the part that wants to stay want for you?' },
  { id: 'identity-permission', openingQuestion: 'Who would you become on the other side of this? And whose permission, if anyone\'s, do you feel like you\'re waiting for?' },
  { id: 'staying-future', openingQuestion: 'What feels impossible to undo here — and is it actually? If you don\'t cross, where does this direction lead?' },
  { id: 'return-answer', openingQuestion: 'Looking at the threshold again now — what do you actually think is stopping you from moving forward?' },
];
