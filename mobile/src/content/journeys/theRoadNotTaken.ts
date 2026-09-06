import { JourneyStage } from '../../types';

// The Road Not Taken — "why can't I stop thinking about what could have
// been?" Fifth worked example (docs/journeys-concept.md's "The Road Not
// Taken" section). The central distinction the whole Journey rests on:
// the person is not remembering another life, they are imagining one —
// the past event was real, the alternative timeline was not, but the
// emotions produced by comparing reality against that imagined timeline
// are completely real. Every stage below exists in service of keeping
// that distinction visible without ever calling the imagined timeline
// "just a fantasy."
//
// Hard content constraint carried into CLOSED-OPEN and the final stage's
// own goal text below: "I lost something and cannot have it back, full
// stop" must be a fully legitimate, complete answer — this Journey must
// never turn every closed door into a search for a silver lining
// ("what did you learn from this").
//
// Collapsed from the doc's 14 numbered slots to 9 stages, same collapsing
// discipline as the prior four Journeys: FORK absorbs THE OTHER ROAD
// (name the real fork, then construct what's imagined would have
// happened, in one exchange); REALITY/IMAGINATION stays its own stage —
// classifying pieces of the imagined road as known/inferred/hoped/unknown
// is a distinct mechanic worth its own turn, not foldable into
// construction; OBJECT absorbs THE MEANING (what's specifically missed,
// then what having it would give them); RESPONSIBILITY stays separate
// (a real fork point: agency/regret vs. circumstance/disappointment);
// ME THEN/ME NOW merged into one paired stage; CLOSED/OPEN stays
// separate (the doc calls this "likely the heart of the entire
// Journey"); THE UNLIVED SELF stays separate (its own distinct
// territory — a version of the person, not a fact about the fork);
// UNCERTAINTY stays separate (the deliberate downward counterfactual);
// RETURN TO NOW absorbs THE ANSWER as the single closing stage.
export const THE_ROAD_NOT_TAKEN_STAGES: JourneyStage[] = [
  { id: 'fork', openingQuestion: 'What happened — and where did the roads separate? What do you imagine would have happened instead, if you\'d chosen differently?' },
  { id: 'reality-imagination', openingQuestion: 'Looking at what you just imagined — which parts do you actually know, which do you think probably would have happened, which do you hope would have happened, and which do you honestly not know at all?' },
  { id: 'object', openingQuestion: 'What exactly do you miss — and what would having it actually give you?' },
  { id: 'responsibility', openingQuestion: 'Do you wish your own action had been different, another person\'s action, or the circumstances themselves?' },
  { id: 'me-then-now', openingQuestion: 'What did you know, want, fear, and believe you had as options back then — and what do you know now only because you\'ve lived through what followed?' },
  { id: 'closed-open', openingQuestion: 'What about this feels irreversibly gone? What still remains possible, even in another form?' },
  { id: 'unlived-self', openingQuestion: 'Who do you imagine you would have become on that other road — and what do you feel toward that version of yourself?' },
  { id: 'uncertainty', openingQuestion: 'Without trying to make your actual choice seem right, what might have been difficult about that other road too?' },
  { id: 'return-to-now', openingQuestion: 'What does this imagined life show you about the life you\'re living now — and why do you think you keep returning to this road?' },
];
