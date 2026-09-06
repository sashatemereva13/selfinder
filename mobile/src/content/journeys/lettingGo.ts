import { JourneyStage } from '../../types';

// Letting Go — "what am I actually holding onto?" Sixth worked example
// (docs/journeys-concept.md's "Letting Go" section). The reframe that
// governs everything: the deeper question isn't "how do I let go," it's
// "what would I lose if I did?" The Journey's job is never to help
// someone let go of something — it's to help them discover what they're
// holding, why, and whether they still choose to hold it in its current
// form. Continuing to hold something, unchanged, is as legitimate an
// outcome as releasing it or changing its form.
//
// Hard content constraint carried into FORM and the final stage's own
// goal text below: the ending must never say "it's time to let go," ever
// — "keep it exactly as is," "carry it differently," "leave part of it,"
// and "not ready to decide" must all be fully legitimate, equally
// complete answers.
//
// Collapsed from the doc's 16 numbered slots to 10 stages, same
// collapsing discipline as the prior five Journeys: THE OBJECT absorbs
// CLOSER (name what's being held, then get more specific about exactly
// what part is hard to release, in one exchange); GONE/REMAINS stays
// separate (the doc's own de-monolithizing mechanic — "letting go" stops
// being one thing to release); CONNECTION absorbs FEAR OF RELEASE (what's
// kept alive by holding, then what would be lost if they stopped); HOPE
// stays separate (deliberately its own stage per the doc — future-
// oriented and experienced now at once); UNFINISHED absorbs WAITING
// (what feels unresolved, then what's specifically being waited for);
// MEANING stays separate (the surface-object-to-real-need move);
// IDENTITY stays separate (the doc calls this "likely the deepest
// layer"); FUNCTION absorbs PRICE (what holding gives, then what it
// asks); TIME absorbs KEEP (has the held object changed, then what
// would they keep regardless); FORM absorbs NOW as the single closing
// stage (hold/carry/leave, then the same opening question asked again).
export const LETTING_GO_STAGES: JourneyStage[] = [
  { id: 'the-object', openingQuestion: 'What are you trying to let go of? And when you name it, what exactly about it feels difficult to release?' },
  { id: 'gone-remains', openingQuestion: 'What has actually ended? What still exists?' },
  { id: 'connection', openingQuestion: 'What are you keeping alive by holding onto this — and what do you imagine would be lost if you stopped?' },
  { id: 'hope', openingQuestion: 'What are you still hoping will happen — and what does keeping that possibility open cost you today?' },
  { id: 'unfinished', openingQuestion: 'Does anything about this feel unfinished? If so, what is still waiting to happen, and from whom?' },
  { id: 'meaning', openingQuestion: 'If you received what you\'re waiting for, what would that actually change for you?' },
  { id: 'identity', openingQuestion: 'Who have you been while holding onto this? If this were no longer something you were holding, who would you be?' },
  { id: 'function-price', openingQuestion: 'What does holding onto this give you — and what does it ask from you?' },
  { id: 'time-keep', openingQuestion: 'Is what you\'re holding still the same thing it was when it began? If you didn\'t have to let go of everything, what would you want to keep?' },
  { id: 'form-now', openingQuestion: 'Does this feel like something you want to hold, carry differently, or leave — or not decide yet? Knowing all of this, what are you actually holding onto?' },
];
