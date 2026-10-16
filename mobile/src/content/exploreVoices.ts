import type { Locale } from '../store/localeStore';

// The philosopher's one line at the top of Breathe, Tune In and Spill
// (2026-10-16, reviewed in docs/drafts/explore-voices.md) — about the
// practice, never about what the person feels. In Spill they step away for
// the minute of writing (RULES.md, "Spill is the one deliberate absence").

type Line = Record<Locale, string>;
export type ExploreRoom = 'breathe' | 'tunein' | 'spill';

const LINES: Record<string, Record<ExploreRoom, Line>> = {
  stoics: {
    breathe: { en: 'Breathe as you are. Everything else can wait.', ru: 'Дышите как есть. Всё остальное подождёт.' },
    tunein: { en: 'Let the sound do its work. Your part is only to listen.', ru: 'Пусть звук делает своё дело. Ваше — только слушать.' },
    spill: { en: 'I’ll step away. Write what is there, not what looks well.', ru: 'Я отойду. Пишите то, что есть, а не то, что выглядит хорошо.' },
  },
  socrates: {
    breathe: { en: 'Before any question — a breath. Shall we?', ru: 'Прежде любого вопроса — вдох. Начнём?' },
    tunein: { en: 'What do you hear, when you stop trying to hear anything?', ru: 'Что вы слышите, когда перестаёте стараться что-то услышать?' },
    spill: { en: 'For once, I won’t ask anything. I’ll step away — write.', ru: 'На этот раз я ни о чём не спрошу. Я отойду — пишите.' },
  },
  kierkegaard: {
    breathe: { en: 'In stillness, a person comes to themselves. Breathe, and be still.', ru: 'В тишине человек приходит к себе. Дышите и будьте в тишине.' },
    tunein: { en: 'Listen as the bird listens — without worrying about tomorrow.', ru: 'Слушайте, как слушает птица, — не заботясь о завтрашнем дне.' },
    spill: { en: 'No one is watching now. Write as only you can.', ru: 'Сейчас никто не смотрит. Пишите так, как можете только вы.' },
  },
  camus: {
    breathe: { en: 'Just the air going in and out. That’s enough for now.', ru: 'Только воздух — вдох и выдох. Сейчас этого достаточно.' },
    tunein: { en: 'Put the headphones on. Let the world get quieter for a while.', ru: 'Наденьте наушники. Пусть мир ненадолго станет тише.' },
    spill: { en: 'I’ll leave you alone with the page for a minute. Don’t make it pretty.', ru: 'Оставлю вас с листом на минуту. Не старайтесь, чтобы было красиво.' },
  },
  aristotle: {
    breathe: { en: 'Steady breath is a small practice of balance. Begin.', ru: 'Ровное дыхание — малое упражнение в равновесии. Начинайте.' },
    tunein: { en: 'Rest is not idleness; it is how the work is sustained. Listen.', ru: 'Отдых — не праздность: так поддерживается работа. Слушайте.' },
    spill: { en: 'I’ll step away. A minute without judging is a practice too.', ru: 'Я отойду. Минута без оценок — тоже упражнение.' },
  },
};

export function getExploreLine(philosopherId: string | undefined, room: ExploreRoom, locale: Locale): string {
  const line = (LINES[philosopherId ?? ''] ?? LINES.stoics)[room];
  return line[locale] ?? line.en;
}
