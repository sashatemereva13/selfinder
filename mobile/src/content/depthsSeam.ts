import { MeasureResult } from '../types';
import type { Locale } from '../store/localeStore';
import { getRelativeTimeBucket } from '../utils/relativeTime';

// Depths' philosopher seam — the one line your philosopher says in the
// middle of Depths, between the reading and the menu, pointing to exactly
// one next step (RULES.md, "The philosopher always points to exactly one
// next step"). Authored, not live AI: it has to render instantly and hold
// each philosopher's voice exactly. Guidance about what to DO in the app,
// never about how to feel.
//
// firstMeasure  — no reading yet → Measure
// learn         — a reading from today whose level page they haven't
//                 opened → what that state is for (curiosity is highest
//                 right after learning what the state is called)
// talk          — today's reading, level page read → talk it through
// measureAgain  — the latest reading is from an earlier day → Measure
export type SeamState = 'firstMeasure' | 'learn' | 'talk' | 'measureAgain';

export function getSeamState(
  currentResult: MeasureResult | null,
  levelPageSeenFor: string | null
): SeamState {
  if (!currentResult) return 'firstMeasure';
  if (getRelativeTimeBucket(currentResult.savedAt) !== 'today') return 'measureAgain';
  if (levelPageSeenFor !== currentResult.savedAt) return 'learn';
  return 'talk';
}

type Line = Record<Locale, string>;

const SEAM_LINES: Record<string, Record<SeamState, Line>> = {
  socrates: {
    firstMeasure: {
      en: "Before anything else: where do you stand? Let's find out.",
      ru: 'Прежде всего: где вы сейчас? Давайте узнаем.',
    },
    learn: {
      en: "It has a name now. Do you know what it's for?",
      ru: 'Теперь у этого есть имя. А вы знаете, для чего это состояние?',
    },
    talk: {
      en: "You've read about it. Does it sound like you?",
      ru: 'Вы прочли о нём. Это похоже на вас?',
    },
    measureAgain: {
      en: 'That was then. Where do you stand now?',
      ru: 'Это было тогда. Где вы стоите теперь?',
    },
  },
  stoics: {
    firstMeasure: {
      en: 'Begin where every discipline begins — with an honest look.',
      ru: 'Начните там, где начинается любая дисциплина, — с честного взгляда.',
    },
    learn: {
      en: 'Now you know what it is called. Next, learn what it is.',
      ru: 'Теперь вы знаете, как это называется. Дальше — узнайте, что это такое.',
    },
    talk: {
      en: 'You have studied it. Now say plainly what you make of it.',
      ru: 'Вы изучили его. Теперь скажите прямо, что вы об этом думаете.',
    },
    measureAgain: {
      en: 'What was true then need not be true now. Look again.',
      ru: 'То, что было верно тогда, не обязано быть верным сейчас. Взгляните снова.',
    },
  },
  kierkegaard: {
    firstMeasure: {
      en: 'Everything here starts with one honest look at where you are.',
      ru: 'Всё здесь начинается с одного честного взгляда на то, где вы.',
    },
    learn: {
      en: 'A name is only the beginning. Go and see what yours means.',
      ru: 'Имя — только начало. Посмотрите, что значит ваше.',
    },
    talk: {
      en: 'Knowing about it is one thing. Tell me what it is like from inside.',
      ru: 'Знать о нём — одно. Расскажите, каково это изнутри.',
    },
    measureAgain: {
      en: 'Whoever looked last time has had time to change. Look again.',
      ru: 'Тот, кто смотрел в прошлый раз, успел измениться. Взгляните снова.',
    },
  },
  camus: {
    firstMeasure: {
      en: "Start by looking at where you're actually standing. The rest can wait.",
      ru: 'Для начала посмотрите, где вы на самом деле стоите. Остальное подождёт.',
    },
    learn: {
      en: "Now it has a name. Go see what it does — it's more curious than it sounds.",
      ru: 'Теперь у этого есть имя. Посмотрите, что оно делает, — это любопытнее, чем кажется.',
    },
    talk: {
      en: "Now you know what the books say. Tell me what it's actually like.",
      ru: 'Теперь вы знаете, что пишут в книгах. Расскажите, как это на самом деле.',
    },
    measureAgain: {
      en: 'The ground has moved since you last looked. Look again.',
      ru: 'С тех пор как вы смотрели, земля сдвинулась. Взгляните снова.',
    },
  },
  aristotle: {
    firstMeasure: {
      en: 'Start with a reading. Everything else here builds on it.',
      ru: 'Начните с «Где я». Всё остальное здесь строится на этом.',
    },
    learn: {
      en: 'Every state has a purpose. Go and learn what yours is for.',
      ru: 'У каждого состояния есть назначение. Узнайте, в чём назначение вашего.',
    },
    talk: {
      en: 'Knowledge grows useful once it is put into words. Talk it through with me.',
      ru: 'Знание становится полезным, когда его выговоришь. Обсудите это со мной.',
    },
    measureAgain: {
      en: "A new day, a new reading. Let's see where you are today.",
      ru: 'Новый день — новый взгляд. Посмотрим, где вы сегодня.',
    },
  },
};

export function getSeamLine(philosopherId: string, state: SeamState, locale: Locale): string {
  const lines = SEAM_LINES[philosopherId] ?? SEAM_LINES.socrates;
  return lines[state][locale] ?? lines[state].en;
}
