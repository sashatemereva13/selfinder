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
//                 (done once a message is actually sent about it)
// offer         — level page read → the Shift offer: Use it, or Shift toward love
//                 (docs/shift-concept.md). Asked once per reading.
// rest          — the offer has been seen, answered or not → nothing more
//                 to point to today; the step is quiet
// measureAgain  — the latest reading is from an earlier day → Measure
export type SeamState = 'firstMeasure' | 'learn' | 'talk' | 'offer' | 'rest' | 'measureAgain';

export function getSeamState(
  currentResult: MeasureResult | null,
  seen: { levelPageSeenFor: string | null; talkedFor: string | null; offerSeenFor: string | null }
): SeamState {
  if (!currentResult) return 'firstMeasure';
  const at = currentResult.savedAt;
  if (getRelativeTimeBucket(at) !== 'today') return 'measureAgain';
  if (seen.levelPageSeenFor !== at) return 'learn';
  // Talking is optional, never a gate to the offer (2026-10-08, from
  // testing: having talked before the step could notice, it was stuck on
  // "talk" with no way on). The conversation stays a full place on the
  // map; 'talk' remains a state for when it should lead again.
  if (seen.offerSeenFor !== at) return 'offer';
  return 'rest';
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
    offer: {
      en: 'You know its name and what it is for. What would you like to do with it?',
      ru: 'Вы знаете его имя и для чего оно. Что вы хотите с ним сделать?',
    },
    rest: {
      en: 'Enough for today. The questions will keep.',
      ru: 'На сегодня довольно. Вопросы подождут.',
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
    offer: {
      en: 'What is in your power now is what you do with it. Choose.',
      ru: 'В вашей власти теперь — что вы с этим сделаете. Выбирайте.',
    },
    rest: {
      en: 'The day’s work is done. Rest is part of the discipline.',
      ru: 'Дневная работа сделана. Отдых — тоже часть дисциплины.',
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
    offer: {
      en: 'There is a choice in front of you now, and it is yours alone.',
      ru: 'Перед вами выбор, и он только ваш.',
    },
    rest: {
      en: 'You looked at today honestly. That is enough.',
      ru: 'Вы честно взглянули на этот день. Этого довольно.',
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
    offer: {
      en: "So that's where you are. Now — what do you want to do with it?",
      ru: 'Вот где вы. А теперь — что вы хотите с этим делать?',
    },
    rest: {
      en: "That's today. Go and live the rest of it.",
      ru: 'Это было сегодня. Идите и проживите остальное.',
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
    offer: {
      en: 'You understand it now. What remains is to choose what to do with it.',
      ru: 'Теперь вы это понимаете. Осталось выбрать, что с этим делать.',
    },
    rest: {
      en: 'Enough for one day. Come back tomorrow and look again.',
      ru: 'Достаточно для одного дня. Возвращайтесь завтра и взгляните снова.',
    },
    measureAgain: {
      en: "A new day, a new reading. Let's see where you are today.",
      ru: 'Новый день — новый взгляд. Посмотрим, где вы сегодня.',
    },
  },
};

// "Measure again", by how long it's been — moved here from the Guide
// screen's old nudge banner (2026-10-08), whose lines knew the difference
// between yesterday and three weeks ago. Kept only the ones that invite a
// look; the ones that read as guilt for not having looked ("a practice you
// don't return to isn't really a practice") were dropped (RULES.md: no
// "you missed a day"). The plain measureAgain line above stays as the
// fallback.
type Gap = 'yesterday' | 'thisWeek' | 'longerAgo';
const MEASURE_AGAIN_LINES: Record<string, Record<Gap, Line>> = {
  socrates: {
    yesterday: { en: 'Has anything shifted since yesterday?', ru: 'Изменилось ли что-нибудь со вчерашнего дня?' },
    thisWeek: {
      en: 'Still the same answer as a few days ago — or has the question changed?',
      ru: 'Всё тот же ответ, что несколько дней назад, — или изменился сам вопрос?',
    },
    longerAgo: { en: "It's been a while since you asked. What would the answer be now?", ru: 'Вы давно не спрашивали. Каким был бы ответ сейчас?' },
  },
  stoics: {
    yesterday: { en: 'The ground may have shifted since yesterday.', ru: 'Со вчерашнего дня почва могла сдвинуться.' },
    thisWeek: {
      en: "Several days have passed. What was true then isn't owed to still be true.",
      ru: 'Прошло несколько дней. То, что было верно тогда, не обязано быть верным сейчас.',
    },
    longerAgo: {
      en: "It's been weeks since you last observed yourself closely. That's long enough for the ground to have moved.",
      ru: 'Прошли недели с тех пор, как вы внимательно смотрели на себя. Этого достаточно, чтобы почва сдвинулась.',
    },
  },
  kierkegaard: {
    yesterday: { en: 'Whoever you were yesterday may not be who you are now.', ru: 'Тот, кем вы были вчера, может уже не быть тем, кто вы сейчас.' },
    thisWeek: {
      en: 'Whoever you were a few days ago has already had days to become someone else.',
      ru: 'У того, кем вы были несколько дней назад, уже было время стать кем-то другим.',
    },
    longerAgo: { en: 'Whoever you were weeks ago is nearly a stranger by now.', ru: 'Тот, кем вы были несколько недель назад, теперь почти незнакомец.' },
  },
  camus: {
    yesterday: { en: "The ground didn't stay still overnight. Worth a second look.", ru: 'За ночь земля не стояла на месте. Стоит взглянуть ещё раз.' },
    thisWeek: { en: 'A few days on, and the ground has moved. Have a look.', ru: 'Прошло несколько дней, и земля сдвинулась. Взгляните.' },
    longerAgo: {
      en: "Weeks since you looked. You've been standing somewhere new this whole time.",
      ru: 'Недели с тех пор, как вы смотрели. Всё это время вы стояли где-то в новом месте.',
    },
  },
  aristotle: {
    yesterday: { en: "A new day, a new reading. Let's see where you are today.", ru: 'Новый день — новый взгляд. Посмотрим, где вы сегодня.' },
    thisWeek: { en: "A few days have passed. Let's see where you stand now.", ru: 'Прошло несколько дней. Посмотрим, где вы теперь.' },
    longerAgo: {
      en: 'It has been weeks. Start again where every practice starts — with a look.',
      ru: 'Прошли недели. Начните там, где начинается любая практика, — с взгляда.',
    },
  },
};

export function getSeamLine(
  philosopherId: string,
  state: SeamState,
  locale: Locale,
  lastReadingAt?: string | null
): string {
  if (state === 'measureAgain' && lastReadingAt) {
    const gap = getRelativeTimeBucket(lastReadingAt);
    const byGap = (MEASURE_AGAIN_LINES[philosopherId] ?? MEASURE_AGAIN_LINES.socrates)[gap as Gap];
    if (byGap) return byGap[locale] ?? byGap.en;
  }
  const lines = SEAM_LINES[philosopherId] ?? SEAM_LINES.socrates;
  return lines[state][locale] ?? lines[state].en;
}
