import { MeasureResult } from '../types';

// Real synodic-month calculation — mirrors selfinder-web's lunarCalendar/LunarCalendar3D.jsx
// exactly, so both platforms report the same phase for the same moment.
export const SYNODIC_MONTH = 29.53058867;
const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z').getTime();

export type MoonPhaseName =
  | 'New Moon'
  | 'Waxing Crescent'
  | 'First Quarter'
  | 'Waxing Gibbous'
  | 'Full Moon'
  | 'Waning Gibbous'
  | 'Last Quarter'
  | 'Waning Crescent';

export type MoonStage = 'Spark' | 'Friction' | 'Illumination' | 'Release';

export function getMoonPhaseFraction(date: Date = new Date()): number {
  const daysSince = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  return (((daysSince % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH) / SYNODIC_MONTH;
}

export function getMoonPhaseInfo(fraction: number): { name: MoonPhaseName; symbol: string } {
  if (fraction < 0.03 || fraction > 0.97) return { name: 'New Moon', symbol: '🌑' };
  if (fraction < 0.22) return { name: 'Waxing Crescent', symbol: '🌒' };
  if (fraction < 0.28) return { name: 'First Quarter', symbol: '🌓' };
  if (fraction < 0.47) return { name: 'Waxing Gibbous', symbol: '🌔' };
  if (fraction < 0.53) return { name: 'Full Moon', symbol: '🌕' };
  if (fraction < 0.72) return { name: 'Waning Gibbous', symbol: '🌖' };
  if (fraction < 0.78) return { name: 'Last Quarter', symbol: '🌗' };
  return { name: 'Waning Crescent', symbol: '🌘' };
}

// Stage grouping: strictly refines web's binary building (fraction < 0.5) / releasing
// (fraction >= 0.5) split into the four-stage change-cycle the app names explicitly.
export const PHASE_STAGE: Record<MoonPhaseName, MoonStage> = {
  'New Moon': 'Spark',
  'Waxing Crescent': 'Spark',
  'First Quarter': 'Friction',
  'Waxing Gibbous': 'Friction',
  'Full Moon': 'Illumination',
  'Waning Gibbous': 'Illumination',
  'Last Quarter': 'Release',
  'Waning Crescent': 'Release',
};

export const STAGE_DESCRIPTIONS: Record<MoonStage, string> = {
  Spark: 'The desire arrives, mostly invisible. Direction isn’t clear yet — just the pull.',
  Friction: 'The old way stops working. Old structure suspended, new one not yet built.',
  Illumination: 'What was forming becomes visible. Tested against reality, not just imagined.',
  Release: 'What no longer serves is let go — clearing the ground for the next spark.',
};

interface MoonPhaseContent {
  nature: string;
  reflection: string;
  practice: string;
}

export const MOON_PHASE_CONTENT: Record<MoonPhaseName, MoonPhaseContent> = {
  'New Moon': {
    nature: 'The sky holds no moon. Seeds lie underground, invisible, already alive.',
    reflection: 'Notice whether something wants to move, before you can say toward what. What is the pull, not yet the plan?',
    practice: 'Name one direction — not a plan, just a direction — and let it stay unforced today.',
  },
  'Waxing Crescent': {
    nature: 'A thin edge of light returns. Nothing is certain yet, but the dark is no longer total.',
    reflection: 'What early spark needs protecting from your own impatience right now?',
    practice: 'Choose one small, repeatable action and take it once — not the whole plan, just once.',
  },
  'First Quarter': {
    nature: 'Light and dark split the sky evenly. Neither has won yet.',
    reflection: 'Is there an old way of doing this that has already stopped working?',
    practice: 'Name one decision you’ve been avoiding, and remove one thing that lets you keep avoiding it.',
  },
  'Waxing Gibbous': {
    nature: 'Almost full, almost whole, but not yet — the waiting has its own tension.',
    reflection: 'What is nearly ready? What one adjustment would make it true instead of almost-true?',
    practice: 'Refine one detail of what you’re building rather than starting something new.',
  },
  'Full Moon': {
    nature: 'The whole face is lit. Nothing hides tonight.',
    reflection: 'What has become visible now that was easy to avoid earlier in this cycle?',
    practice: 'Say out loud, or write down, what you now know that you didn’t know at the new moon.',
  },
  'Waning Gibbous': {
    nature: 'The light begins to recede, but slowly — most of it is still here.',
    reflection: 'What did this cycle teach you that becomes more real once you pass it on or use it?',
    practice: 'Share one thing you learned — with someone, or with yourself in writing.',
  },
  'Last Quarter': {
    nature: 'Half the sky again, but moving the other way now — toward dark, not away from it.',
    reflection: 'What is finished, but still taking up room in you — a habit, a story, an obligation?',
    practice: 'Remove one thing — an object, a commitment, a belief — that has already served its purpose.',
  },
  'Waning Crescent': {
    nature: 'A last thin edge before the sky goes dark again.',
    reflection: 'What would change if rest were part of the path, not a delay from it?',
    practice: 'Protect one block of time today for nothing — no input, no output.',
  },
};

// Russian (2026-10-16) — the phase names and their three lines, so the
// moon reads in the person's language like the rest of the app.
const MOON_PHASE_NAME_RU: Record<MoonPhaseName, string> = {
  'New Moon': 'Новолуние',
  'Waxing Crescent': 'Растущий серп',
  'First Quarter': 'Первая четверть',
  'Waxing Gibbous': 'Растущая луна',
  'Full Moon': 'Полнолуние',
  'Waning Gibbous': 'Убывающая луна',
  'Last Quarter': 'Последняя четверть',
  'Waning Crescent': 'Убывающий серп',
};

const MOON_PHASE_CONTENT_RU: Record<MoonPhaseName, MoonPhaseContent> = {
  'New Moon': {
    nature: 'Луны на небе нет. Семена лежат под землёй, невидимые, но уже живые.',
    reflection: 'Заметьте, не хочет ли что-то двигаться — раньше, чем вы можете сказать, куда. Каково это притяжение — ещё не план?',
    practice: 'Назовите одно направление — не план, просто направление — и пусть сегодня оно остаётся без усилия.',
  },
  'Waxing Crescent': {
    nature: 'Возвращается тонкая полоска света. Ничего ещё не определено, но темнота уже не полная.',
    reflection: 'Какую раннюю искру сейчас нужно уберечь от вашего собственного нетерпения?',
    practice: 'Выберите одно маленькое повторяемое действие и сделайте его один раз — не весь план, только раз.',
  },
  'First Quarter': {
    nature: 'Свет и тьма делят небо поровну. Ни одна сторона ещё не взяла верх.',
    reflection: 'Есть ли старый способ делать это, который уже перестал работать?',
    practice: 'Назовите одно решение, которого вы избегали, и уберите одну вещь, которая позволяет его избегать.',
  },
  'Waxing Gibbous': {
    nature: 'Почти полная, почти целая, но ещё нет — у ожидания своё напряжение.',
    reflection: 'Что почти готово? Какая одна поправка сделает это правдой, а не почти-правдой?',
    practice: 'Доработайте одну деталь того, что вы строите, вместо того чтобы начинать новое.',
  },
  'Full Moon': {
    nature: 'Освещён весь лик. Сегодня ничего не прячется.',
    reflection: 'Что стало видно теперь, хотя раньше в этом цикле это было легко обойти?',
    practice: 'Скажите вслух или запишите, что вы знаете теперь и чего не знали в новолуние.',
  },
  'Waning Gibbous': {
    nature: 'Свет начинает убывать, но медленно — почти весь он ещё здесь.',
    reflection: 'Чему научил этот цикл — тому, что становится реальнее, когда передаёшь это дальше или применяешь?',
    practice: 'Поделитесь одним, чему научились, — с кем-то или с собой, письменно.',
  },
  'Last Quarter': {
    nature: 'Снова половина неба, но теперь движение в другую сторону — к темноте, а не от неё.',
    reflection: 'Что уже закончилось, но всё ещё занимает в вас место — привычка, история, обязательство?',
    practice: 'Уберите одну вещь — предмет, обязательство, убеждение, — которая уже сослужила свою службу.',
  },
  'Waning Crescent': {
    nature: 'Последняя тонкая полоска, прежде чем небо снова потемнеет.',
    reflection: 'Что изменилось бы, если бы отдых был частью пути, а не задержкой на нём?',
    practice: 'Сберегите сегодня один отрезок времени ни для чего — ничего не получать и ничего не отдавать.',
  },
};

export function getMoonPhaseName(name: MoonPhaseName, locale: 'en' | 'ru'): string {
  return locale === 'ru' ? MOON_PHASE_NAME_RU[name] : name;
}

export function getMoonPhaseContent(name: MoonPhaseName, locale: 'en' | 'ru'): MoonPhaseContent {
  return locale === 'ru' ? MOON_PHASE_CONTENT_RU[name] : MOON_PHASE_CONTENT[name];
}

export type MeasureBand = 'low' | 'mid' | 'high';

export function getMeasureBand(score: number): MeasureBand {
  if (score < 200) return 'low';
  if (score < 350) return 'mid';
  return 'high';
}

const AXIS_NUDGE: Record<string, string> = {
  calm: 'Let the phase shape your pacing more than your output.',
  clarity: 'Use the phase to decide what matters most, not to collect more input.',
  grounding: 'Anchor this in a body-based action before reflection.',
  intensity: 'Channel the phase into one direction so the charge becomes clean movement.',
};

export function getPersonalizedBridge(phaseName: MoonPhaseName, result: MeasureResult | null) {
  if (!result) {
    return {
      title: 'No recent reading yet',
      body: 'Take a Measure reading to see this phase in light of your current state, not just in the abstract.',
    };
  }

  const band = getMeasureBand(result.vibrationScore);
  const axisNudge = AXIS_NUDGE[result.dominantAxis] ?? 'Use this phase as a timing lens, not a rulebook.';
  const bodyByBand: Record<MeasureBand, string> = {
    low: `Your last reading pointed to ${result.vibrationLevel.name}. Under ${phaseName}, keep it gentle — reduce friction before building momentum.`,
    mid: `Your last reading sits near ${result.vibrationLevel.name}. Under ${phaseName}, use this phase to refine direction rather than force a reset.`,
    high: `Your last reading pointed to ${result.vibrationLevel.name}. Under ${phaseName}, the opening is to turn this clarity into something real.`,
  };

  return {
    title: 'In light of your last reading',
    body: `${bodyByBand[band]} ${axisNudge}`,
  };
}

interface FlowTool {
  // An i18n key (resolved at render time via t()), not the label itself —
  // this file has no access to react-i18next's t(), and hardcoding the
  // English label here silently drifted out of sync with the localized
  // depths.measureLabel/tuneInLabel/levelsLabel strings shown everywhere
  // else these same features are named.
  labelKey: string;
  route: string;
}

const TOOLS: Record<'measure' | 'tunein' | 'levels', FlowTool> = {
  measure: { labelKey: 'depths.measureLabel', route: '/(tabs)/depths/measure' },
  tunein: { labelKey: 'depths.tuneInLabel', route: '/(tabs)/explore/tunein' },
  levels: { labelKey: 'depths.levelsLabel', route: '/(tabs)/explore/levels' },
};

export function getFlowSuggestions(stage: MoonStage, band: MeasureBand | 'unknown'): FlowTool[] {
  const building = stage === 'Spark' || stage === 'Friction';

  if (band === 'low') return building ? [TOOLS.measure, TOOLS.tunein] : [TOOLS.measure, TOOLS.levels];
  if (band === 'high') return building ? [TOOLS.tunein, TOOLS.measure] : [TOOLS.levels, TOOLS.tunein];
  return building ? [TOOLS.measure, TOOLS.tunein] : [TOOLS.levels, TOOLS.measure];
}
