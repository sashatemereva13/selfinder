import type { Locale } from '../store/localeStore';

// The question the person can ask their philosopher about one sphere's
// answer on Depths — in the person's own voice, tapped to send it, so the
// conversation opens with them asking (2026-10-08). One per state, because
// what's worth asking about anger ("what was it that mattered there?")
// isn't what's worth asking about grief. The philosopher is told to help
// them find their own answer, not to supply one (see askAboutAnswer on
// Depths; RULES.md, "The answers are already inside the person").
//
// Russian avoids gendered past-tense verbs, since the person could be
// anyone.
//
// Phrased for Marcus Aurelius' register first; the same questions serve
// every philosopher until their own are written.

type Line = Record<Locale, string>;

const QUESTIONS: Record<string, Record<string, Line>> = {
  stoics: {
    shame: { en: 'Whose judgement was I standing before?', ru: 'Чей суд я здесь чувствую?' },
    guilt: { en: 'Which of my own principles did this go against?', ru: 'Против какого из моих принципов это пошло?' },
    apathy: { en: 'When did this stop mattering?', ru: 'Когда это перестало быть важным?' },
    grief: { en: 'What is it I am missing?', ru: 'Чего мне не хватает?' },
    fear: { en: 'What exactly am I afraid will happen?', ru: 'Чего именно я боюсь?' },
    desire: { en: 'What do I really want here?', ru: 'Чего я на самом деле здесь хочу?' },
    anger: { en: 'What was it that mattered there?', ru: 'Что там было для меня важно?' },
    pride: { en: 'What would remain of this if no one saw it?', ru: 'Что осталось бы от этого, если бы никто этого не видел?' },
    courage: { en: 'What does this ask of me next?', ru: 'Чего это просит от меня дальше?' },
    neutrality: { en: 'What lets me hold this so lightly?', ru: 'Что позволяет мне держать это так легко?' },
    willingness: { en: 'What am I ready to begin?', ru: 'Что мне хочется начать?' },
    acceptance: { en: 'What did I stop fighting?', ru: 'С чем я больше не борюсь?' },
    reason: { en: 'What do I understand now that I did not before?', ru: 'Что теперь стало мне понятно?' },
    love: { en: 'Toward whom does this turn?', ru: 'К кому это обращено?' },
    unconditionallove: { en: 'What makes this enough on its own?', ru: 'Что делает это достаточным само по себе?' },
    peace: { en: 'What is no longer pulling at me?', ru: 'Что меня больше не тянет?' },
    enlightenment: { en: 'What is left when I stop describing it?', ru: 'Что остаётся, когда я перестаю это описывать?' },
  },
};

export function getAnswerQuestion(philosopherId: string, slug: string, locale: Locale): string | null {
  const line = (QUESTIONS[philosopherId] ?? QUESTIONS.stoics)[slug];
  return line ? line[locale] ?? line.en : null;
}
