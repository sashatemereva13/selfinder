import type { Locale } from '../store/localeStore';
import type { ShiftDoor } from './shiftContent';

// The two Shift sessions' authored cues (docs/shift-concept.md, §4–5).
// Hardcoded narration, never live AI — a pause for a reply would break a
// breath's rhythm (RULES.md, Content/voice). The cues guide attention and
// breath; they never say what the person feels.
//
// Written in Marcus Aurelius' voice first (2026-10-08) — the other four
// philosophers fall back to his words until theirs are written.
//
// A session is a list of steps: timed cues (auto-advance; a tap moves on
// early), optional writing moments (wait for the person), then the return
// to the ring and a closing line.

type Line = Record<Locale, string>;
type Cue = Line & { seconds: number };

// Which part of the session a step belongs to — the sound changes with it
// (session.tsx, SESSION_SOUND).
export type Stage = 'arrive' | 'meet' | 'warmth' | 'gratitude' | 'widen' | 'act' | 'whatFor' | 'where' | 'return' | 'closing';

export type SessionStep =
  // breathGuide: the light shows "in" / "out" while this cue is up — only
  // through the first minute, until the rhythm is in the body.
  | { kind: 'cue'; stage: Stage; text: string; seconds: number; breathGuide?: boolean }
  | { kind: 'input'; stage: Stage; id: 'gratitude' | 'act' | 'where'; prompt: string; hint?: string }
  | { kind: 'return' }
  | { kind: 'closing'; text: string };

// How a state is met in the body — not a ranking (shift-concept.md, §5).
type Family = 'heavy' | 'charged' | 'steady' | 'open';
const FAMILY: Record<string, Family> = {
  shame: 'heavy', guilt: 'heavy', apathy: 'heavy', grief: 'heavy',
  fear: 'charged', desire: 'charged', anger: 'charged', pride: 'charged',
  courage: 'steady', neutrality: 'steady', willingness: 'steady', acceptance: 'steady', reason: 'steady',
  love: 'open', unconditionallove: 'open', peace: 'open', enlightenment: 'open',
};

const c = (seconds: number, en: string, ru: string): Cue => ({ seconds, en, ru });

const ARRIVE: Cue[] = [
  c(8, 'Sit as you are. Nothing here needs to be done well.', 'Сядьте как есть. Здесь ничего не нужно делать хорошо.'),
  c(12, 'Follow the light. Breathe in as it grows, out as it fades.', 'Следите за светом. Вдох — когда он растёт, выдох — когда гаснет.'),
  c(15, 'Slower than you think you need.', 'Медленнее, чем кажется нужным.'),
  c(15, 'Each breath is the only one there is.', 'Каждый вдох — единственный, что есть.'),
  c(10, 'Stay with it a little longer.', 'Побудьте с этим ещё немного.'),
];

// "Start where you are" (Shift toward love) / "Feel where it is" (Use it).
// {{level}} is the state's name.
const MEET: Record<Family, Cue[]> = {
  heavy: [
    c(12, '{{level}} is here. Let it be as heavy as it is.', '{{level}} — здесь. Пусть оно будет таким тяжёлым, какое есть.'),
    c(15, 'You do not have to lift it. Only notice where it rests in you.', 'Не нужно его поднимать. Только заметьте, где оно лежит в вас.'),
    c(15, 'Breathe into that place, and leave it as it is.', 'Дышите в это место и оставьте его как есть.'),
    c(12, 'It is allowed to be here.', 'Ему можно здесь быть.'),
  ],
  charged: [
    c(12, '{{level}} is here. Feel how much of it there is.', '{{level}} — здесь. Почувствуйте, сколько его.'),
    c(15, 'Press your feet into the floor. Let the exhale be long.', 'Упритесь ступнями в пол. Пусть выдох будет долгим.'),
    c(15, 'Open your hands, then close them. Let it move through you.', 'Раскройте ладони, потом сожмите. Пусть это пройдёт сквозь вас.'),
    c(12, 'Nothing has to be done with it yet.', 'Пока с этим ничего не нужно делать.'),
  ],
  steady: [
    c(15, '{{level}} is here. Notice what in you is already steady.', '{{level}} — здесь. Заметьте, что в вас уже устойчиво.'),
    c(15, 'Where does it sit — the chest, the shoulders, the hands?', 'Где оно — в груди, в плечах, в руках?'),
    c(15, 'Rest your attention there, the way you would rest a hand on a table.', 'Положите туда внимание, как кладут руку на стол.'),
    c(12, 'Breathe.', 'Дышите.'),
  ],
  open: [
    c(15, '{{level}} is here. Notice the stillness of it.', '{{level}} — здесь. Заметьте его тишину.'),
    c(15, 'There is nothing to add to it, and nothing to take away.', 'К этому нечего прибавить и нечего отнять.'),
    c(15, 'Only breathe, and let it be wide.', 'Только дышите, и пусть оно будет широким.'),
  ],
};

const FIND_WARMTH: Cue[] = [
  c(15, 'Bring to mind one person with whom warmth comes easily.', 'Вспомните одного человека, с которым тепло приходит легко.'),
  c(12, 'Not the most important one. The easiest one.', 'Не самого важного. Самого лёгкого.'),
  c(15, 'See their face. Hear how they say your name.', 'Увидьте лицо этого человека. Услышьте, как он произносит ваше имя.'),
  c(15, 'Notice where the warmth begins in you.', 'Заметьте, где в вас начинается тепло.'),
  c(18, 'Breathe into it. Let it grow a little with each breath.', 'Дышите в него. Пусть с каждым вдохом оно становится чуть больше.'),
  c(15, 'This is yours. It was already here.', 'Это ваше. Оно уже было здесь.'),
];
// From a state beside love: giving the stillness a direction (§3).
const FIND_WARMTH_FROM_OPEN = c(12, 'Now, if you like, give it a direction.', 'А теперь, если хотите, дайте ему направление.');

const GRATITUDE: Cue[] = [
  c(15, 'I began my notebook by thanking each person for what they taught me.', 'Свою тетрадь я начал с благодарности — каждому, за то, чему он меня научил.'),
  c(15, 'Find three small things from today. Small is enough.', 'Найдите три маленькие вещи из сегодняшнего дня. Маленьких достаточно.'),
];

const WIDEN: Cue[] = [
  c(15, 'Now let the warmth turn toward you.', 'Теперь пусть тепло повернётся к вам.'),
  c(15, 'As you would toward a friend who has had a long day.', 'Как к другу после долгого дня.'),
  c(15, 'Now toward someone you hardly know — someone you passed today.', 'А теперь — к кому-то, кого вы почти не знаете. К тому, мимо кого прошли сегодня.'),
  c(15, 'We are made for one another, like hands, like feet.', 'Мы созданы друг для друга, как руки, как ноги.'),
];

// Use it — what each state is known to be for, as a fact about the state
// followed by a question; never what the person feels (§4b).
const WHAT_FOR: Record<string, Line> = {
  shame: { en: 'Shame points at a standard you hold. Whose standard is it?', ru: 'Стыд указывает на мерку, которой вы себя меряете. Чья это мерка?' },
  guilt: { en: 'Guilt marks where an action parted from your own values. Which value?', ru: 'Вина отмечает, где поступок разошёлся с вашими ценностями. С какой?' },
  apathy: { en: 'Apathy is a pause — the body refusing more, for now. What is it refusing?', ru: 'Апатия — это пауза: тело пока отказывается от большего. От чего оно отказывается?' },
  grief: { en: 'Grief is love with nowhere to go. What did you love here?', ru: 'Горе — это любовь, которой некуда идти. Что вы здесь любили?' },
  fear: { en: 'Fear sharpens attention to what could go wrong. What is it watching for?', ru: 'Страх обостряет внимание к тому, что может пойти не так. За чем он следит?' },
  desire: { en: 'Desire shows what you are reaching for. What is it?', ru: 'Желание показывает, к чему вы тянетесь. К чему?' },
  anger: { en: 'Anger rises when something that matters is crossed. What matters here?', ru: 'Гнев поднимается, когда задето что-то важное. Что здесь важно?' },
  pride: { en: 'Pride holds a standard up high. What standard are you holding?', ru: 'Гордость высоко держит мерку. Какую мерку держите вы?' },
  courage: { en: 'Courage is fear walking forward anyway. Toward what?', ru: 'Мужество — это страх, который всё равно идёт вперёд. Куда?' },
  neutrality: { en: 'Neutrality is room to see clearly. What do you see from here?', ru: 'Нейтральность — это простор, чтобы видеть ясно. Что вам отсюда видно?' },
  willingness: { en: 'Willingness is a door already open. What is it open to?', ru: 'Готовность — это уже открытая дверь. Куда она открыта?' },
  acceptance: { en: 'Acceptance frees the strength that resisting used. Where could it go?', ru: 'Принятие освобождает силу, которая уходила на сопротивление. Куда её направить?' },
  reason: { en: 'Reason sees how things fit together. What do you see?', ru: 'Разум видит, как всё связано. Что вы видите?' },
  love: { en: 'Love is warmth that goes toward someone. Toward whom, today?', ru: 'Любовь — это тепло, которое идёт к кому-то. К кому — сегодня?' },
  unconditionallove: { en: 'This warmth asks nothing back. Who could use some of it?', ru: 'Это тепло ничего не просит взамен. Кому оно пригодилось бы?' },
  peace: { en: 'Peace is a steadiness others can lean on. Who might?', ru: 'Покой — это устойчивость, на которую могут опереться другие. Кто мог бы?' },
  enlightenment: { en: 'Nothing here needs defending. What does that leave you free to do?', ru: 'Здесь нечего защищать. Что это оставляет вам свободным сделать?' },
};
const WHAT_FOR_AFTER: Cue[] = [
  c(18, 'Let the answer come in its own time.', 'Пусть ответ придёт в своё время.'),
  c(12, 'You do not have to say it aloud.', 'Не нужно произносить его вслух.'),
];

const CLOSING: Record<ShiftDoor, Line> = {
  love: { en: 'That is the work for today. The rest belongs to the day.', ru: 'На сегодня это вся работа. Остальное принадлежит дню.' },
  use: { en: 'It goes with you into the day.', ru: 'Оно идёт с вами в этот день.' },
};

const PROMPTS = {
  gratitude: { en: 'One word for each, if you like.', ru: 'По одному слову на каждую, если хотите.' },
  act: { en: 'Is there one small kind thing you could do today?', ru: 'Есть ли одно маленькое доброе дело, которое вы могли бы сделать сегодня?' },
  where: { en: 'Where in your day could this go?', ru: 'Куда в вашем дне это могло бы пойти?' },
};

// Possibilities for "where could this go", per state — only examples, so
// the person's own answer stays theirs (2026-10-09, from testing: one
// shared line about workouts and hard conversations fitted anger, not
// neutrality). "Or something else entirely" is added after each.
const WHERE_HINTS: Record<string, Line> = {
  shame: { en: 'Telling one safe person, writing it down, or setting a standard of your own.', ru: 'Рассказать одному надёжному человеку, записать или задать свою собственную мерку.' },
  guilt: { en: 'An apology, a repair, or a different choice next time.', ru: 'Извинение, исправление или другой выбор в следующий раз.' },
  apathy: { en: 'Rest, one small task, or simply a walk.', ru: 'Отдых, одно маленькое дело или просто прогулка.' },
  grief: { en: "A letter you won't send, a visit, or time set aside to remember.", ru: 'Письмо, которое вы не отправите, визит или время, отведённое на память.' },
  fear: { en: "A careful plan, a question you've been putting off, or a first small step.", ru: 'Продуманный план, вопрос, который вы откладывали, или первый маленький шаг.' },
  desire: { en: 'Saying what you want out loud, a plan to reach it, or noticing what you already have.', ru: 'Сказать вслух, чего вы хотите, наметить путь к этому или заметить, что у вас уже есть.' },
  anger: { en: 'A workout, a hard conversation, or a boundary said out loud.', ru: 'Тренировка, трудный разговор или граница, сказанная вслух.' },
  pride: { en: 'Finishing something well, teaching someone, or work no one will see.', ru: 'Хорошо закончить дело, научить кого-то или работа, которую никто не увидит.' },
  courage: { en: "The call you've been putting off, a new start, or saying no.", ru: 'Звонок, который вы откладывали, новое начало или сказанное «нет».' },
  neutrality: { en: "A decision you've been weighing, an honest look at a plan, or listening to someone.", ru: 'Решение, которое вы взвешивали, честный взгляд на план или выслушать кого-то.' },
  willingness: { en: "Something you've meant to learn, an offer of help, or a first try.", ru: 'То, чему вы давно хотели научиться, предложение помощи или первая попытка.' },
  acceptance: { en: 'Letting something be finished, a plan that changed, or rest.', ru: 'Позволить чему-то закончиться, изменившийся план или отдых.' },
  reason: { en: 'A problem you can now think through, explaining something, or writing it down.', ru: 'Задача, которую теперь можно продумать, объяснить что-то кому-то или записать.' },
  love: { en: 'A message to someone, time with them, or a small kindness.', ru: 'Сообщение кому-то, время с этим человеком или маленькая доброта.' },
  unconditionallove: { en: 'Kindness to a stranger, patience with someone difficult, or care for yourself.', ru: 'Доброта к незнакомцу, терпение к трудному человеку или забота о себе.' },
  peace: { en: 'Being a calm presence for someone, unhurried work, or quiet.', ru: 'Быть спокойным присутствием для кого-то, неспешная работа или тишина.' },
  enlightenment: { en: 'Whatever is in front of you, done fully.', ru: 'То, что перед вами, сделанное полностью.' },
};
const ELSE: Line = { en: 'Or something else entirely.', ru: 'Или что-то совсем другое.' };

export function buildSession(door: ShiftDoor, slug: string, levelName: string, locale: Locale): SessionStep[] {
  const say = (line: Line) => (line[locale] ?? line.en).replace('{{level}}', levelName.charAt(0).toUpperCase() + levelName.slice(1));
  const cues = (stage: Stage, list: Cue[], breathGuide = false): SessionStep[] =>
    list.map((cue) => ({ kind: 'cue', stage, text: say(cue), seconds: cue.seconds, breathGuide }));
  const family = FAMILY[slug] ?? 'steady';

  if (door === 'love') {
    return [
      ...cues('arrive', ARRIVE, true),
      ...cues('meet', MEET[family]),
      ...(family === 'open' ? cues('warmth', [FIND_WARMTH_FROM_OPEN]) : []),
      ...cues('warmth', FIND_WARMTH),
      ...cues('gratitude', GRATITUDE),
      { kind: 'input', stage: 'gratitude', id: 'gratitude', prompt: say(PROMPTS.gratitude) },
      ...cues('widen', WIDEN),
      { kind: 'input', stage: 'act', id: 'act', prompt: say(PROMPTS.act) },
      { kind: 'return' },
      { kind: 'closing', text: say(CLOSING.love) },
    ];
  }
  return [
    ...cues('arrive', ARRIVE.slice(0, 4), true),
    ...cues('meet', MEET[family]),
    { kind: 'cue', stage: 'whatFor', text: say(WHAT_FOR[slug] ?? WHAT_FOR.neutrality), seconds: 20 },
    ...cues('whatFor', WHAT_FOR_AFTER),
    { kind: 'input', stage: 'where', id: 'where', prompt: say(PROMPTS.where), hint: `${say(WHERE_HINTS[slug] ?? WHERE_HINTS.neutrality)} ${say(ELSE)}` },
    { kind: 'return' },
    { kind: 'closing', text: say(CLOSING.use) },
  ];
}
