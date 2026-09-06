import { JourneyStage } from '../../types';

// Possible Selves — "which future actually feels like mine?" Eleventh
// worked example (docs/journeys-concept.md's "Possible Selves" section).
// The philosophical correction stated before anything else: there is no
// future waiting somewhere that is secretly "the real one." The
// operating question is closer to: when I imagine different lives from
// where I stand now, which possibilities feel congruent with who I am —
// and what does that reveal about me today? Futures aren't destinations
// Selfinder helps someone plan toward; they're present mental
// representations whose only real content is what they reveal about the
// person having them right now. Distinct from Becoming (which runs
// present -> future: given how I'm living, what direction am I already
// creating); this Journey runs future -> present.
//
// Hard content constraint: multiple, even competing, imagined futures at
// once is licensed as psychologically sound (self-concept multiplicity
// research), not indecisive — the Journey must never quietly narrow
// toward one "correct" future.
//
// Collapsed from the doc's 19 numbered slots to 10 stages: MULTIPLICITY
// absorbs LIFE-NOT-TITLE (what futures they can imagine, then what an
// ordinary day actually looks like in each — grounding the imagined
// lives concretely rather than as social-identity labels, per the doc's
// own "never open with 'where do you see yourself in five years'" move);
// UNDERNEATH absorbs BE/HAVE (what each future gives them
// psychologically, then whether they want to BE that person or just HAVE
// what they have); AUDIENCE absorbs STATUS (what remains if nobody can
// see the life, what remains if it isn't impressive — two counterfactual
// strips together); FEAR absorbs FEARED SELF and REMOVE THE LABELS
// (which futures they reject because of what they'd mean about them, who
// they're afraid of becoming, then which life draws them once its social
// identity disappears); COST absorbs LOSS (what each future asks from
// them, what version of themselves each would require leaving behind);
// CONTINUITY stays separate (the doc's own most important slot — where
// does each future already exist in the person now, not an optional
// add-on); CONGRUENCE absorbs EXPERIENCE (which feels inhabited rather
// than performed, then what happens inside them imagining they've
// already chosen it); ESCAPE absorbs REALITY (what present problem this
// future imagines solving, then what new problems it would create);
// COMMON THREAD stays separate (what appears in every future that feels
// like theirs); RETURN TO NOW absorbs ANSWER as the single closing stage.
export const POSSIBLE_SELVES_STAGES: JourneyStage[] = [
  { id: 'multiplicity', openingQuestion: 'Imagine there are several different versions of you ahead, not just one. What futures have you been imagining lately — and what does an ordinary day actually look like in each?' },
  { id: 'underneath', openingQuestion: 'What does each of these futures give you, psychologically? For each one, do you want to BE that person — or do you just want to HAVE what they have?' },
  { id: 'audience-status', openingQuestion: 'What remains of each future\'s pull if nobody could ever see your life? What remains if that life isn\'t impressive to anyone?' },
  { id: 'fear', openingQuestion: 'Which futures do you reject because of what they\'d mean about you? Who are you afraid of becoming? And once you strip away the social label from each life — which one still draws you?' },
  { id: 'cost-loss', openingQuestion: 'What does each future ask from you? What version of yourself would each one require you to leave behind?' },
  { id: 'continuity', openingQuestion: 'Where does each of these futures already exist in you, right now?' },
  { id: 'congruence', openingQuestion: 'Which of these futures feels inhabited rather than performed? What happens inside you when you imagine you\'ve already chosen it?' },
  { id: 'escape-reality', openingQuestion: 'What present problem do you imagine each future solving? And what new problems might it create instead?' },
  { id: 'common-thread', openingQuestion: 'What appears in every future that feels like yours?' },
  { id: 'return-answer', openingQuestion: 'What have these imagined futures revealed about who you are today? Which future feels like yours — or what would a future need to contain to feel like yours?' },
];
