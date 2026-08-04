import { Locale } from '../store/localeStore';

// Each phase drives the breathing orb directly: `scale` is the target the
// orb animates to over `seconds` (via withTiming), 'hold' means stay at
// whatever scale it already reached. This is enough to express any
// inhale/hold/exhale pattern, including a double-inhale like the
// physiological sigh, without a separate "direction" concept to keep in sync.
export interface BreathingPhase {
  label: string;
  seconds: number;
  scale: number | 'hold';
}

export interface BreathingPatternVoice {
  name: string;
  subtitle: string;
  useFor: string;
  intent: string;
  howTo: string;
  phases: BreathingPhase[];
}

export interface BreathingPattern {
  id: string;
  name: string;
  subtitle: string;
  // One short line answering "why would I pick this one" — shown right on
  // the picker screen so choosing between patterns doesn't require reading
  // the longer `intent` paragraph first.
  useFor: string;
  intent: string;
  // How to actually draw each breath — belly vs chest, nose vs mouth. This
  // is the part people get wrong by default (shallow chest breathing),
  // and it's the actual mechanism behind the calming effect, so it's
  // surfaced as its own instruction rather than folded into `intent`.
  howTo: string;
  color: string; // rgb triplet, same convention as TuneInState
  phases: BreathingPhase[];
  rounds: number;
  // Russian display text — name/subtitle/useFor/intent/howTo/phases all
  // swapped together at render time via getLocalizedBreathingPattern();
  // id/color/rounds stay fixed regardless of locale (id is used in
  // track('breathing_started'/'breathing_completed', { patternId: ... }),
  // so it must stay a stable English identifier).
  translations?: { ru: BreathingPatternVoice };
}

export const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: 'extended-exhale',
    name: 'Extended Exhale',
    subtitle: '4 in, 8 out',
    useFor: 'For steady, everyday calm.',
    intent:
      'An exhale twice as long as the inhale is what actually tells your nervous system it can stand down. Good as a daily practice, not just for hard moments.',
    howTo:
      'Breathe in through your nose, letting your belly rise — not your chest. Breathe out slowly through your mouth, like a long, soft sigh.',
    color: '159,255,208',
    phases: [
      { label: 'Breathe in', seconds: 4, scale: 1.15 },
      { label: 'Breathe out', seconds: 8, scale: 0.85 },
    ],
    rounds: 6,
    translations: {
      ru: {
        name: 'Удлинённый выдох',
        subtitle: '4 вдох, 8 выдох',
        useFor: 'Для ровного, повседневного спокойствия.',
        intent:
          'Выдох вдвое длиннее вдоха — это именно то, что говорит вашей нервной системе, что можно расслабиться. Хорошо подходит как ежедневная практика, а не только для трудных моментов.',
        howTo:
          'Вдыхайте через нос, позволяя животу подниматься — не груди. Выдыхайте медленно через рот, как долгий, мягкий вздох.',
        phases: [
          { label: 'Вдох', seconds: 4, scale: 1.15 },
          { label: 'Выдох', seconds: 8, scale: 0.85 },
        ],
      },
    },
  },
  {
    id: 'physiological-sigh',
    name: 'Physiological Sigh',
    subtitle: 'Two breaths in, one long breath out',
    useFor: 'For fast relief in the moment.',
    intent:
      'The fastest known way to bring an activated body back down — a second short inhale on top of the first, then a slow release. Reach for this one when you need relief right now.',
    howTo:
      'Both breaths in through your nose, belly first — then let the exhale go through your mouth, slow and complete.',
    color: '246,188,100',
    phases: [
      { label: 'Breathe in', seconds: 2, scale: 1.1 },
      { label: 'Breathe in again', seconds: 1, scale: 1.25 },
      { label: 'Let it go', seconds: 6, scale: 0.85 },
    ],
    rounds: 5,
    translations: {
      ru: {
        name: 'Физиологический вздох',
        subtitle: 'Два вдоха, один долгий выдох',
        useFor: 'Для быстрого облегчения прямо сейчас.',
        intent:
          'Самый быстрый известный способ вернуть активированное тело в спокойное состояние — второй короткий вдох поверх первого, затем медленное освобождение. Используйте это, когда облегчение нужно прямо сейчас.',
        howTo:
          'Оба вдоха через нос, сначала животом — затем позвольте выдоху выйти через рот, медленно и полностью.',
        phases: [
          { label: 'Вдох', seconds: 2, scale: 1.1 },
          { label: 'Ещё один вдох', seconds: 1, scale: 1.25 },
          { label: 'Отпустите', seconds: 6, scale: 0.85 },
        ],
      },
    },
  },
];

export function getLocalizedBreathingPattern(pattern: BreathingPattern, locale: Locale): BreathingPattern {
  const translation = locale === 'ru' ? pattern.translations?.ru : undefined;
  return translation ? { ...pattern, ...translation } : pattern;
}

// One short in-character line per philosopher, shown once when the screen
// opens — the "accompaniment" the user asked for. Static and hand-written
// rather than LLM-generated: this screen exists partly for acute-stress
// moments (physiological sigh), and waiting on a network call before you can
// start breathing works against the entire point.
// Shown once a full session (all rounds) finishes on its own — never on a
// manual stop, since congratulating someone for a session they cut short
// would ring false. Picked at random each time so it doesn't read as a
// canned toast on repeat use.
const BREATHING_COMPLETION_LINES: Record<Locale, string[]> = {
  en: [
    'Well done. Have a great day.',
    "Good job — however you're feeling now, you got there on your own breath.",
    'That was a full session. Carry that steadiness with you.',
    "Nicely done. That's not nothing.",
    'Good work. Go easy on yourself for the rest of today.',
    'Done — you showed up for it. Have a great day.',
  ],
  ru: [
    'Отлично сделано. Хорошего вам дня.',
    'Хорошая работа — что бы вы ни чувствовали сейчас, вы дошли до этого на собственном дыхании.',
    'Это была полная сессия. Пронесите это спокойствие с собой.',
    'Хорошо получилось. Это уже немало.',
    'Хорошая работа. Будьте помягче к себе до конца сегодняшнего дня.',
    'Готово — вы для этого показались. Хорошего вам дня.',
  ],
};

export function getRandomCompletionLine(locale: Locale): string {
  const lines = BREATHING_COMPLETION_LINES[locale] ?? BREATHING_COMPLETION_LINES.en;
  return lines[Math.floor(Math.random() * lines.length)];
}

export const BREATHING_INTROS: Record<string, string> = {
  socrates:
    "You don't need to think your way out of this one. Just breathe, and notice what's still true after.",
  stoics:
    'Your breath is the one lever always within your control, even when nothing else is. Use it.',
  kierkegaard:
    "You don't have to understand the anxiety to breathe through it. Begin anyway.",
  camus:
    "The body doesn't wait for permission to feel better. Neither should you. Breathe.",
  aristotle:
    'This is practice, not theory — a few honest breaths, repeated, is how the body actually learns calm.',
};

export const BREATHING_INTROS_RU: Record<string, string> = {
  socrates:
    'Не нужно думать, чтобы выбраться из этого. Просто дышите и замечайте, что остаётся правдой после.',
  stoics:
    'Ваше дыхание — единственный рычаг, который всегда в вашей власти, даже когда всё остальное нет. Используйте его.',
  kierkegaard:
    'Не обязательно понимать тревогу, чтобы продышать через неё. Начните всё равно.',
  camus:
    'Тело не ждёт разрешения, чтобы почувствовать себя лучше. И вам не стоит. Дышите.',
  aristotle:
    'Это практика, а не теория — несколько честных вдохов, повторённых снова, — вот как тело на самом деле учится спокойствию.',
};

export function getLocalizedBreathingIntro(philosopherId: string, locale: Locale): string | undefined {
  return locale === 'ru' ? BREATHING_INTROS_RU[philosopherId] : BREATHING_INTROS[philosopherId];
}
