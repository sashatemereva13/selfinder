import { Locale } from '../store/localeStore';

// Mirrors selfinder-web/frontend/src/tunein/FrequencyPlayer.jsx's `states` —
// keep the two in sync by hand. Each state is a binaural beat: a carrier tone
// in the left ear and carrier+beatHz in the right ear, requiring stereo
// headphones. beatHz targets a standard calming EEG band (alpha/theta/delta).
//
// 2026-08-17: reworked all three .m4a assets after user feedback that the
// original tracks (bare sine-on-sine tones, carrierHz 200/200/150, no
// texture underneath) felt anxiety-inducing rather than calming. Changed:
// (1) carrierHz moved to 432 for all three — a deliberate, personal-taste
// pick after A/B listening against ~440/443Hz; NOT based on any "432Hz is
// scientifically special" claim (that claim has no solid evidence — see
// commit message for sources). All of 400-443Hz sit inside the well-
// evidenced ~200-900Hz effective range for binaural-beat perception, so
// this was a comfort/preference choice, not a scientific one — don't let
// future copy imply otherwise, per RULES.md's "never ask the user to
// believe something that needs the cosmology" rule. (2) added a soft,
// heavily low-passed pink-noise bed under each tone plus a 3s fade in/out
// — bare binaural tones read as clinical/tinnitus-adjacent in isolation;
// literature on binaural-beat sound design consistently recommends masking
// under a noise/nature bed for comfort. beatHz (10/6/2, alpha/theta/delta)
// unchanged — those were already correct and aren't the audio-comfort
// lever. Original tracks kept at assets/audio/_originals-backup/ in case
// of regression.
//
// 2026-08-19: sleep-delta.m4a specifically reworked AGAIN — even at 432Hz
// with a light noise bed, the tone-forward mix (research: delta binaural
// beats specifically documented as the "annoying" factor for sleep use)
// still read as unpleasant on a real overnight listening test. Flipped
// the balance for Sleep only: brown noise is now the dominant, clearly
// audible layer (the user's own stated favorite among several noise-color
// candidates tried), with the 432/434Hz delta beat mixed in underneath at
// a level tuned across three iterations to be genuinely perceptible (not
// just theoretically present) without overpowering the noise — Calm and
// Deep Rest keep the original tone-forward balance; this rebalance is
// deliberately scoped to Sleep alone, not applied retroactively to the
// other two.
export interface TuneInState {
  name: string;
  band: string;
  beatHz: number;
  carrierHz: number;
  color: string;
  intent: string;
  asset: number;
  // Russian display text for name/intent — the base `name` above stays the
  // stable English identifier used in analytics (track('tune_in_started',
  // { state: ... })) and as this array's own React key, so a Russian
  // build's analytics aren't split into a separate set of state names from
  // English's. Use getLocalizedTuneInState() to get the display version.
  translations?: { ru: { name: string; intent: string } };
}

export const TUNE_IN_STATES: TuneInState[] = [
  {
    name: 'Calm',
    band: 'Alpha',
    beatHz: 10,
    carrierHz: 432,
    color: '159,255,208',
    intent: 'Relaxed, alert stillness — good for settling before or after something stressful.',
    asset: require('../../assets/audio/calm-alpha.m4a'),
    translations: {
      ru: {
        name: 'Спокойствие',
        intent: 'Расслабленная, бодрая неподвижность — хорошо подходит, чтобы успокоиться до или после стрессового момента.',
      },
    },
  },
  {
    name: 'Deep Rest',
    band: 'Theta',
    beatHz: 6,
    carrierHz: 432,
    color: '195,153,255',
    intent: 'Meditation-depth stillness. Best with eyes closed, not mid-task.',
    asset: require('../../assets/audio/deep-rest-theta.m4a'),
    translations: {
      ru: {
        name: 'Глубокий отдых',
        intent: 'Неподвижность на глубине медитации. Лучше всего с закрытыми глазами, не во время дел.',
      },
    },
  },
  {
    name: 'Sleep',
    band: 'Delta',
    beatHz: 2,
    carrierHz: 432,
    color: '126,166,255',
    intent: 'The slowest band, associated with deep sleep. Lie down and let it run.',
    asset: require('../../assets/audio/sleep-delta.m4a'),
    translations: {
      ru: {
        name: 'Сон',
        intent: 'Самый медленный диапазон, связанный с глубоким сном. Лягте и дайте этому идти своим чередом.',
      },
    },
  },
];

export function getLocalizedTuneInState(state: TuneInState, locale: Locale) {
  const translation = locale === 'ru' ? state.translations?.ru : undefined;
  return translation ? { ...state, ...translation } : state;
}
