import { CardSymbolId } from '../components/CardSymbol';

// The Selfinder Cards deck — see docs/cards-concept.md for the full
// rationale. Each card is a statement to receive or an instruction to
// notice, never a question demanding an answer (see "Why not questions"
// in that doc). `kind` only controls the small "Receive"/"Notice" label,
// never changes how a card is drawn or routed.
export type CardKind = 'statement' | 'instruction';

export interface CardEntry {
  id: CardSymbolId;
  name: { en: string; ru: string };
  kind: CardKind;
  line: { en: string; ru: string };
  rgb: string;
}

export const CARDS_DECK: CardEntry[] = [
  {
    id: 'openSystem',
    name: { en: 'The Open System', ru: 'Открытая система' },
    kind: 'statement',
    line: {
      en: "Something you've stopped closing is still open, waiting for someone who may never come back through it.",
      ru: 'Что-то, что ты перестал закрывать, всё ещё открыто — и ждёт того, кто, возможно, никогда не вернётся.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'whatYoureCarrying',
    name: { en: "What You're Carrying", ru: 'То, что ты несёшь' },
    kind: 'instruction',
    line: {
      en: "Notice what you're carrying. Not why — just its weight, right now.",
      ru: 'Замечай, что ты несёшь. Не зачем — просто его вес, прямо сейчас.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'standingWave',
    name: { en: 'Standing Wave', ru: 'Стоячая волна' },
    kind: 'statement',
    line: {
      en: 'Something you thought you released is still moving, quietly, underneath everything else.',
      ru: 'Что-то, что ты, казалось, отпустил, всё ещё тихо движется — под всем остальным.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'interference',
    name: { en: 'Interference Pattern', ru: 'Интерференция' },
    kind: 'instruction',
    line: {
      en: "Let both voices speak at once. Don't choose. Just listen to what happens when they overlap.",
      ru: 'Позволь обоим голосам звучать одновременно. Не выбирай. Просто слушай, что происходит, когда они накладываются.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'fixedPoint',
    name: { en: 'The Fixed Point', ru: 'Неподвижная точка' },
    kind: 'statement',
    line: {
      en: 'In the middle of everything that has shifted, one thing in you has stayed exactly still.',
      ru: 'Посреди всего, что изменилось, что-то в тебе осталось совершенно неподвижным.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'incompleteResonance',
    name: { en: 'Incomplete Resonance', ru: 'Незавершённый резонанс' },
    kind: 'instruction',
    line: {
      en: 'Let this thought come back around, one more time, without trying to finish it.',
      ru: 'Дай этой мысли снова прийти. Не пытайся её закончить.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'signalBeneathNoise',
    name: { en: 'Signal Beneath Noise', ru: 'Сигнал под шумом' },
    kind: 'statement',
    line: {
      en: 'Underneath everything loud today, something quieter has been trying to be heard.',
      ru: 'Под всем громким сегодня — что-то тихое пыталось быть услышанным.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'belowThreshold',
    name: { en: 'Below the Threshold', ru: 'Ниже порога' },
    kind: 'instruction',
    line: {
      en: "Notice how close you've already come. Not whether to cross — just how close.",
      ru: 'Замечай, насколько близко ты уже подошёл. Не стоит ли переступать — просто насколько близко.',
    },
    rgb: '224,196,168',
  },

  // Cycle-phase cards — shuffled into the same deck, not a separate mode
  // or theme. Everything in life has a cycle; these six name a phase of
  // one as a possibility to check against, never a claim about where the
  // person currently stands — see CYCLE_PHASES in CardSymbol.tsx and
  // docs/cards-concept.md, "Cycle-phase cards," for why a card can never
  // assert a position the way Measure's computed reading can.
  {
    id: 'cycleBeginning',
    name: { en: 'Beginning', ru: 'Начало' },
    kind: 'statement',
    line: {
      en: "Something in you may have already started, even if nothing shows yet.",
      ru: 'Что-то в тебе, возможно, уже началось — даже если пока ничего не видно.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'cycleRising',
    name: { en: 'Rising', ru: 'Подъём' },
    kind: 'instruction',
    line: {
      en: "Notice where the momentum is building. You may already be moving before you decide to.",
      ru: 'Замечай, где нарастает движение. Возможно, ты уже в пути, ещё не решив этого.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'cyclePeak',
    name: { en: 'Peak', ru: 'Пик' },
    kind: 'instruction',
    line: {
      en: 'This might be the fullest a thing gets. Notice it, before it starts to change.',
      ru: 'Возможно, это самая полная точка. Заметь её, пока она не начала меняться.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'cycleTurning',
    name: { en: 'Turning', ru: 'Поворот' },
    kind: 'statement',
    line: {
      en: 'Something may be about to reverse direction — see if you can feel it before it does.',
      ru: 'Возможно, что-то вот-вот развернётся в другую сторону — попробуй почувствовать это заранее.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'cycleReleasing',
    name: { en: 'Releasing', ru: 'Отпускание' },
    kind: 'instruction',
    line: {
      en: "Notice what's loosening its grip on its own, without you having to let go of it.",
      ru: 'Замечай, что само ослабляет хватку — без того, чтобы ты специально это отпускал.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'cycleRest',
    name: { en: 'Rest', ru: 'Покой' },
    kind: 'instruction',
    line: {
      en: "Nothing here is asking to be done. Notice what it's like to let that be true.",
      ru: 'Здесь ничего не просит быть сделанным. Заметь, каково позволить этому быть правдой.',
    },
    rgb: '224,196,168',
  },

  // Archetype cards — six physics concepts chosen because each one is
  // ALSO a recognized archetypal motif (simple harmonic motion IS the
  // archetype of return; a phase transition IS the archetype of a
  // threshold), not archetypes illustrated with narrative imagery. See
  // CardSymbol.tsx's own comment above thresholdLayers() for the full
  // rationale, and docs/cards-concept.md's "Physics/math vocabulary" for
  // why the deck never draws a literal door, mask, or figure. Same
  // statement/instruction discipline as the rest of the deck — see "Why
  // not questions" in that doc.
  {
    id: 'threshold',
    name: { en: 'The Threshold', ru: 'Порог' },
    kind: 'statement',
    line: {
      en: 'Something in you has been standing at the exact center, not yet leaning toward either side.',
      ru: 'Что-то в тебе стоит в самой середине — ещё не склонившись ни в одну сторону.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'guardian',
    name: { en: 'The Guardian', ru: 'Страж' },
    kind: 'instruction',
    line: {
      en: "Notice what's being held inside a boundary right now, without deciding if it still needs one.",
      ru: 'Замечай, что сейчас удерживается внутри границы — не решая, нужна ли она ещё.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'hiddenRoot',
    name: { en: 'The Hidden Root', ru: 'Скрытый корень' },
    kind: 'statement',
    line: {
      en: "Something you can't see directly has been shaping the shape of what you can.",
      ru: 'Что-то, чего ты не видишь напрямую, формирует форму того, что ты видишь.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'seeker',
    name: { en: 'The Seeker', ru: 'Искатель' },
    kind: 'instruction',
    line: {
      en: "Notice the searching itself, not what it's looking for — it hasn't landed yet, and that's allowed.",
      ru: 'Замечай сам поиск, а не то, что он ищет — он ещё не завершён, и это допустимо.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'theReturn',
    name: { en: 'The Return', ru: 'Возвращение' },
    kind: 'statement',
    line: {
      en: "You're arriving back somewhere familiar, but not by the path that took you away from it.",
      ru: 'Ты возвращаешься куда-то знакомое — но не той дорогой, что увела тебя оттуда.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'union',
    name: { en: 'The Union', ru: 'Слияние' },
    kind: 'instruction',
    line: {
      en: 'Notice two things that started out of step with each other, quietly finding the same rhythm.',
      ru: 'Замечай, как две вещи, начавшие не в такт друг с другом, тихо находят общий ритм.',
    },
    rgb: '224,196,168',
  },
];

export function drawCard(): CardEntry {
  return CARDS_DECK[Math.floor(Math.random() * CARDS_DECK.length)];
}
