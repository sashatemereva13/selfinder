import { Locale } from '../store/localeStore';

// Mirrors selfinder-web/frontend/src/tunein/FrequencyPlayer.jsx's `states` —
// keep the two in sync by hand. Each state is a binaural beat: a carrier tone
// in the left ear and carrier+beatHz in the right ear, requiring stereo
// headphones. beatHz targets a standard calming EEG band (alpha/theta/delta).
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
    carrierHz: 200,
    color: '159,255,208',
    intent: 'Relaxed, alert stillness — good for settling before or after something stressful.',
    asset: require('../../assets/audio/calm-alpha.wav'),
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
    carrierHz: 200,
    color: '195,153,255',
    intent: 'Meditation-depth stillness. Best with eyes closed, not mid-task.',
    asset: require('../../assets/audio/deep-rest-theta.wav'),
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
    carrierHz: 150,
    color: '126,166,255',
    intent: 'The slowest band, associated with deep sleep. Lie down and let it run.',
    asset: require('../../assets/audio/sleep-delta.wav'),
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
