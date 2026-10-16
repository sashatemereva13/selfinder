import { CardSymbolId } from '../components/depths/CardSymbol';
import type { ResolvedTheme } from '../store/themeStore';

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

// Every card's rgb is one of exactly two dark-mode-tuned tones (bright
// ivory / a muted tan), chosen when the deck was only ever seen against
// the near-black dark-mode ground. In light mode the page itself is that
// same pale ivory (see docs/design/aesthetic.md's accent/text tokens), so
// drawing the symbol, name, and save-accent in the raw rgb makes them
// nearly invisible — confirmed the bright-ivory tone is a literal exact
// match against the light-mode background. Same fix as AuraFigure's
// neutralColor and colors.accent.ivory: swap to the gold tones already
// built for "the one bright accent, made legible on an ivory page,"
// rather than adding a shadow (aesthetic.md's own note on AuraFigure is
// that a glow/shadow reads as a muddy smear on ivory, not a fix).
const LIGHT_MODE_RGB: Record<string, string> = {
  '239,227,207': '180,140,60', // accent.ivory's rgb in light mode
  '224,196,168': '120,90,40', // a deeper gold, keeping the deck's two-tone contrast
};

export function cardRgbForTheme(rgb: string, theme: ResolvedTheme): string {
  return theme === 'light' ? (LIGHT_MODE_RGB[rgb] ?? rgb) : rgb;
}

export const CARDS_DECK: CardEntry[] = [
  {
    id: 'openSystem',
    name: { en: 'The Open System', ru: 'Открытая система' },
    kind: 'instruction',
    line: {
      en: 'Some doors stay open long after anyone means to come back through them. Notice if one of yours has.',
      ru: 'Некоторые двери остаются открытыми ещё долго после того, как через них собирались вернуться. Заметьте, нет ли такой у вас.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'whatYoureCarrying',
    name: { en: "What You're Carrying", ru: 'То, что ты несёшь' },
    kind: 'instruction',
    line: {
      en: "Notice what you're carrying. Not why — just its weight, right now.",
      ru: 'Заметьте, что вы несёте. Не зачем — просто его вес, прямо сейчас.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'standingWave',
    name: { en: 'Standing Wave', ru: 'Стоячая волна' },
    kind: 'instruction',
    line: {
      en: 'Notice whether something you thought was released is still moving, quietly, underneath.',
      ru: 'Заметьте, не движется ли ещё тихо, где-то внизу, то, что казалось отпущенным.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'interference',
    name: { en: 'Interference Pattern', ru: 'Интерференция' },
    kind: 'instruction',
    line: {
      en: "Let both voices speak at once. Don't choose. Just listen to what happens when they overlap.",
      ru: 'Позвольте обоим голосам звучать одновременно. Не выбирайте. Просто слушайте, что происходит, когда они накладываются.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'fixedPoint',
    name: { en: 'The Fixed Point', ru: 'Неподвижная точка' },
    kind: 'instruction',
    line: {
      en: 'In the middle of everything that shifts, notice if anything has stayed exactly still.',
      ru: 'Посреди всего, что меняется, заметьте — не осталось ли что-то совершенно неподвижным.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'incompleteResonance',
    name: { en: 'Incomplete Resonance', ru: 'Незавершённый резонанс' },
    kind: 'instruction',
    line: {
      en: 'Let this thought come back around, one more time, without trying to finish it.',
      ru: 'Дайте этой мысли снова прийти. Не пытайтесь её закончить.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'signalBeneathNoise',
    name: { en: 'Signal Beneath Noise', ru: 'Сигнал под шумом' },
    kind: 'instruction',
    line: {
      en: 'Under everything loud today, listen for anything quieter trying to be heard.',
      ru: 'Под всем громким сегодня прислушайтесь — нет ли чего-то тихого, что пытается быть услышанным.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'belowThreshold',
    name: { en: 'Below the Threshold', ru: 'Ниже порога' },
    kind: 'instruction',
    line: {
      en: 'Notice how close you are. Not whether to cross — just how close.',
      ru: 'Заметьте, насколько вы близко. Не стоит ли переступать — просто насколько близко.',
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
    kind: 'instruction',
    line: {
      en: 'Some things start long before anything shows. Notice if something has.',
      ru: 'Некоторые вещи начинаются задолго до того, как это видно. Заметьте, не началось ли что-то.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'cycleRising',
    name: { en: 'Rising', ru: 'Подъём' },
    kind: 'instruction',
    line: {
      en: 'Notice where momentum is building — sometimes we\'re moving before we\'ve decided to.',
      ru: 'Заметьте, где нарастает движение: иногда мы уже в пути, ещё не решив этого.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'cyclePeak',
    name: { en: 'Peak', ru: 'Пик' },
    kind: 'instruction',
    line: {
      en: 'This might be the fullest a thing gets. Notice it, before it starts to change.',
      ru: 'Возможно, это самая полная точка. Заметьте её, пока она не начала меняться.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'cycleTurning',
    name: { en: 'Turning', ru: 'Поворот' },
    kind: 'instruction',
    line: {
      en: 'Things often turn before we see them turn. Notice if anything feels close to reversing.',
      ru: 'Вещи часто поворачивают раньше, чем мы это видим. Заметьте, не близко ли что-то к развороту.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'cycleReleasing',
    name: { en: 'Releasing', ru: 'Отпускание' },
    kind: 'instruction',
    line: {
      en: "Notice what's loosening its grip on its own, without you having to let go of it.",
      ru: 'Заметьте, что само ослабляет хватку — без того, чтобы вам нужно было это отпускать.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'cycleRest',
    name: { en: 'Rest', ru: 'Покой' },
    kind: 'instruction',
    line: {
      en: "Nothing here is asking to be done. Notice what it's like to let that be true.",
      ru: 'Здесь ничего не просит быть сделанным. Заметьте, каково позволить этому быть правдой.',
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
    kind: 'instruction',
    line: {
      en: 'Notice if anything is standing at the exact centre, not yet leaning either way.',
      ru: 'Заметьте, нет ли чего-то, что стоит в самой середине, ещё не склонившись ни в одну сторону.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'guardian',
    name: { en: 'The Guardian', ru: 'Страж' },
    kind: 'instruction',
    line: {
      en: "Notice what's being held inside a boundary right now, without deciding if it still needs one.",
      ru: 'Заметьте, что сейчас удерживается внутри границы, — не решая, нужна ли она ещё.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'hiddenRoot',
    name: { en: 'The Hidden Root', ru: 'Скрытый корень' },
    kind: 'instruction',
    line: {
      en: 'What can\'t be seen directly often shapes what can. Notice where that might be true today.',
      ru: 'То, чего не видно напрямую, часто формирует то, что видно. Заметьте, где это может быть так сегодня.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'seeker',
    name: { en: 'The Seeker', ru: 'Искатель' },
    kind: 'instruction',
    line: {
      en: 'Notice the searching itself, not what it\'s looking for.',
      ru: 'Заметьте сам поиск, а не то, что он ищет.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'theReturn',
    name: { en: 'The Return', ru: 'Возвращение' },
    kind: 'instruction',
    line: {
      en: 'Coming back somewhere familiar by a different path changes the place. Notice if you\'re returning anywhere.',
      ru: 'Если вернуться в знакомое место другой дорогой, оно меняется. Заметьте, не возвращаетесь ли вы куда-то.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'union',
    name: { en: 'The Union', ru: 'Слияние' },
    kind: 'instruction',
    line: {
      en: 'Notice two things that started out of step with each other, quietly finding the same rhythm.',
      ru: 'Заметьте, как две вещи, начавшие не в такт, тихо находят общий ритм.',
    },
    rgb: '224,196,168',
  },

  // Second archetype set — six more physics concepts, sourced from six
  // Major Arcana THEMES with no existing equivalent in the deck (see
  // docs/cards-concept.md, "Second archetype set (tarot-sourced)" for the
  // full rationale and the boundary respected: the underlying human
  // situation each theme names is kept; the card art, divinatory
  // apparatus, and tarot's own vocabulary are not — no towers, devils,
  // suns, or lovers anywhere in this file or CardSymbol.tsx).
  {
    id: 'theFold',
    name: { en: 'The Fold', ru: 'Складка' },
    kind: 'instruction',
    line: {
      en: 'Some things stand only because nothing has nudged them yet. Notice if anything is like that.',
      ru: 'Некоторые вещи держатся только потому, что их ещё никто не толкнул. Заметьте, нет ли такого.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'smallerDoor',
    name: { en: 'The Smaller Door', ru: 'Дверь поменьше' },
    kind: 'instruction',
    line: {
      en: "Notice where the wall is actually thinner than you've been treating it.",
      ru: 'Заметьте, где стена на самом деле тоньше, чем казалось.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'settledAmplitude',
    name: { en: 'The Settled Amplitude', ru: 'Устоявшаяся амплитуда' },
    kind: 'instruction',
    line: {
      en: 'What\'s left once the rest quiets down isn\'t nothing. Notice what\'s left.',
      ru: 'То, что остаётся, когда всё остальное затихло, — не пустота. Заметьте, что осталось.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'broadcastingField',
    name: { en: 'The Broadcasting Field', ru: 'Излучающее поле' },
    kind: 'instruction',
    line: {
      en: 'Notice anything that\'s clear right now, whether or not anyone else can see it.',
      ru: 'Заметьте то, что сейчас ясно, — видит это кто-то ещё или нет.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'theSplit',
    name: { en: 'The Split', ru: 'Развилка' },
    kind: 'instruction',
    line: {
      en: 'When a path becomes two, not choosing yet is also a place to stand. Notice if you\'re there.',
      ru: 'Когда путь раздваивается, ещё не выбирать — тоже место, где можно стоять. Заметьте, не там ли вы.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'heldCourse',
    name: { en: 'Held Course', ru: 'Удержанный курс' },
    kind: 'instruction',
    line: {
      en: "Notice what you're quietly correcting for, moment to moment, to keep this steady.",
      ru: 'Заметьте, что вы тихо выравниваете, момент за моментом, чтобы удержать это ровно.',
    },
    rgb: '224,196,168',
  },

  // Sphere-intensity cards — twelve cards, three per Body/Mind/Heart/
  // Spirit, each sphere's own three showing the SAME physical picture at
  // increasing amplitude/drive (see docs/cards-concept.md, "Sphere-
  // intensity cards" for the full rationale: this borrows the one
  // reusable idea from tarot's Minor Arcana — a numbered progression
  // within one domain — without importing its four elemental suits,
  // which would duplicate Selfinder's own Body/Mind/Heart/Spirit
  // language rather than sit alongside it). None of the three stages per
  // sphere claims the person is currently AT that stage — same
  // "possibility to check against" framing the cycle-phase cards already
  // use for a different axis (cyclical position, not amplitude).
  {
    id: 'bodyLoadLow',
    name: { en: 'Body — Quiet Load', ru: 'Тело — тихий груз' },
    kind: 'instruction',
    line: {
      en: 'Notice any small weight your body is holding that it hasn\'t mentioned.',
      ru: 'Заметьте небольшой груз, который ваше тело держит, не говоря о нём.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'bodyLoadMid',
    name: { en: 'Body — Full Load', ru: 'Тело — полная нагрузка' },
    kind: 'instruction',
    line: {
      en: 'Notice how much your body is carrying, and whether you\'d noticed the carrying.',
      ru: 'Заметьте, сколько несёт ваше тело — и замечали ли вы, что оно несёт.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'bodyLoadHigh',
    name: { en: 'Body — Past Capacity', ru: 'Тело — сверх предела' },
    kind: 'instruction',
    line: {
      en: 'Notice if anywhere your body is holding more than its own shape.',
      ru: 'Заметьте, не держит ли тело где-то больше, чем позволяет его форма.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'mindDriveLow',
    name: { en: 'Mind — Single Note', ru: 'Разум — одна нота' },
    kind: 'instruction',
    line: {
      en: 'Listen for one clear thought running underneath everything else, quiet enough to miss.',
      ru: 'Прислушайтесь — нет ли одной ясной мысли под всем остальным, достаточно тихой, чтобы её пропустить.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'mindDriveMid',
    name: { en: 'Mind — Full Register', ru: 'Разум — полный диапазон' },
    kind: 'instruction',
    line: {
      en: 'A thought can find its full volume without shouting. Notice if one has.',
      ru: 'Мысль может обрести полную громкость, не повышая голоса. Заметьте, не произошло ли этого.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'mindDriveHigh',
    name: { en: 'Mind — Clipped Peak', ru: 'Разум — срезанный пик' },
    kind: 'instruction',
    line: {
      en: 'Notice if any thought has been pushed past the point where it still sounds like itself.',
      ru: 'Заметьте, не подтолкнули ли какую-то мысль дальше той точки, где она ещё звучала как она сама.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'heartCouplingLow',
    name: { en: 'Heart — Loose Coupling', ru: 'Сердце — слабая связь' },
    kind: 'instruction',
    line: {
      en: 'Notice whether something in you is responding to someone else, more than either of you has said.',
      ru: 'Заметьте, не отзывается ли в вас что-то на другого человека — больше, чем вы оба сказали вслух.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'heartCouplingMid',
    name: { en: 'Heart — Locked Step', ru: 'Сердце — в такт' },
    kind: 'instruction',
    line: {
      en: 'Two things that moved separately can begin to move as one, without anyone noticing when. Notice if anything has.',
      ru: 'Две вещи, двигавшиеся порознь, могут начать двигаться как одна — незаметно. Заметьте, не произошло ли этого.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'heartCouplingHigh',
    name: { en: 'Heart — Overcoupled', ru: 'Сердце — перевязано' },
    kind: 'instruction',
    line: {
      en: 'Notice whether staying in step with someone has cost you any of your own motion.',
      ru: 'Заметьте, не стоило ли вам то, что вы держите шаг с другим, части вашего собственного движения.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'spiritFieldLow',
    name: { en: 'Spirit — Faint Field', ru: 'Дух — слабое поле' },
    kind: 'instruction',
    line: {
      en: 'Notice anything quietly present in the background, not yet asking to be named.',
      ru: 'Заметьте то, что тихо присутствует на фоне и пока не просит, чтобы его назвали.',
    },
    rgb: '224,196,168',
  },
  {
    id: 'spiritFieldMid',
    name: { en: 'Spirit — Even Field', ru: 'Дух — ровное поле' },
    kind: 'instruction',
    line: {
      en: 'Notice anything that isn\'t concentrated anywhere — just evenly everywhere at once.',
      ru: 'Заметьте то, что нигде не сгущено, — просто есть везде и сразу, ровно.',
    },
    rgb: '239,227,207',
  },
  {
    id: 'spiritFieldHigh',
    name: { en: 'Spirit — Saturated Field', ru: 'Дух — насыщенное поле' },
    kind: 'instruction',
    line: {
      en: "Notice what happens when there's no longer any empty space left to feel this arrive into.",
      ru: 'Заметьте, что происходит, когда не остаётся пустого места, куда это могло бы прийти.',
    },
    rgb: '224,196,168',
  },
];

export function drawCard(): CardEntry {
  return CARDS_DECK[Math.floor(Math.random() * CARDS_DECK.length)];
}
