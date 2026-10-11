import type { Locale } from '../store/localeStore';

// Shift's authored words (docs/shift-concept.md). Hardcoded narration, not
// live AI (RULES.md, Content/voice) — per philosopher, so the offer is
// asked in the voice the person chose.

export type ShiftDoor = 'use' | 'love';

// States beside love on the ring, where "toward love" means giving a wide
// stillness a direction — never "down" (docs/shift-concept.md, §3).
export const OPEN_STATES = ['unconditionallove', 'peace', 'enlightenment'];

type Line = Record<Locale, string>;

// The offer: two equal answers, asked once per reading. {{level}} is the
// state's name capitalised, {{levelLower}} the same in lower case.
const OFFER_LINES: Record<string, { offer: Line; atLove: Line }> = {
  socrates: {
    offer: {
      en: '{{level}} is here, and it is yours. Shall we see what it can do — or walk toward love?',
      ru: '{{level}} — здесь, и это ваше. Посмотрим, на что оно способно, — или пойдём к любви?',
    },
    atLove: {
      en: 'Love is here. Where would you like it to go today?',
      ru: 'Любовь здесь. Куда вы хотите её направить сегодня?',
    },
  },
  stoics: {
    offer: {
      en: '{{level}} is the material you have today. Put it to use — or turn toward love. Both are in your power.',
      ru: '{{level}} — материал, который у вас сегодня есть. Пустите его в дело — или повернитесь к любви. И то и другое в вашей власти.',
    },
    atLove: {
      en: 'Love is here. Give it work to do.',
      ru: 'Любовь здесь. Дайте ей дело.',
    },
  },
  kierkegaard: {
    offer: {
      en: '{{level}} is yours. You may take it up and use it, or move toward love. No one can choose this for you.',
      ru: '{{level}} — ваше. Можно взять его и применить, а можно двинуться к любви. Никто не выберет за вас.',
    },
    atLove: {
      en: 'Love is here. But love is a deed — toward whom?',
      ru: 'Любовь здесь. Но любовь — это поступок. К кому?',
    },
  },
  camus: {
    offer: {
      en: '{{level}} it is, then. Put it to work — or go toward love. Your call.',
      ru: 'Значит, {{levelLower}}. Пустите это в дело — или идите к любви. Решать вам.',
    },
    atLove: {
      en: 'Love, then. Where will you take it today?',
      ru: 'Значит, любовь. Куда вы понесёте её сегодня?',
    },
  },
  aristotle: {
    offer: {
      en: '{{level}} has a use, and so does love. Which will you practise today?',
      ru: 'У состояния «{{levelLower}}» есть применение, как и у любви. Что вы будете практиковать сегодня?',
    },
    atLove: {
      en: 'Love is here. Every virtue shows itself in action — where will this one?',
      ru: 'Любовь здесь. Каждая добродетель проявляется в действии — где проявится эта?',
    },
  },
};

export function getOfferLine(
  philosopherId: string,
  locale: Locale,
  levelName: string,
  atLove: boolean
): string {
  const lines = OFFER_LINES[philosopherId] ?? OFFER_LINES.socrates;
  const line = atLove ? lines.atLove : lines.offer;
  const text = line[locale] ?? line.en;
  return text
    .replace('{{level}}', levelName.charAt(0).toUpperCase() + levelName.slice(1))
    .replace('{{levelLower}}', levelName.toLowerCase());
}
