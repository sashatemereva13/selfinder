// A curated bank of pre-written ambitions to recognize from, not just
// generate from a blank page — inspired by The School of Life's "What Do
// I Really Want to Achieve?" card set (160 cards spanning life domains,
// meant for recognition, not generation). Deliberately NOT modeled on
// cardsDeck.ts's own drawCard() pattern: Cards' single-random-draw is
// explicitly anti-browsing by design (see that file's own comment —
// letting people fish for a "right" card would turn the draw into a
// search for an answer), but this bank's whole point is the opposite —
// scanning a full list and recognizing something that's already true.
// Started smaller than the School of Life reference (~20-30 entries
// across a few domains, not their full ~160) per the user's own explicit
// choice, to keep the initial content effort real but bounded — more
// domains/entries can be added later the same way.
//
// Every entry is phrased as a named ambition in the person's own
// possible first-person voice ("More freedom in how I spend my time"),
// never as a claim about them ("You want more freedom") — same
// "Selfinder never asserts a claim about the user" rule as everywhere
// else. Picking one only ever prefills the wish composer's free-text
// input, fully editable before it's ever saved — never a shortcut past
// the person's own authorship of their wish.
export type WishPromptDomain = 'work' | 'love' | 'family' | 'body' | 'money' | 'leisure';

export interface WishPromptEntry {
  id: string;
  domain: WishPromptDomain;
  text: { en: string; ru: string };
}

export const WISH_PROMPTS: WishPromptEntry[] = [
  // Work
  {
    id: 'workMeaningful',
    domain: 'work',
    text: { en: 'Work that feels meaningful, not just necessary', ru: 'Работа, которая ощущается значимой, а не просто нужной' },
  },
  {
    id: 'workOwnPace',
    domain: 'work',
    text: { en: 'To set my own pace instead of always reacting to others', ru: 'Задавать свой собственный темп, а не постоянно реагировать на других' },
  },
  {
    id: 'workRecognition',
    domain: 'work',
    text: { en: 'To be recognized for what I actually contribute', ru: 'Чтобы меня замечали за то, что я на самом деле вношу' },
  },
  {
    id: 'workNewDirection',
    domain: 'work',
    text: { en: 'The courage to try a completely different direction', ru: 'Смелость попробовать совершенно другое направление' },
  },
  {
    id: 'workLessAnxious',
    domain: 'work',
    text: { en: 'To stop feeling anxious the moment I open my laptop', ru: 'Перестать чувствовать тревогу в тот момент, когда открываю ноутбук' },
  },
  // Love
  {
    id: 'loveSeen',
    domain: 'love',
    text: { en: 'To feel truly seen by the person closest to me', ru: 'Чувствовать, что человек, который мне ближе всех, действительно меня видит' },
  },
  {
    id: 'loveOpenUp',
    domain: 'love',
    text: { en: 'To let someone in without bracing for it to go wrong', ru: 'Впустить кого-то, не готовясь заранее к тому, что всё пойдёт не так' },
  },
  {
    id: 'loveRepair',
    domain: 'love',
    text: { en: 'To repair something that has been quietly broken for a while', ru: 'Восстановить то, что уже давно тихо надломлено' },
  },
  {
    id: 'loveOwnCompany',
    domain: 'love',
    text: { en: 'To be genuinely at ease in my own company', ru: 'По-настоящему хорошо чувствовать себя наедине с собой' },
  },
  {
    id: 'loveHonestWords',
    domain: 'love',
    text: { en: 'To say the honest thing instead of the easy thing', ru: 'Говорить честно, а не то, что проще сказать' },
  },
  // Family
  {
    id: 'familyPresence',
    domain: 'family',
    text: { en: 'To actually be present when I am with them, not just there', ru: 'По-настоящему быть рядом, когда я с ними, а не просто присутствовать' },
  },
  {
    id: 'familyOldWound',
    domain: 'family',
    text: { en: 'To stop carrying a wound that is not mine to keep carrying', ru: 'Перестать нести рану, которая не моя, чтобы её нести' },
  },
  {
    id: 'familyOwnPath',
    domain: 'family',
    text: { en: 'To become who I am without it costing me their approval', ru: 'Стать собой, не расплачиваясь за это их одобрением' },
  },
  {
    id: 'familyMoreTime',
    domain: 'family',
    text: { en: 'More real time with the people who will not be here forever', ru: 'Больше настоящего времени с теми, кто не будет рядом всегда' },
  },
  // Body
  {
    id: 'bodyAtHome',
    domain: 'body',
    text: { en: 'To feel at home in my own body again', ru: 'Снова почувствовать себя как дома в собственном теле' },
  },
  {
    id: 'bodyRest',
    domain: 'body',
    text: { en: 'Rest that actually restores me, not just fills the time off', ru: 'Отдых, который действительно восстанавливает, а не просто заполняет свободное время' },
  },
  {
    id: 'bodyStrength',
    domain: 'body',
    text: { en: 'The strength to trust my body again after it let me down', ru: 'Силы снова довериться своему телу после того, как оно меня подвело' },
  },
  {
    id: 'bodyStopFighting',
    domain: 'body',
    text: { en: 'To stop fighting how I look and just live in it', ru: 'Перестать бороться со своей внешностью и просто жить в ней' },
  },
  // Money
  {
    id: 'moneyEnough',
    domain: 'money',
    text: { en: 'To feel like enough, without needing more to prove it', ru: 'Чувствовать, что этого достаточно, не нуждаясь в подтверждении большим' },
  },
  {
    id: 'moneySecurity',
    domain: 'money',
    text: { en: 'Enough security that I stop bracing for the next emergency', ru: 'Достаточно устойчивости, чтобы перестать готовиться к следующей беде' },
  },
  {
    id: 'moneyFreedom',
    domain: 'money',
    text: { en: 'The freedom to choose without money deciding for me', ru: 'Свобода выбирать, чтобы деньги не решали за меня' },
  },
  {
    id: 'moneyGenerosity',
    domain: 'money',
    text: { en: 'To give without quietly counting what it costs me', ru: 'Давать, не считая тайком, чего мне это стоит' },
  },
  // Leisure
  {
    id: 'leisureUnhurried',
    domain: 'leisure',
    text: { en: 'An unhurried afternoon with absolutely nowhere to be', ru: 'Неспешный день, когда абсолютно некуда спешить' },
  },
  {
    id: 'leisureOldJoy',
    domain: 'leisure',
    text: { en: 'To return to something I used to love doing, just for its own sake', ru: 'Вернуться к тому, что я когда-то любил делать просто ради самого себя' },
  },
  {
    id: 'leisureMakeThings',
    domain: 'leisure',
    text: { en: 'To make something with my hands, not just consume', ru: 'Создавать что-то своими руками, а не только потреблять' },
  },
  {
    id: 'leisureWonder',
    domain: 'leisure',
    text: { en: 'To feel genuine wonder again, the way I used to as a child', ru: 'Снова почувствовать настоящее удивление, как в детстве' },
  },
  {
    id: 'leisureSolitude',
    domain: 'leisure',
    text: { en: 'Real solitude, without it turning into loneliness', ru: 'Настоящее уединение, которое не превращается в одиночество' },
  },
];
