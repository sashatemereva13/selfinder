// Ported from selfinder-web/frontend/src/levels/levelsContent.js — keep the two
// in sync by hand, there's no shared package between the web and Expo bundlers.
// Each entry pairs the listing metadata (name/slug/score) with structured
// content: short "signals" (label/value facts already embedded in the source
// material) and "sections" (headed groups of paragraphs) so the page reads in
// digestible chunks instead of one unbroken wall of prose.
import { Locale } from '../store/localeStore';

export interface LevelSection {
  heading: string;
  paragraphs: string[];
}

export interface LevelSignal {
  label: string;
  value: string;
}

// Only the reader-facing prose is translatable — slug/score/name (the
// stable key used elsewhere, e.g. LEVEL_COLORS) stay fixed across locales,
// same split as PhilosopherTranslation in philosophers.ts.
export interface LevelTranslation {
  title: string;
  frame: string;
  personalFrame?: string;
  signals?: LevelSignal[];
  paragraphs?: string[];
  sections?: LevelSection[];
  deepDive?: LevelSection[];
}

export interface LevelContent {
  slug: string;
  name: string;
  title: string;
  score: number;
  frame: string;
  // Second-person rephrasing of `frame`, for surfaces that reference the
  // reader's own current reading (e.g. the Depths home screen) — `frame`
  // itself stays third-person/definitional, correct for the Level page
  // where it's describing a concept rather than addressing the reader.
  personalFrame?: string;
  signals?: LevelSignal[];
  paragraphs?: string[];
  sections?: LevelSection[];
  // The original long-form essay content — kept, but demoted to a collapsed
  // "Going deeper" block so the main read stays short: feel it, what it's
  // for, what to do now, what happens if it stays stuck.
  deepDive?: LevelSection[];
  translations?: { ru?: LevelTranslation };
}

export const LEVELS: LevelContent[] = [
  {
    slug: "enlightenment",
    name: "enlightenment",
    title: "Enlightenment",
    score: 700,
    frame: `Not an achievement to chase — it is what's left when nothing is being defended.`,
    personalFrame: `You're not chasing an achievement right now — this is just what's left when nothing needs defending.`,
    signals: [
      { label: "Feels like", value: "no gap between what's happening and the awareness of it — nothing left outside to resist." },
      { label: "Personality", value: "undefended, rarely reactive, doesn't need to be seen a certain way." },
      { label: "Used in society", value: "recognized more often in retrospect, or in teachers and mystics, than claimed by anyone in the moment." },
      { label: "Prone to", value: "being mistaken for detachment by people expecting a reaction that isn't coming." },
    ],
    sections: [
      {
        heading: "What this feels like",
        paragraphs: [
          `No separation between what's happening and the awareness of it happening. There's no longer a "me" standing back from experience to approve of it or resist it — whatever's here is simply met, completely. It rarely announces itself as a feeling; it's usually recognized afterward, or by someone else, more than experienced as an event.`,
        ],
      },
      {
        heading: "What it's for",
        paragraphs: [
          `Eckhart Tolle's account of his own collapse at 29 is the most exact record we have of this: not a slow accumulation of enough goodness, but a night when the thought "I cannot live with myself any longer" made him realise there were two of him — the self doing the living, and the self that couldn't live with it. When that self stopped being defended, what remained wasn't emptiness. It was this.`,
          `Nisargadatta Maharaj put the same thing more plainly: "You need not get at it, for you are it. It will get at you, if you give it a chance." Which means the actual work at this level isn't more effort. It's fewer walls.`,
        ],
      },
      {
        heading: "Try this now",
        paragraphs: [
          `There's no technique that produces this on demand — that's part of what it is. The smaller, actual move: stop defending whatever you're currently defending, just for a minute, and notice what's still there once you do.`,
        ],
      },
      {
        heading: "Where people get it wrong",
        paragraphs: [
          `The real risk at this level isn't avoiding it — it's performing it. Mistaking the idea of enlightenment for the thing itself builds a subtler, harder-to-spot ego around "being the one who's arrived," which is exactly the kind of defending this state is supposed to be free of.`,
        ],
      },
    ],
    deepDive: [
      {
        heading: "About this section",
        paragraphs: [
          `The rest of this deeper read follows David R. Hawkins' own account of this state from his book *Power vs. Force* — his framework and his language, not independently verified science. See "Where this comes from" for more on his methodology and its limits.`,
        ],
      },
      {
        heading: "The traditional description",
        paragraphs: [
          `Illumination, self-realisation, and enlightenment denote the Divine states that have historically demonstrated the highest levels of consciousness. These conditions represent the transcendence of the limitations and constraints of the ego's linearity, and the emergence of the radiance of the infinite reality and source of existence.`,
        ],
      },
    ],
    translations: {
      ru: {
        title: "Просветление",
        frame: `Не достижение, к которому стремятся, — а то, что остаётся, когда защищать больше нечего.`,
        personalFrame: `Сейчас вы не гонитесь за достижением — это просто то, что остаётся, когда защищать больше нечего.`,
        signals: [
          { label: "Ощущается как", value: "отсутствие разрыва между происходящим и осознанием этого — не осталось ничего внешнего, чему нужно сопротивляться." },
          { label: "Личность", value: "незащищающаяся, редко реагирует остро, не нуждается в том, чтобы её видели определённым образом." },
          { label: "Проявление в обществе", value: "чаще узнаётся задним числом, или в учителях и мистиках, чем провозглашается кем-то в моменте." },
          { label: "Уязвимо к", value: "тому, что его принимают за отстранённость люди, ожидающие реакции, которой не будет." },
        ],
        sections: [
          {
            heading: "Каково это на ощупь",
            paragraphs: [
              `Нет разделения между происходящим и осознанием того, что оно происходит. Больше нет «меня», отстранённо наблюдающего за опытом, чтобы одобрить его или сопротивляться ему, — что бы ни было здесь, оно просто встречается, полностью. Это редко заявляет о себе как чувство; обычно это узнаётся задним числом, или кем-то другим, а не переживается как событие.`,
            ],
          },
          {
            heading: "Для чего это",
            paragraphs: [
              `Рассказ Экхарта Толле о собственном крахе в 29 лет — самое точное свидетельство, какое у нас есть: не медленное накопление достаточной доброты, а ночь, когда мысль «я не могу больше жить с собой» заставила его понять, что их двое — тот, кто живёт, и тот, кто не может с этим жить. Когда этого второго перестали защищать, осталась не пустота. Осталось вот это.`,
              `Нисаргадатта Махарадж сказал то же самое проще: «Тебе не нужно достигать этого, ибо ты уже есть это. Оно достигнет тебя, если ты дашь ему шанс». А значит, настоящая работа на этом уровне — не больше усилий. Меньше стен.`,
            ],
          },
          {
            heading: "Попробуйте прямо сейчас",
            paragraphs: [
              `Нет техники, которая вызывает это по требованию — в этом отчасти и суть. Меньший, реальный шаг: перестаньте защищать то, что вы сейчас защищаете, хотя бы на минуту, и заметьте, что всё ещё остаётся, когда вы это сделаете.`,
            ],
          },
          {
            heading: "В чём люди ошибаются",
            paragraphs: [
              `Настоящий риск на этом уровне — не избегать его, а разыгрывать его. Принять идею просветления за само просветление — значит выстроить более тонкое, труднее уловимое эго вокруг «того, кто уже пришёл», а это ровно то защищание, от которого это состояние должно быть свободно.`,
            ],
          },
        ],
        deepDive: [
          {
            heading: "Об этом разделе",
            paragraphs: [
              `Остальная часть этого более глубокого материала следует собственному описанию этого состояния Дэвидом Р. Хокинсом из его книги *Сила против насилия* — это его система и его язык, а не независимо подтверждённая наука. Подробнее о его методологии и её ограничениях — в разделе «Откуда это взято».`,
            ],
          },
          {
            heading: "Традиционное описание",
            paragraphs: [
              `Озарение, самопознание и просветление обозначают Божественные состояния, исторически проявлявшие наивысшие уровни сознания. Эти состояния представляют собой преодоление ограничений и рамок линейности эго и появление сияния бесконечной реальности и источника бытия.`,
            ],
          },
        ],
      },
    },
  },
  {
    slug: "peace",
    name: "peace",
    title: "Peace, Bliss and Illumination",
    score: 600,
    frame: `Stillness here is not the absence of feeling — it is feeling with nothing left to resist.`,
    personalFrame: `This stillness isn't the absence of feeling — it's you feeling everything with nothing left to resist.`,
    signals: [
      { label: "Feels like", value: "spacious and unhurried — nothing urgent left to resolve." },
      { label: "Personality", value: "rarely reactive, comfortable with silence, hard to provoke." },
      { label: "Used in society", value: "the quality people mean when they say someone is calming to be around." },
      { label: "Prone to", value: "being confused with numbness by people who equate peace with not caring." },
    ],
    sections: [
      {
        heading: "What this feels like",
        paragraphs: [
          `A kind of spaciousness where nothing needs fixing right now — not because every problem is solved, but because the need for it to be solved has quieted. Time stops pressing the way it usually does.`,
        ],
      },
      {
        heading: "What it's for",
        paragraphs: [
          `Thich Nhat Hanh spent a life insisting peace was never somewhere else: "Peace is present right here and now, in ourselves and in everything we do and see. We need only to be awake." Not a state you arrive at once every conflict is resolved — most conflicts never fully resolve.`,
          `Eckhart Tolle names the actual mechanic: "Forgive yourself for not being at peace. The moment you completely accept your non-peace, your non-peace becomes transmuted into peace." The path here runs directly through the thing that looks like its opposite, not around it.`,
        ],
      },
      {
        heading: "Try this now",
        paragraphs: [
          `Stop trying to reach peace by solving whatever's bothering you first. Sit with the discomfort exactly as it is, without editing it, for a few minutes — per Tolle, that's the actual door in, not a reward for finding the door.`,
        ],
      },
      {
        heading: "Where people get it wrong",
        paragraphs: [
          `Peace performed for an audience isn't peace — it's a calm face over an unresolved feeling, which tends to leak out sideways later. The real version doesn't need anyone to notice it.`,
        ],
      },
    ],
    deepDive: [
      {
        heading: "About this section",
        paragraphs: [
          `The rest of this deeper read follows David R. Hawkins' own account of this state from his book *Power vs. Force* — his framework and his language, not independently verified science. See "Where this comes from" for more on his methodology and its limits.`,
        ],
      },
      {
        heading: "The traditional description",
        paragraphs: [
          `This energy field is associated with the experience of God-consciousness. The distinction between the subject and object disappears, and there is no specific focal point of perception.`,
          `Action at the level of 600 and above is perceived as occurring in slow motion, suspended in time and space. All is alive, radiant, and continuously flowing—unfolding in an exquisitely coordinated evolutionary dance in which significance and source are overwhelming. This revelation takes place without thought or conception, so that there is an infinite silence in the mind, which has stopped conceptualising.`,
          `That which is witnessing and that which is witnessed are the same identity. The observer dissolves and becomes the observation.`,
          `Great works of art, music, and architecture that calibrate between 600 and 700 can transport us temporarily to higher levels of consciousness and are universally recognised as inspirational and timeless.`,
          `In the stillness, all occurs of its own accord—autonomously and spontaneously. Sound has no effect on the silence that persists even within the sound.`,
        ],
      },
      {
        heading: "Already complete, not improving",
        paragraphs: [
          `Creation is witnessed as the unfolding and revelation of the emergence of infinite potentiality as creation. Thus, there is no duality of a "this" (creator) creating a "that" (creation), for creator and creation are one and the same.`,
          `Everything that exists is perfect and complete. Creation doesn't move from imperfection to perfection, as is witnessed by the ego, but instead moves from perfection to perfection. The illusion of moving from imperfection to perfection is a mentalisation.`,
          `A rosebud is not an imperfect rose but a perfect rosebud. When half open, it is a perfect unfolding flower, and when completely opened, it is a perfect open flower. As it fades, it is a perfect faded flower and then becomes a perfect withered plant, which then becomes perfectly dormant. Each is therefore perfect at each expansion of its expression, as the emergence and unfoldment of the evolution of creation.`,
          `The illusion of "change" is replaced by the witnessing of the process of the manifestation of actuality from potentiality.`,
        ],
      },
      {
        heading: "Beyond the personal self",
        paragraphs: [
          `Whether the body continues on and survives or not is uninteresting and actually without meaning. It is a matter of no importance and up to the Universe to direct. If the karmic propensities are aligned with physical continuation, the body survives. If not, the body is simply abandoned, for it came from the earth and returns to the earth when it has served the purpose of the spirit.`,
          `Equal to everything else, the body is also autonomous and moves about on its own. At the level of the 600s, there is no volitional causal locus—such as a personal self, a "me," or an "I"—that is imagined to be a causal agent or a "decider" of action.`,
        ],
      },
    ],
    translations: {
      ru: {
        title: "Покой, Блаженство и Озарение",
        frame: `Здешняя тишина — не отсутствие чувств, а чувствование без остатка, которому больше нечему сопротивляться.`,
        personalFrame: `Эта тишина — не отсутствие чувств: вы чувствуете всё, и сопротивляться больше нечему.`,
        signals: [
          { label: "Ощущается как", value: "просторно и неспешно — не осталось ничего срочного, что нужно разрешить." },
          { label: "Личность", value: "редко реагирует остро, комфортно чувствует себя в тишине, трудно спровоцировать." },
          { label: "Проявление в обществе", value: "качество, которое имеют в виду, когда говорят, что рядом с кем-то спокойно." },
          { label: "Уязвимо к", value: "тому, что его путают с онемением люди, для которых покой равен безразличию." },
        ],
        sections: [
          {
            heading: "Каково это на ощупь",
            paragraphs: [
              `Своего рода простор, в котором прямо сейчас ничего не нужно чинить — не потому, что все проблемы решены, а потому, что потребность их решить утихла. Время перестаёт давить так, как обычно.`,
            ],
          },
          {
            heading: "Для чего это",
            paragraphs: [
              `Тит Нат Хан всю жизнь настаивал, что покой никогда не находится где-то в другом месте: «Покой присутствует прямо здесь и сейчас, в нас самих и во всём, что мы делаем и видим. Нужно лишь проснуться». Это не состояние, к которому приходят, когда разрешён каждый конфликт, — большинство конфликтов не разрешаются полностью никогда.`,
              `Экхарт Толле называет сам механизм прямо: «Прости себя за то, что ты не в покое. В момент, когда ты полностью принимаешь своё не-покойствие, оно превращается в покой». Путь сюда проходит прямо через то, что выглядит его противоположностью, а не в обход неё.`,
            ],
          },
          {
            heading: "Попробуйте прямо сейчас",
            paragraphs: [
              `Перестаньте пытаться прийти к покою, сначала решив то, что вас беспокоит. Побудьте с дискомфортом ровно таким, какой он есть, ничего не редактируя, несколько минут — по Толле, это и есть настоящая дверь внутрь, а не награда за то, что дверь нашли.`,
            ],
          },
          {
            heading: "В чём люди ошибаются",
            paragraphs: [
              `Покой, разыгранный на публику, — не покой, а спокойное лицо поверх нерешённого чувства, которое позже обычно просачивается наружу сбоку. Настоящий не нуждается в том, чтобы кто-то его заметил.`,
            ],
          },
        ],
        deepDive: [
          {
            heading: "Об этом разделе",
            paragraphs: [
              `Остальная часть этого более глубокого материала следует собственному описанию этого состояния Дэвидом Р. Хокинсом из его книги *Сила против насилия* — это его система и его язык, а не независимо подтверждённая наука. Подробнее о его методологии и её ограничениях — в разделе «Откуда это взято».`,
            ],
          },
          {
            heading: "Традиционное описание",
            paragraphs: [
              `Это энергетическое поле связано с переживанием богосознания. Различие между субъектом и объектом исчезает, и не остаётся конкретной точки фокуса восприятия.`,
              `Действие на уровне 600 и выше воспринимается как происходящее в замедленном движении, подвешенное во времени и пространстве. Всё живо, лучезарно и непрерывно течёт — разворачиваясь в изысканно согласованном эволюционном танце, в котором значение и источник ошеломляют. Это откровение происходит без мысли или понятия, так что в уме воцаряется бесконечная тишина, переставшая формировать понятия.`,
              `То, что свидетельствует, и то, чему свидетельствуют, — одна и та же личность. Наблюдатель растворяется и становится наблюдением.`,
              `Великие произведения искусства, музыки и архитектуры, откалиброванные между 600 и 700, способны временно перенести нас на более высокие уровни сознания и повсеместно признаются вдохновляющими и вневременными.`,
              `В тишине всё происходит само по себе — автономно и спонтанно. Звук не влияет на тишину, которая сохраняется даже внутри самого звука.`,
            ],
          },
          {
            heading: "Уже завершено, а не совершенствуется",
            paragraphs: [
              `Творение видится как разворачивание и раскрытие возникновения бесконечной потенциальности как творения. Таким образом, нет двойственности «этого» (творца), создающего «то» (творение), ибо творец и творение — одно и то же.`,
              `Всё существующее совершенно и полно. Творение движется не от несовершенства к совершенству, как это видит эго, а от совершенства к совершенству. Иллюзия движения от несовершенства к совершенству — это ментализация.`,
              `Бутон розы — не несовершенная роза, а совершенный бутон розы. Наполовину раскрывшись, это совершенный раскрывающийся цветок, а полностью раскрывшись — совершенный раскрытый цветок. Увядая, это совершенный увядший цветок, а затем совершенное засохшее растение, которое затем совершенно покоится. Таким образом, каждая стадия совершенна на каждом этапе своего выражения, как проявление и разворачивание эволюции творения.`,
              `Иллюзия «изменения» сменяется свидетельствованием процесса проявления действительности из потенциальности.`,
            ],
          },
          {
            heading: "За пределами личного «я»",
            paragraphs: [
              `Продолжит ли тело существовать и выживать или нет — неинтересно и по сути лишено смысла. Это вопрос, не имеющий значения, и решать его — дело Вселенной. Если кармические предрасположенности согласуются с продолжением физического существования, тело выживает. Если нет, тело просто оставляется, ведь оно пришло из земли и возвращается в землю, когда послужило цели духа.`,
              `Наравне со всем остальным, тело тоже автономно и движется само по себе. На уровне 600-х нет волевого причинного центра — такого как личное «я», «меня» или «я», — который мнился бы причинным агентом или «принимающим решения» действия.`,
            ],
          },
        ],
      },
    },
  },
  {
    slug: "unconditionallove",
    name: "unconditional love",
    title: "Unconditional Love, Joy, Ecstasy",
    score: 540,
    frame: `Not a feat of willpower — what's left once love no longer needs a condition to stand on.`,
    personalFrame: `This isn't willpower — it's what's left now that your love doesn't need a condition to stand on.`,
    signals: [
      { label: "Feels like", value: "warmth that isn't waiting for anything back." },
      { label: "Personality", value: "patient, steady, unusually hard to offend or discourage." },
      { label: "Used in society", value: "what people mean by \"unconditional\" support — a parent, a mentor, a devoted caregiver." },
      { label: "Prone to", value: "being taken advantage of by people who mistake it for having no boundaries at all." },
    ],
    sections: [
      {
        heading: "What this feels like",
        paragraphs: [
          `A warmth that doesn't check whether it's being returned. It shows up as patience that doesn't run out, and a kind of attention that doesn't ask anything of the person receiving it.`,
        ],
      },
      {
        heading: "What it's for",
        paragraphs: [
          `Mother Teresa: "It is not the magnitude of our actions, but the amount of love that is put into them that matters." The difference between this and ordinary love isn't scale. It's that it stops being about the size of the gesture and starts being about the quality of attention behind it.`,
          `The Dalai Lama draws the same line differently: he separates love that depends on what someone gives you back from a caring that holds regardless of the relationship. One needs the other person to keep being useful to you. The other doesn't.`,
        ],
      },
      {
        heading: "Try this now",
        paragraphs: [
          `Pick one relationship where you're keeping score, even quietly, and do one thing in it today without expecting it noticed or repaid. Not a grand gesture — the point is the absence of the tally, not the size of the act.`,
        ],
      },
      {
        heading: "Where people get it wrong",
        paragraphs: [
          `Unconditional doesn't mean unlimited — it's not the same as having no boundaries or absorbing harm indefinitely. Mother Teresa's love had structure and discipline behind it. Without that, what looks like unconditional love is often just self-erasure.`,
        ],
      },
    ],
    deepDive: [
      {
        heading: "About this section",
        paragraphs: [
          `The rest of this deeper read follows David R. Hawkins' own account of this state from his book *Power vs. Force* — his framework and his language, not independently verified science. See "Where this comes from" for more on his methodology and its limits.`,
        ],
      },
      {
        heading: "The shape of this joy",
        paragraphs: [
          `As love becomes increasingly unconditional, it begins to be experienced as inner joy. This is not the sudden joy of a pleasurable turn of events, but instead a constant accompaniment to all activities.`,
          `Joy arises from within each moment of existence rather than from any outer source. It is also the level of healing.`,
          `Characteristic of this energy field is a capacity for enormous patience and the persistence of a positive attitude in the face of prolonged adversity. The hallmark of this state is compassion. People who have attained this level have a notable effect on others.`,
          `The world one sees is illuminated by the exquisite beauty and perfection of creation. Everything happens effortlessly by synchronicity, and one sees the world and everything in it as an expression of Love and Divinity.`,
        ],
      },
      {
        heading: "When the sense of a separate doer dissolves",
        paragraphs: [
          `Individual will merges into Divine will. One feels the power of the Presence that facilitates phenomena outside conventional expectations of reality—termed "miraculous" by the ordinary observer. These phenomena represent the power of the energy field, not of the individual. In other words, the energy field is the soul—a part of the Divine—that makes everything happen, not the particular individual in a human physical form. The soul is all-powerful because it is a part of God.`,
          `The emergence of progressively higher levels of consciousness requires periods of adjustment, much like adapting to a new pair of glasses. In this process, worldly function may be impaired periodically due to shifts in orientation. Phenomena are discovered to be happening spontaneously, rather than through the presumed linear principle of cause and effect.`,
          `It is also progressively discovered that there is no "doer" of actions, and one witnesses the autonomous unfoldment of karmic potentiality from a new paradigm of reality—one that transcends the presumptive dualistic principle of causation. Thus, life becomes an endless series of revelations of intrinsic charm and delight that initially seem miraculous. Then comes the realisation that what appears miraculous is simply the constant unfolding of the potentiality of Creation, by which the subjective experience of time dissolves.`,
        ],
      },
      {
        heading: "Time loosens its grip",
        paragraphs: [
          `Likewise, the perception of "change" is replaced by the progressive emergence of the ongoingness of Creation as the fulfillment of potentiality actualising into manifestation.`,
          `With neither past nor future, there is also no "now"—and it is comprehended that past, present, and future are all illusory contextualisations resulting from the limitations of a linear paradigm.`,
          `The shift forward merely requires the surrendering of all belief systems, and the understanding that all fear is illusion. Nothing is actually the way the ego has perceived it, for the linear dimension is merely presumptive. The nonlinear absolute is a very different paradigm, one that operates on entirely different principles—principles that are self-revealing rather than based on sequential understanding or comprehension.`,
        ],
      },
    ],
    translations: {
      ru: {
        title: "Безусловная любовь, Радость, Экстаз",
        frame: `Не подвиг силы воли — а то, что остаётся, когда любви больше не нужно условие, на которое можно опереться.`,
        personalFrame: `Это не сила воли — это то, что остаётся теперь, когда вашей любви не нужно условие, на которое можно опереться.`,
        signals: [
          { label: "Ощущается как", value: "тепло, которое не ждёт ничего взамен." },
          { label: "Личность", value: "терпеливая, устойчивая, необычно трудно обидеть или обескуражить." },
          { label: "Проявление в обществе", value: "то, что люди называют «безусловной» поддержкой — родитель, наставник, преданный опекун." },
          { label: "Уязвимо к", value: "тому, что этим пользуются люди, принимающие это за полное отсутствие границ." },
        ],
        sections: [
          {
            heading: "Каково это на ощупь",
            paragraphs: [
              `Тепло, которое не проверяет, возвращают ли его. Оно проявляется как терпение, которое не иссякает, и как внимание, которое ничего не требует от того, кто его получает.`,
            ],
          },
          {
            heading: "Для чего это",
            paragraphs: [
              `Мать Тереза: «Важна не величина наших поступков, а то, сколько любви в них вложено». Разница между этим и обычной любовью не в масштабе. Дело в том, что она перестаёт быть про размер жеста и становится про качество внимания за ним.`,
              `Далай-лама проводит ту же черту иначе: он отделяет любовь, зависящую от того, что тебе дают взамен, от заботы, сохраняющейся независимо от отношений. Одной нужно, чтобы другой человек оставался тебе полезен. Другой — нет.`,
            ],
          },
          {
            heading: "Попробуйте прямо сейчас",
            paragraphs: [
              `Выберите одни отношения, в которых вы ведёте счёт, пусть даже тихо, и сделайте сегодня в них что-то одно, не ожидая, что это заметят или отплатят тем же. Не грандиозный жест — суть в отсутствии подсчёта, а не в размере поступка.`,
            ],
          },
          {
            heading: "В чём люди ошибаются",
            paragraphs: [
              `Безусловная не значит безграничная — это не то же самое, что отсутствие границ или бесконечное поглощение вреда. За любовью Матери Терезы стояли структура и дисциплина. Без этого то, что выглядит как безусловная любовь, часто оказывается просто самостиранием.`,
            ],
          },
        ],
        deepDive: [
          {
            heading: "Об этом разделе",
            paragraphs: [
              `Остальная часть этого более глубокого материала следует собственному описанию этого состояния Дэвидом Р. Хокинсом из его книги *Сила против насилия* — это его система и его язык, а не независимо подтверждённая наука. Подробнее о его методологии и её ограничениях — в разделе «Откуда это взято».`,
            ],
          },
          {
            heading: "Форма этой радости",
            paragraphs: [
              `По мере того как любовь становится всё более безусловной, она начинает переживаться как внутренняя радость. Это не внезапная радость от приятного поворота событий, а постоянное сопровождение всякой деятельности.`,
              `Радость возникает изнутри каждого момента существования, а не из какого-либо внешнего источника. Это также уровень исцеления.`,
              `Для этого энергетического поля характерна огромная способность к терпению и устойчивость позитивного отношения перед лицом затяжных невзгод. Отличительный признак этого состояния — сострадание. Люди, достигшие этого уровня, заметно влияют на других.`,
              `Мир, который видит такой человек, озарён изысканной красотой и совершенством творения. Всё происходит без усилий, посредством синхроничности, и мир и всё в нём видится как выражение Любви и Божественности.`,
            ],
          },
          {
            heading: "Когда растворяется ощущение отдельного деятеля",
            paragraphs: [
              `Индивидуальная воля сливается с Божественной волей. Чувствуется сила Присутствия, порождающая явления за пределами привычных ожиданий реальности — обычный наблюдатель называет их «чудесными». Эти явления представляют собой силу энергетического поля, а не отдельной личности. Иными словами, энергетическое поле — это душа, часть Божественного, — которая заставляет всё происходить, а не конкретный человек в человеческом физическом облике. Душа всемогуща, потому что она часть Бога.`,
              `Появление всё более высоких уровней сознания требует периодов приспособления, во многом как привыкание к новым очкам. В этом процессе мирское функционирование может временами нарушаться из-за сдвигов ориентации. Обнаруживается, что явления происходят спонтанно, а не через предполагаемый линейный принцип причины и следствия.`,
              `Также постепенно обнаруживается, что нет «деятеля» действий, и человек становится свидетелем автономного разворачивания кармической потенциальности из новой парадигмы реальности — той, что выходит за пределы предполагаемого дуалистического принципа причинности. Таким образом, жизнь превращается в бесконечную череду откровений внутреннего очарования и восторга, которые поначалу кажутся чудесными. Затем приходит осознание, что то, что кажется чудесным, — это просто постоянное разворачивание потенциальности Творения, вследствие чего субъективное переживание времени растворяется.`,
            ],
          },
          {
            heading: "Время ослабляет хватку",
            paragraphs: [
              `Точно так же восприятие «изменения» сменяется постепенным проявлением непрерывности Творения как исполнения потенциальности, актуализирующейся в проявленном.`,
              `Без прошлого и будущего нет и «сейчас» — и становится понятно, что прошлое, настоящее и будущее — все иллюзорные контекстуализации, порождённые ограничениями линейной парадигмы.`,
              `Сдвиг вперёд требует лишь отказа от всех систем убеждений и понимания, что всякий страх — иллюзия. На деле ничто не таково, каким его воспринимало эго, ведь линейное измерение — лишь допущение. Нелинейный абсолют — совсем другая парадигма, действующая по совершенно иным принципам — принципам, которые раскрывают себя сами, а не опираются на последовательное понимание или осмысление.`,
            ],
          },
        ],
      },
    },
  },
  {
    slug: "love",
    name: "love",
    title: "Love",
    score: 500,
    frame: `Not earned and not owed — energy that has stopped needing somewhere to go.`,
    personalFrame: `This isn't earned and it isn't owed — it's energy in you that's stopped needing somewhere to go.`,
    signals: [
      { label: "Feels like", value: "warm and expansive, less interested in being right than in staying connected." },
      { label: "Personality", value: "forgiving, generous with benefit of the doubt, quicker to include than to defend." },
      { label: "Used in society", value: "the quality behind long marriages, loyal friendships, work people stay devoted to." },
      { label: "Prone to", value: "being confused with attachment or infatuation, which fade the moment the object changes." },
    ],
    sections: [
      {
        heading: "What this feels like",
        paragraphs: [
          `Warm and expansive rather than urgent. Less interested in winning an exchange than in staying connected through it. It doesn't need the moment to go a particular way to keep functioning.`,
        ],
      },
      {
        heading: "What it's for",
        paragraphs: [
          `Ramana Maharshi: "Love of an object is of an inferior order and cannot endure." Any love aimed at something outside you — a person, an outcome, a version of yourself — fades the moment that object changes, because it was never really about the object.`,
          `Nisargadatta Maharaj: "Wisdom is knowing I am nothing, Love is knowing I am everything, and between the two my life moves." Worth sitting with directly — not a formula, a description of where love actually comes from once it isn't chasing anything.`,
        ],
      },
      {
        heading: "Try this now",
        paragraphs: [
          `Notice the next time you catch yourself keeping love conditional — "I'll be warm once they apologize" — and try dropping the condition for five minutes, just to see what's actually underneath the withholding.`,
        ],
      },
      {
        heading: "Where people get it wrong",
        paragraphs: [
          `What most people call love at the lower end of this range is really attachment — glamour, possession, the specialness of a particular person or outcome. It's intense, and it fades the moment the object does, because it was never really about them.`,
        ],
      },
    ],
    deepDive: [
      {
        heading: "About this section",
        paragraphs: [
          `The rest of this deeper read follows David R. Hawkins' own account of this state from his book *Power vs. Force* — his framework and his language, not independently verified science. See "Where this comes from" for more on his methodology and its limits.`,
        ],
      },
      {
        heading: "What this love is",
        paragraphs: [
          `Characterised by the development of an energy field that is progressively unconditional, unchanging, and permanent. It does not fluctuate because its source is within the person who loves and is not dependent on external factors.`,
          `Lovingness is a way of being in and relating to the world. It is forgiving, nurturing, and supportive.`,
          `Love is not intellectual and does not proceed from the mind. Love emanates from the heart. It has the capacity to lift others and accomplish great feats because of its purity of motive.`,
          `The energy field of life is innately gratifying in and of its own quality.`,
        ],
      },
      {
        heading: "How it relates rather than reacts",
        paragraphs: [
          `As reason is bypassed, there arises the capacity for instantaneous recognition of the totality of a problem and a major expansion of context. Reason deals with particulars, whereas love deals with wholes.`,
          `Love takes no position and thus is global, rising above the separation of positionality. It is then possible to be "one with another," as there are no longer any barriers.`,
          `Love dissolves negativity by recontextualising it rather than by attacking it. As such, it is benign, supportive, and nurtures life. It is the level of true happiness.`,
          `In terms of the evolution of consciousness, this level reflects transcendence of identification with the limiting linear domain and its positionalities, and the awareness of subjectivity as the primary state that underlies all experience.`,
        ],
      },
      {
        heading: "How it grows",
        paragraphs: [
          `Love is available everywhere, and although it may start as conditional, with time and intention, it becomes a way of life and a way of relating to life in all its expressions.`,
          `As love progresses, it seeks no return or gain, for it is self-rewarding by virtue of its completeness, since it has no needs.`,
          `The capacity for love grows, so that the more one loves, the more one can love—there is no end point or limitation.`,
          `To be loving is also to be lovable, because the world is the reflection.`,
        ],
      },
      {
        heading: "Where it's still learning",
        paragraphs: [
          `At the lower levels of consciousness, what is perceived as love is conditional and identified with possession, passion, romance, and desire, which are projected onto people or objects to give them an exciting specialness and glamour that tend to fade after the prized object or relationship is obtained. Infatuations tend to be frantic, with a fear of loss that leads to despair.`,
          `The limitations of love have to do with perceived qualities and differences. By inner self-honesty and examination, these areas of limitation are revealed—usually as residual judgments or as the impact from prior experience.`,
        ],
      },
    ],
    translations: {
      ru: {
        title: "Любовь",
        frame: `Не заслуженная и не должная — энергия, которой больше не нужно куда-то устремляться.`,
        personalFrame: `Это не заслужено и не должно вам — это энергия в вас, которой больше не нужно куда-то устремляться.`,
        signals: [
          { label: "Ощущается как", value: "тепло и раскрытость, интерес не в том, чтобы быть правым, а в том, чтобы оставаться на связи." },
          { label: "Личность", value: "прощающая, щедрая на доверие, скорее включает, чем защищается." },
          { label: "Проявление в обществе", value: "качество, лежащее в основе долгих браков, верной дружбы, работы, которой люди преданы." },
          { label: "Уязвимо к", value: "тому, что её путают с привязанностью или влюблённостью, которые гаснут, стоит объекту измениться." },
        ],
        sections: [
          {
            heading: "Каково это на ощупь",
            paragraphs: [
              `Тепло и раскрытость, а не срочность. Интерес не в том, чтобы выиграть обмен репликами, а в том, чтобы оставаться на связи в его процессе. Не нужно, чтобы момент сложился определённым образом, чтобы продолжать работать.`,
            ],
          },
          {
            heading: "Для чего это",
            paragraphs: [
              `Рамана Махарши: «Любовь к объекту — низшего порядка и не может длиться». Любая любовь, направленная на что-то вне вас — человека, исход, версию себя, — гаснет в момент, когда объект меняется, потому что на самом деле она никогда не была про объект.`,
              `Нисаргадатта Махарадж: «Мудрость — знать, что я ничто. Любовь — знать, что я всё. И между ними движется моя жизнь». Стоит подумать над этим напрямую — не как над формулой, а как над описанием того, откуда на самом деле берётся любовь, когда она перестаёт что-либо преследовать.`,
            ],
          },
          {
            heading: "Попробуйте прямо сейчас",
            paragraphs: [
              `Заметьте следующий раз, когда поймаете себя на том, что держите любовь условной — «я буду тёплым, когда они извинятся», — и попробуйте на пять минут снять это условие, просто чтобы увидеть, что на самом деле лежит под удержанием.`,
            ],
          },
          {
            heading: "В чём люди ошибаются",
            paragraphs: [
              `То, что большинство людей называют любовью в нижней части этого диапазона, на самом деле привязанность — очарование, обладание, особость конкретного человека или исхода. Она интенсивна и гаснет в момент, когда меняется объект, потому что на самом деле никогда не была про него.`,
            ],
          },
        ],
        deepDive: [
          {
            heading: "Об этом разделе",
            paragraphs: [
              `Остальная часть этого более глубокого материала следует собственному описанию этого состояния Дэвидом Р. Хокинсом из его книги *Сила против насилия* — это его система и его язык, а не независимо подтверждённая наука. Подробнее о его методологии и её ограничениях — в разделе «Откуда это взято».`,
            ],
          },
          {
            heading: "Что такое эта любовь",
            paragraphs: [
              `Характеризуется развитием энергетического поля, которое становится всё более безусловным, неизменным и постоянным. Оно не колеблется, потому что его источник — внутри любящего человека и не зависит от внешних факторов.`,
              `Любовность — это способ быть в мире и относиться к нему. Она прощающая, питающая, поддерживающая.`,
              `Любовь не интеллектуальна и не исходит из ума. Любовь исходит из сердца. Она способна поднимать других и совершать великие дела благодаря чистоте своего мотива.`,
              `Энергетическое поле жизни по своей природе доставляет удовлетворение само по себе.`,
            ],
          },
          {
            heading: "Как она соотносится, а не реагирует",
            paragraphs: [
              `Когда разум обходится стороной, возникает способность мгновенно распознавать проблему целиком и значительно расширять контекст. Разум имеет дело с частностями, тогда как любовь — с целым.`,
              `Любовь не занимает позицию и потому всеобъемлюща, поднимаясь над разделением на позиции. Тогда становится возможным быть «единым с другим», ведь барьеров больше нет.`,
              `Любовь растворяет негативность, переосмысляя её контекст, а не атакуя её. Поэтому она благотворна, поддерживающа и питает жизнь. Это уровень истинного счастья.`,
              `С точки зрения эволюции сознания, этот уровень отражает преодоление отождествления с ограничивающей линейной сферой и её позициями, а также осознание субъективности как первичного состояния, лежащего в основе всякого опыта.`,
            ],
          },
          {
            heading: "Как она растёт",
            paragraphs: [
              `Любовь доступна повсюду, и хотя она может начинаться как условная, со временем и намерением становится образом жизни и способом относиться к жизни во всех её проявлениях.`,
              `По мере роста любовь не ищет отдачи или выгоды, ведь она сама себя вознаграждает в силу своей полноты, поскольку у неё нет нужд.`,
              `Способность любить растёт, так что чем больше любишь, тем больше можешь любить — предела или ограничения нет.`,
              `Быть любящим — значит и быть достойным любви, ведь мир — это отражение.`,
            ],
          },
          {
            heading: "Где она ещё учится",
            paragraphs: [
              `На более низких уровнях сознания то, что воспринимается как любовь, условно и отождествляется с обладанием, страстью, романтикой и желанием, которые проецируются на людей или объекты, придавая им волнующую особость и притягательность, обычно угасающую после того, как желанный объект или отношения получены. Увлечения, как правило, лихорадочны, со страхом потери, ведущим к отчаянию.`,
              `Ограничения любви связаны с воспринимаемыми качествами и различиями. Через внутреннюю честность с собой и исследование эти области ограничений раскрываются — обычно как остаточные суждения или как след прежнего опыта.`,
            ],
          },
        ],
      },
    },
  },
  {
    slug: "reason",
    name: "reason",
    title: "Reason",
    score: 400,
    frame: `The mind organizing experience — useful information, until it mistakes the map for the territory.`,
    personalFrame: `Your mind is organizing experience right now — useful, as long as it doesn't mistake the map for the territory.`,
    signals: [
      { label: "Feels like", value: "clear, ordered, confident you can explain why." },
      { label: "Personality", value: "analytical, methodical, values evidence over intuition." },
      { label: "Used in society", value: "the mode behind science, law, and engineering — anywhere a decision needs to be defensible." },
      { label: "Prone to", value: "mistaking a good explanation for the whole truth, or using logic to avoid feeling something." },
    ],
    sections: [
      {
        heading: "What this feels like",
        paragraphs: [
          `Clear and ordered — you can explain why, and the explanation holds up. Complexity feels manageable rather than overwhelming, because there's a method for sorting it.`,
        ],
      },
      {
        heading: "What it's for",
        paragraphs: [
          `Reason's real use isn't producing feelings, it's building ground you can trust — Carl Sagan's whole method rests on one line: extraordinary claims require extraordinary evidence. That single habit, applied honestly, sorts most of what's actually true in your life from what you've just been repeating.`,
          `But even Einstein, whose career was reason's proof of concept, documented its edge plainly: "The mind can proceed only so far upon what it knows and can prove. There comes a point where the mind takes a leap... and comes out upon a higher plane of knowledge, but can never prove how it got there." Reason gets you to the edge. It doesn't cross it.`,
        ],
      },
      {
        heading: "Try this now",
        paragraphs: [
          `Take one belief you're currently certain about and ask what evidence would change your mind. If the honest answer is "nothing would," that's not reason anymore — it's just conviction wearing reason's clothes.`,
        ],
      },
      {
        heading: "Where people get it wrong",
        paragraphs: [
          `Reason is brilliant at handling data and terrible at knowing when it's the wrong tool — grief, love, and meaning don't resolve by being explained. Used as a way to avoid feeling something rather than to understand it, reason becomes a very sophisticated form of hiding.`,
        ],
      },
    ],
    deepDive: [
      {
        heading: "About this section",
        paragraphs: [
          `The rest of this deeper read follows David R. Hawkins' own account of this state from his book *Power vs. Force* — his framework and his language, not independently verified science. See "Where this comes from" for more on his methodology and its limits.`,
        ],
      },
      {
        heading: "What reason does well",
        paragraphs: [
          `Intelligence and rationality rise to the forefront when the emotionalism of the lower levels is transcended.`,
          `Reason is capable of handling large, complex amounts of data and making rapid, correct decisions; of understanding the intricacies of relationships, gradations, and fine distinctions; and of expert manipulation of symbols as abstract concepts become increasingly important.`,
          `Understanding of information and logic are the main tools of accomplishment that are the hallmarks of level 400. This is the level of Nobel Prize winners, great statesmen, Supreme Court Justices, Einstein, Freud, and many other important figures in the history of thought.`,
        ],
      },
      {
        heading: "Where it runs into its own limits",
        paragraphs: [
          `The shortcomings of this level are the failure to clearly distinguish the difference between symbols and what they represent, and the confusion between the objective and subjective worlds, which limits the understanding of causality.`,
          `Intellectualising can become an end in itself. Reason is limited in that it does not afford the capacity for the discernment of essence or the "critical point" of a complex issue.`,
          `Reason is disciplined by the dialectic of logic as a necessity to discern the linear truth of confirmable facts. It produces massive amounts of information and documentation, but it lacks the capacity to resolve discrepancies in data and conclusions.`,
          `Although reason is highly effective in a technical world where the methodologies of logic dominate, reason itself—paradoxically—is the major block to reaching higher levels of consciousness because it attracts identification of the self as mind.`,
        ],
      },
      {
        heading: "The mind talking to itself",
        paragraphs: [
          `The mind is satisfied with the acquisition of knowledge but then discovers that alone, it is insufficient to bring about transformation, which requires a further step to convert data into an inner experiential reality.`,
          `The intellect is used to being satisfied by hearing "about" a subject and may naively conclude that the information itself should be sufficient. While this is often partially true, at other times, the transfer from the acquisition of information to subjective experience comes about through spiritual practice, meditation, contemplation, and devotion.`,
          `A major deterrent to transcending identification of the self with mind is the processing of data, symbols, and words via random mentalisation. During meditation, this mental chatter is frustrating and becomes a source of anxiety. To try to silence the mind via willpower is ineffective, and the results are limited and brief. By understanding the source of the flow of mentalisation, it can be transcended.`,
          `Mentalisation is of egocentric origin, and its primary function is commentary. Unless requested, thought is a vanity—an endless procession of opinion, rationalisation, reprocessing, evaluating, and subtle judgment by which thoughts are given value or importance via presumed significance, simply because they are "mine."`,
          `The "importance" of thoughts is a self-appointed vanity. The ego presumes that it has the "right" to intrude upon peace and silence with endless chatter. The mind has an imaginary audience and carries on a monologue for self-audition. The undisciplined mind has an observation commentary or opinion on everything.`,
        ],
      },
      {
        heading: "What's on the other side of it",
        paragraphs: [
          `It is a relief to let the mind become silent and just "be" with surroundings. Peace results. In order to realise that a running commentary is not necessary—or even authorised—the will gives the mind permission to be silent.`,
        ],
      },
    ],
    translations: {
      ru: {
        title: "Разум",
        frame: `Ум, упорядочивающий опыт, — полезная информация, пока не начинает принимать карту за территорию.`,
        personalFrame: `Ваш ум сейчас упорядочивает опыт — это полезно, пока он не путает карту с территорией.`,
        signals: [
          { label: "Ощущается как", value: "ясно, упорядоченно, уверенность, что вы можете объяснить почему." },
          { label: "Личность", value: "аналитическая, методичная, ценит доказательства выше интуиции." },
          { label: "Проявление в обществе", value: "режим, лежащий в основе науки, права и инженерии — везде, где решение должно быть защитимо." },
          { label: "Уязвимо к", value: "тому, что принимает хорошее объяснение за всю правду, или использует логику, чтобы не чувствовать." },
        ],
        sections: [
          {
            heading: "Каково это на ощупь",
            paragraphs: [
              `Ясно и упорядоченно — вы можете объяснить почему, и объяснение выдерживает проверку. Сложность ощущается управляемой, а не подавляющей, потому что есть метод её разбора.`,
            ],
          },
          {
            heading: "Для чего это",
            paragraphs: [
              `Настоящая польза разума не в том, чтобы производить чувства, а в том, чтобы строить почву, которой можно доверять, — весь метод Карла Сагана держится на одной фразе: экстраординарные утверждения требуют экстраординарных доказательств. Одна эта привычка, применённая честно, отделяет большую часть по-настоящему истинного в вашей жизни от того, что вы просто повторяли.`,
              `Но даже Эйнштейн, чья карьера была живым доказательством разума, прямо зафиксировал его предел: «Ум может продвинуться лишь настолько далеко, насколько позволяет то, что он знает и может доказать. Наступает момент, когда ум совершает скачок... и оказывается на более высокой плоскости знания, но никогда не может доказать, как он туда попал». Разум доводит вас до края. Он не переступает его.`,
            ],
          },
          {
            heading: "Попробуйте прямо сейчас",
            paragraphs: [
              `Возьмите одно убеждение, в котором вы сейчас уверены, и спросите, какое доказательство изменило бы ваше мнение. Если честный ответ — «ничто бы не изменило», это уже не разум — это просто убеждённость, надевшая одежды разума.`,
            ],
          },
          {
            heading: "В чём люди ошибаются",
            paragraphs: [
              `Разум блестяще справляется с данными и ужасно — с пониманием того, когда он не тот инструмент: горе, любовь и смысл не разрешаются через объяснение. Используемый как способ не чувствовать что-то, а не понять это, разум становится очень изощрённой формой укрытия.`,
            ],
          },
        ],
        deepDive: [
          {
            heading: "Об этом разделе",
            paragraphs: [
              `Остальная часть этого более глубокого материала следует собственному описанию этого состояния Дэвидом Р. Хокинсом из его книги *Сила против насилия* — это его система и его язык, а не независимо подтверждённая наука. Подробнее о его методологии и её ограничениях — в разделе «Откуда это взято».`,
            ],
          },
          {
            heading: "С чем разум справляется хорошо",
            paragraphs: [
              `Интеллект и рациональность выходят на первый план, когда преодолена эмоциональность более низких уровней.`,
              `Разум способен обрабатывать большие, сложные объёмы данных и быстро принимать верные решения; понимать тонкости отношений, градаций и мельчайших различий; и мастерски оперировать символами по мере того, как абстрактные понятия становятся всё важнее.`,
              `Понимание информации и логика — главные инструменты достижений, отличающие уровень 400. Это уровень лауреатов Нобелевской премии, великих государственных деятелей, судей Верховного суда, Эйнштейна, Фрейда и многих других значимых фигур в истории мысли.`,
            ],
          },
          {
            heading: "Где он упирается в собственные пределы",
            paragraphs: [
              `Недостатки этого уровня — неспособность чётко различать символы и то, что они обозначают, и смешение объективного и субъективного миров, что ограничивает понимание причинности.`,
              `Интеллектуализация может стать самоцелью. Разум ограничен тем, что не даёт способности распознавать суть или «критическую точку» сложного вопроса.`,
              `Разум дисциплинирован диалектикой логики как необходимостью различать линейную истину подтверждаемых фактов. Он производит огромные объёмы информации и документации, но не способен разрешать расхождения в данных и выводах.`,
              `Хотя разум крайне эффективен в техническом мире, где господствуют методологии логики, сам разум — как ни парадоксально — становится главным препятствием на пути к более высоким уровням сознания, потому что притягивает отождествление себя с умом.`,
            ],
          },
          {
            heading: "Ум разговаривает сам с собой",
            paragraphs: [
              `Ум удовлетворён приобретением знания, но затем обнаруживает, что одного этого недостаточно для трансформации, которая требует дальнейшего шага — превращения данных во внутреннюю переживаемую реальность.`,
              `Интеллект привык быть удовлетворённым тем, что «слышит о» предмете, и может наивно заключить, что самой информации должно быть достаточно. Хотя это часто отчасти верно, в других случаях переход от накопления информации к субъективному опыту происходит через духовную практику, медитацию, созерцание и преданность.`,
              `Главное препятствие на пути преодоления отождествления себя с умом — обработка данных, символов и слов через случайную ментализацию. Во время медитации эта мысленная болтовня раздражает и становится источником тревоги. Пытаться заставить ум замолчать силой воли неэффективно, и результаты ограничены и кратковременны. Понимая источник потока ментализации, его можно преодолеть.`,
              `Ментализация имеет эгоцентрическое происхождение, и её главная функция — комментирование. Если её не просят, мысль — тщеславие: бесконечная процессия мнений, рационализации, пересмотра, оценивания и тонкого суждения, посредством которых мыслям придаётся ценность или важность через предполагаемую значимость просто потому, что они «мои».`,
              `«Важность» мыслей — самоприсвоенное тщеславие. Эго полагает, что имеет «право» вторгаться в покой и тишину бесконечной болтовнёй. У ума есть воображаемая аудитория, и он ведёт монолог для самопрослушивания. Недисциплинированный ум комментирует или имеет мнение обо всём.`,
            ],
          },
          {
            heading: "Что находится по ту сторону",
            paragraphs: [
              `Это облегчение — позволить уму замолчать и просто «быть» с окружающим. В результате наступает покой. Чтобы осознать, что непрерывный комментарий не нужен — и даже не санкционирован, — воля даёт уму разрешение молчать.`,
            ],
          },
        ],
      },
    },
  },
  {
    slug: "acceptance",
    name: "acceptance",
    title: "Acceptance",
    score: 350,
    frame: `Not resignation — the moment perception stops arguing with what is already true.`,
    personalFrame: `You're not giving up right now — you've just stopped arguing with what's already true.`,
    signals: [
      { label: "Feels like", value: "settled, without the undertow of arguing against what's already true." },
      { label: "Personality", value: "even-keeled, hard to provoke into a fight about how things \"should\" be." },
      { label: "Used in society", value: "the posture behind recovery programs, therapy, and most durable peace agreements." },
      { label: "Prone to", value: "being confused with resignation by people who think accepting something means endorsing it." },
    ],
    sections: [
      {
        heading: "What this feels like",
        paragraphs: [
          `Settled, without the background static of arguing that things should be different than they are. It doesn't mean liking the situation — it means the fight against its existing has stopped.`,
        ],
      },
      {
        heading: "What it's for",
        paragraphs: [
          `Marsha Linehan, who built Dialectical Behavior Therapy after surviving the psychiatric crisis she spent decades not disclosing publicly, reduced it to an equation: pain is pain, but suffering is pain plus non-acceptance. The suffering isn't the situation — it's the part of you still arguing the situation shouldn't be the situation. (See "Where this comes from" for more on her work.)`,
          `Epictetus said the same thing two thousand years earlier: some things are within your control, others aren't, and the entire difficulty of a life is mistaking which is which. Acceptance isn't giving up on the ones you can change. It's finally being accurate about which ones those are.`,
        ],
      },
      {
        heading: "Try this now",
        paragraphs: [
          `Name one thing right now you're still arguing with reality about. Try the sentence "this is happening" instead of "this shouldn't be happening," and notice if anything in your body loosens.`,
        ],
      },
      {
        heading: "Where people get it wrong",
        paragraphs: [
          `Acceptance gets mistaken for giving up. It's the opposite — Linehan's whole clinical point was that acceptance is what makes change possible, not what replaces it. You can't successfully change what you haven't first admitted is real.`,
        ],
      },
    ],
    deepDive: [
      {
        heading: "About this section",
        paragraphs: [
          `The rest of this deeper read follows David R. Hawkins' own account of this state from his book *Power vs. Force* — his framework and his language, not independently verified science. See "Where this comes from" for more on his methodology and its limits.`,
        ],
      },
      {
        heading: "Taking back the source of your happiness",
        paragraphs: [
          `At this level of awareness, a major transformation takes place with the understanding that oneself is the source and creator of the experience of one's life.`,
          `The enormous jump of taking back one's own power (in comparison to the levels below 200) is completed at this level with the realization that the source of one's own happiness is within oneself. Love is not something that is given or taken away by another, but is created from within.`,
          `There is emotional calm, and perception is widened as denial is transcended. Life is lived on life's terms without trying to make it conform to the agenda.`,
          `The context of experience is expanded so that one is capable of "seeing the whole picture."`,
        ],
      },
      {
        heading: "What this maturity looks like",
        paragraphs: [
          `The individual at this level prioritizes long-term goals and masters self-discipline.`,
          `The maturity of acceptance includes the ability to tranquilly accept both personal and human limitations without loss of self-esteem, because value judgments have lost their validity and are now seen to be primarily arbitrary, personalized choices.`,
          `Personal opinions become dethroned and lose their tendency to dominate by sheer emotional pressure.`,
          `Acceptance precludes pretense and allows for realistic objectivity.`,
        ],
      },
      {
        heading: "Letting go of judgment",
        paragraphs: [
          `Social plurality begins to emerge as a form of resolution of problems. Therefore, this level is free of extremes of discrimination or intolerance. Acceptance includes rather than rejects.`,
          `Acceptance is the result of wisdom as well as surrendering positionalities, in that it accepts that the varied expressions of life are in accord with Divine will and that Creation is thereby multitudinous in its expressions as evolution.`,
          `Acceptance doesn't get caught in the "black or white" duality and is able to bypass the temptation of judgmentalism.`,
          `With freedom from the need for approval by others, there is release from the compulsion to seek and crave social agreement.`,
          `Acceptance applies to the inner as well as the outer world. With time, it becomes apparent that the ego, by virtue of its innate structure, is prone to perceptual error, and that by the willingness to surrender a positionality (a particular perception of what there is), these distortions of perception are transcended.`,
          `While it is obvious that there are many elements and forces in the world that are deleterious to human life and happiness, it is not necessary to hate or demonize them but instead to merely make appropriate allowances and avoid them. Thus, what was formerly demonized now appears to be more like bad weather, a tidal wave, or a force of nature to be reckoned with but not hated.`,
          `Surrendering judgmentalism results in freedom from pejorative and hateful emotions that in themselves bring up either conscious or unconscious guilt or unconscious fears of retaliation and paranoia.`,
          `To decline the role of moral arbiter allows the surrendering of that function to God — "Judgment is mine," sayeth the Lord — and results in detachment from the world's endless debates over moral, ethical, legal, political, religious, ethnic, judicial, and social personalities.`,
        ],
      },
      {
        heading: "Humility as strength",
        paragraphs: [
          `With humility, one's personal life loses false value and accepts its true power and function, increasing spiritual energy and power, thereby influencing the world, especially through the collective consciousness of mankind.`,
          `The narcissistic ego, at some of the lower levels, is humorless and reveals its true nature by its "sensitivity" and other neurotic traits. It lacks the capacity to laugh at oneself and the foibles and paradoxes of human life. Thus, developing a sense of humor assists the evolution of consciousness through deflating the ego's puffed-up self-image by which it imbues its emotionalized opinionating and vanity.`,
          `Humility precludes making a fool or spectacle of oneself to gain attention or control others by bombastic shouting and gesticulation. Acceptance declines drama and allows calm plurality without getting marginalized by the inflation of pumped-up positionalities that, by their very inflation, attract argument and attack.`,
        ],
      },
    ],
    translations: {
      ru: {
        title: "Принятие",
        frame: `Не смирение — момент, когда восприятие перестаёт спорить с тем, что уже истинно.`,
        personalFrame: `Вы сейчас не сдаётесь — вы просто перестали спорить с тем, что уже истинно.`,
        signals: [
          { label: "Ощущается как", value: "устойчивость, без подводного течения спора с тем, что уже истинно." },
          { label: "Личность", value: "уравновешенная, трудно втянуть в спор о том, какими вещи «должны быть»." },
          { label: "Проявление в обществе", value: "позиция, лежащая в основе программ восстановления, терапии и большинства прочных мирных соглашений." },
          { label: "Уязвимо к", value: "тому, что его путают со смирением люди, думающие, что принять что-то — значит это одобрить." },
        ],
        sections: [
          {
            heading: "Каково это на ощупь",
            paragraphs: [
              `Устойчивость, без фонового шума спора о том, что всё должно быть иначе, чем есть. Это не значит, что ситуация нравится, — это значит, что борьба с самим фактом её существования прекратилась.`,
            ],
          },
          {
            heading: "Для чего это",
            paragraphs: [
              `Марша Линехан, создавшая диалектическую поведенческую терапию после того, как пережила психиатрический кризис, о котором десятилетиями публично не рассказывала, свела всё к уравнению: боль есть боль, но страдание — это боль плюс непринятие. Страдание — не сама ситуация, а та часть вас, что всё ещё спорит: ситуация не должна быть такой, какая она есть. (Подробнее о её работе — в разделе «Откуда это взято».)`,
              `Эпиктет сказал то же самое на две тысячи лет раньше: одни вещи в вашей власти, другие нет, и вся сложность жизни — в том, что путают одно с другим. Принятие — не отказ от того, что можно изменить. Это, наконец, точность в том, что именно к этому относится.`,
            ],
          },
          {
            heading: "Попробуйте прямо сейчас",
            paragraphs: [
              `Назовите прямо сейчас одну вещь, с реальностью которой вы всё ещё спорите. Попробуйте фразу «это происходит» вместо «этого не должно происходить» и заметьте, отпускает ли что-то в теле.`,
            ],
          },
          {
            heading: "В чём люди ошибаются",
            paragraphs: [
              `Принятие принимают за капитуляцию. На деле всё наоборот — вся клиническая мысль Линехан в том, что принятие — это то, что делает изменение возможным, а не то, что его заменяет. Нельзя успешно изменить то, что вы сначала не признали реальным.`,
            ],
          },
        ],
        deepDive: [
          {
            heading: "Об этом разделе",
            paragraphs: [
              `Остальная часть этого более глубокого материала следует собственному описанию этого состояния Дэвидом Р. Хокинсом из его книги *Сила против насилия* — это его система и его язык, а не независимо подтверждённая наука. Подробнее о его методологии и её ограничениях — в разделе «Откуда это взято».`,
            ],
          },
          {
            heading: "Возвращение себе источника собственного счастья",
            paragraphs: [
              `На этом уровне осознанности происходит крупная трансформация — понимание, что человек сам является источником и творцом опыта своей жизни.`,
              `Огромный скачок возвращения себе собственной силы (в сравнении с уровнями ниже 200) завершается на этом уровне осознанием, что источник собственного счастья — внутри самого человека. Любовь — не то, что даётся или отнимается другим, а то, что создаётся изнутри.`,
              `Наступает эмоциональное спокойствие, и восприятие расширяется по мере преодоления отрицания. Жизнь проживается на условиях самой жизни, без попыток подогнать её под свою повестку.`,
              `Контекст опыта расширяется настолько, что человек становится способен «видеть картину целиком».`,
            ],
          },
          {
            heading: "Как выглядит эта зрелость",
            paragraphs: [
              `Человек на этом уровне отдаёт приоритет долгосрочным целям и овладевает самодисциплиной.`,
              `Зрелость принятия включает способность спокойно принимать как личные, так и человеческие ограничения без потери самоуважения, потому что оценочные суждения теряют свою обоснованность и теперь видятся как преимущественно произвольный, персонализированный выбор.`,
              `Личные мнения теряют трон и перестают доминировать одним лишь эмоциональным давлением.`,
              `Принятие исключает притворство и позволяет реалистичную объективность.`,
            ],
          },
          {
            heading: "Отпускание суждения",
            paragraphs: [
              `Начинает проявляться социальная множественность как форма разрешения проблем. Поэтому этот уровень свободен от крайностей дискриминации или нетерпимости. Принятие включает, а не отвергает.`,
              `Принятие — результат мудрости, а также отказа от позиций, поскольку оно принимает, что разнообразные проявления жизни согласуются с Божественной волей и что Творение тем самым множественно в своих проявлениях как эволюция.`,
              `Принятие не попадает в ловушку дуальности «чёрное или белое» и способно обойти соблазн осуждения.`,
              `Со свободой от потребности в одобрении со стороны других приходит освобождение от навязчивого стремления искать и жаждать социального согласия.`,
              `Принятие относится как к внутреннему, так и к внешнему миру. Со временем становится очевидно, что эго в силу своей врождённой структуры склонно к ошибкам восприятия, и что через готовность отказаться от позиции (конкретного восприятия того, что есть), эти искажения восприятия преодолеваются.`,
              `Хотя очевидно, что в мире есть много элементов и сил, вредных для человеческой жизни и счастья, их не нужно ненавидеть или демонизировать — достаточно просто делать соответствующие поправки и избегать их. Так то, что раньше демонизировалось, теперь выглядит скорее как непогода, приливная волна или сила природы, с которой нужно считаться, но не ненавидеть её.`,
              `Отказ от осуждения освобождает от уничижительных и ненавистнических эмоций, которые сами по себе порождают либо сознательную, либо бессознательную вину, либо бессознательные страхи возмездия и паранойи.`,
              `Отказаться от роли морального арбитра позволяет передать эту функцию Богу — «Мне отмщение», говорит Господь — и приводит к отстранённости от бесконечных мировых споров о моральных, этических, правовых, политических, религиозных, этнических, судебных и социальных фигурах.`,
            ],
          },
          {
            heading: "Смирение как сила",
            paragraphs: [
              `При смирении личная жизнь человека теряет ложную ценность и обретает свою истинную силу и функцию, увеличивая духовную энергию и мощь, тем самым влияя на мир, особенно через коллективное сознание человечества.`,
              `Нарциссическое эго на некоторых из более низких уровней лишено чувства юмора и раскрывает свою истинную природу через «чувствительность» и другие невротические черты. Ему недостаёт способности смеяться над собой и над причудами и парадоксами человеческой жизни. Поэтому развитие чувства юмора помогает эволюции сознания, сдувая раздутый самообраз эго, которым оно наполняет своё эмоционализированное мнение и тщеславие.`,
              `Смирение исключает превращение себя в посмешище или зрелище ради привлечения внимания или контроля над другими через громкие крики и жестикуляцию. Принятие отказывается от драмы и позволяет спокойную множественность, не оказываясь на обочине из-за раздутых позиций, которые самим своим раздутием притягивают спор и атаку.`,
            ],
          },
        ],
      },
    },
  },
  {
    slug: "willingness",
    name: "willingness",
    title: "Willingness",
    score: 310,
    frame: `Confirmation that the friction of resistance has finally been spent.`,
    personalFrame: `You've spent the friction of resistance — you're just willing now, before any proof it'll work.`,
    signals: [
      { label: "Feels like", value: "a quiet \"yes, okay, I'll try\" before any proof it'll work." },
      { label: "Personality", value: "cooperative, quick to volunteer, unusually easy to work with." },
      { label: "Used in society", value: "the first requirement in every recovery program and most successful teams." },
      { label: "Prone to", value: "being skipped past — people wait for motivation or certainty instead of just starting." },
    ],
    sections: [
      {
        heading: "What this feels like",
        paragraphs: [
          `A quiet "okay, I'll try" before there's any evidence it'll pay off. Not enthusiasm exactly — closer to having stopped needing a guarantee before you'll move.`,
        ],
      },
      {
        heading: "What it's for",
        paragraphs: [
          `This one doesn't have a famous philosopher attached to it — it shows up instead in the plainest possible language, in the book Alcoholics Anonymous built its entire recovery model on: "Willingness, Honesty and Open-mindedness are the essentials of recovery," and, more bluntly, "Half measures availed us nothing."`,
          `What that captures is specific: willingness isn't the moment you succeed at changing. It's the moment before that, when you agree to try something you can't yet prove will work. Nothing downstream happens without it.`,
        ],
      },
      {
        heading: "Try this now",
        paragraphs: [
          `Pick the smallest possible version of the thing you've been putting off, and do that version today — not because you're ready, but specifically because you're not, and willingness is what covers that gap.`,
        ],
      },
      {
        heading: "Where people get it wrong",
        paragraphs: [
          `People wait to feel willing before acting, when it usually runs the other way — the willingness shows up once you've already started the half-measure. Waiting for the feeling first is usually just a slower way of not doing it.`,
        ],
      },
    ],
    deepDive: [
      {
        heading: "About this section",
        paragraphs: [
          `The rest of this deeper read follows David R. Hawkins' own account of this state from his book *Power vs. Force* — his framework and his language, not independently verified science. See "Where this comes from" for more on his methodology and its limits.`,
        ],
      },
      {
        heading: "What changes",
        paragraphs: [
          `At this level, growth is rapid and success is common in all endeavors.`,
          `Willingness implies that one has overcome inner resistance to life and is committed to participation.`,
          `People become genuinely friendly, and social and economic successes seem to follow automatically. The willing are not troubled by unemployment; they will take any job when they have to, or create a career, or become self-employed. They do not feel demeaned by service jobs or by starting "at the bottom."`,
          `Self-esteem is high and reinforced by positive feedback from society in the forms of recognition, appreciation, and reward. Willingness is sympathetic and responsive to the needs of others.`,
        ],
      },
      {
        heading: "Where the energy goes",
        paragraphs: [
          `Spiritual gratification is an unsuspected source of pleasure that brings a greater sense of well-being, which is the consequence of an increase in the flow of spiritual energy.`,
          `There is a greater sense of aliveness and appreciation for life as its quality progressively improves. The experience is subjective, nonlinear, and subtle—but all-pervasive. Confidence and optimism replace doubt, mistrust, resistance, and cynicism. Struggle is replaced with ease.`,
          `With relinquishment of resistance, less effort is required to function in the world. The intrinsic rewards of spiritual growth become self-activating motivation that evolves into enthusiasm as a consequence of the more positive view of self and life.`,
          `Willingness has the extra energy that would otherwise be wasted on resistance, delay, and complaints. Willingness energises fulfilling the needs of others, and thus its social expression is benevolent and humanitarian.`,
        ],
      },
      {
        heading: "How it shows up with others",
        paragraphs: [
          `It is the level of the Golden Rule: "Do unto others as you would have others do unto you." In successful relationships, this results in a mutuality of partners as helpmates and companions. This mutuality is the alignment with each other's welfare rather than just the more animal-driven emotional involvement.`,
          `Willingness is supportive rather than competitive for gain or dominance, and relationships involve service to each other's growth and goals rather than to just one's own.`,
          `Willingness is harmonious and is expressed as the "win-win" attitude.`,
        ],
      },
    ],
    translations: {
      ru: {
        title: "Готовность",
        frame: `Подтверждение того, что трение сопротивления наконец израсходовано.`,
        personalFrame: `Вы израсходовали трение сопротивления — теперь вы просто готовы, ещё до всякого доказательства, что это сработает.`,
        signals: [
          { label: "Ощущается как", value: "тихое «да, хорошо, я попробую» ещё до всякого доказательства, что это сработает." },
          { label: "Личность", value: "склонная к сотрудничеству, быстро вызывается сама, необычно легко с ней работать." },
          { label: "Проявление в обществе", value: "первое требование в каждой программе восстановления и в большинстве успешных команд." },
          { label: "Уязвимо к", value: "тому, что её пропускают — люди ждут мотивации или уверенности вместо того, чтобы просто начать." },
        ],
        sections: [
          {
            heading: "Каково это на ощупь",
            paragraphs: [
              `Тихое «ладно, попробую» ещё до всякого доказательства, что это окупится. Не совсем воодушевление — скорее то, что вам больше не нужна гарантия, прежде чем сдвинуться с места.`,
            ],
          },
          {
            heading: "Для чего это",
            paragraphs: [
              `У этого уровня нет знаменитого философа-покровителя — вместо этого он проявляется в самом простом языке, в книге, на которой «Анонимные Алкоголики» построили всю свою модель восстановления: «Готовность, честность и открытость ума — вот суть выздоровления», и, ещё прямее: «Половинчатые меры не принесли нам ничего».`,
              `Здесь схвачено нечто конкретное: готовность — это не момент, когда вам удаётся измениться. Это момент до этого, когда вы соглашаетесь попробовать то, что пока не можете доказать, что сработает. Ничто дальше не случится без неё.`,
            ],
          },
          {
            heading: "Попробуйте прямо сейчас",
            paragraphs: [
              `Выберите наименьшую возможную версию того, что вы откладывали, и сделайте эту версию сегодня — не потому, что вы готовы, а именно потому, что не готовы, и готовность — это то, что покрывает этот разрыв.`,
            ],
          },
          {
            heading: "В чём люди ошибаются",
            paragraphs: [
              `Люди ждут, что сначала почувствуют готовность, а потом будут действовать, тогда как обычно всё наоборот — готовность появляется, когда вы уже начали половинчатую меру. Ждать чувства сначала — обычно просто более медленный способ этого не делать.`,
            ],
          },
        ],
        deepDive: [
          {
            heading: "Об этом разделе",
            paragraphs: [
              `Остальная часть этого более глубокого материала следует собственному описанию этого состояния Дэвидом Р. Хокинсом из его книги *Сила против насилия* — это его система и его язык, а не независимо подтверждённая наука. Подробнее о его методологии и её ограничениях — в разделе «Откуда это взято».`,
            ],
          },
          {
            heading: "Что меняется",
            paragraphs: [
              `На этом уровне рост быстр, а успех обычен во всех начинаниях.`,
              `Готовность подразумевает, что человек преодолел внутреннее сопротивление жизни и привержен участию.`,
              `Люди становятся по-настоящему дружелюбными, и социальный и экономический успех, кажется, следует автоматически. Готовых не беспокоит безработица; они возьмутся за любую работу, когда придётся, или создадут карьеру, или станут самозанятыми. Они не чувствуют себя униженными работой в сфере услуг или началом «с самого низа».`,
              `Самоуважение высоко и подкрепляется положительной обратной связью от общества в виде признания, благодарности и вознаграждения. Готовность отзывчива и чутка к нуждам других.`,
            ],
          },
          {
            heading: "Куда уходит энергия",
            paragraphs: [
              `Духовное удовлетворение — неожиданный источник удовольствия, приносящий большее чувство благополучия, которое является следствием возросшего потока духовной энергии.`,
              `Появляется большее чувство живости и признательности к жизни по мере того, как её качество постепенно улучшается. Опыт субъективен, нелинеен и тонок — но всепроникающ. Уверенность и оптимизм заменяют сомнение, недоверие, сопротивление и цинизм. Борьба сменяется лёгкостью.`,
              `С отказом от сопротивления требуется меньше усилий, чтобы функционировать в мире. Внутренние награды духовного роста становятся самоактивирующейся мотивацией, перерастающей в энтузиазм как следствие более позитивного взгляда на себя и жизнь.`,
              `У готовности есть дополнительная энергия, которая иначе тратилась бы на сопротивление, отсрочку и жалобы. Готовность заряжает энергией удовлетворение потребностей других, и потому её социальное проявление благотворно и гуманно.`,
            ],
          },
          {
            heading: "Как это проявляется с другими",
            paragraphs: [
              `Это уровень Золотого правила: «Поступай с другими так, как хотел бы, чтобы поступали с тобой». В успешных отношениях это выражается во взаимности партнёров как помощников и спутников. Эта взаимность — согласованность с благополучием друг друга, а не просто более животное по своей природе эмоциональное вовлечение.`,
              `Готовность поддерживает, а не конкурирует ради выгоды или доминирования, и отношения включают служение росту и целям друг друга, а не только своим собственным.`,
              `Готовность гармонична и выражается как установка «выигрыш-выигрыш».`,
            ],
          },
        ],
      },
    },
  },
  {
    slug: "neutrality",
    name: "neutrality",
    title: "Neutrality",
    score: 250,
    frame: `Not indifference — the calm of no longer needing things to go a particular way.`,
    personalFrame: `You're not being indifferent right now — you've just stopped needing things to go a particular way.`,
    signals: [
      { label: "Feels like", value: "unbothered by which way things go, without having stopped caring." },
      { label: "Personality", value: "easygoing, hard to draw into conflict, doesn't need to win the room." },
      { label: "Used in society", value: "the calm coworker or friend nobody worries about setting off." },
      { label: "Prone to", value: "being mistaken for apathy by people who can't tell not-needing-an-outcome from not-caring-at-all." },
    ],
    sections: [
      {
        heading: "What this feels like",
        paragraphs: [
          `Unbothered by which way something goes, without having stopped caring how it goes. Losing isn't experienced as defeat — just as one of the outcomes that was always on the table.`,
        ],
      },
      {
        heading: "What it's for",
        paragraphs: [
          `There isn't a single figure who owns this one the way Frankl owns courage or Linehan owns acceptance — worth noticing, since neutrality rarely gets named as a virtue on its own. The closest precise language for it is much older: the Bhagavad Gita's instruction to act without attachment to the result, "equanimity is called yoga."`,
          `The distinction worth holding onto: neutrality isn't indifference. Indifference has stopped caring. Neutrality has just stopped needing things to land a particular way in order to be okay.`,
        ],
      },
      {
        heading: "Try this now",
        paragraphs: [
          `Before your next uncertain outcome — a message you're waiting on, a decision pending — name the actual fallback out loud: "if this doesn't happen, then I'll ___." Neutrality is easier to reach once you've located the floor.`,
        ],
      },
      {
        heading: "Where people get it wrong",
        paragraphs: [
          `Neutrality looks like apathy from the outside, and the two get confused constantly. The real test: apathy has stopped believing anything will help. Neutrality just isn't gripping the outcome — help is still welcome, it's just not required.`,
        ],
      },
    ],
    deepDive: [
      {
        heading: "About this section",
        paragraphs: [
          `The rest of this deeper read follows David R. Hawkins' own account of this state from his book *Power vs. Force* — his framework and his language, not independently verified science. See "Where this comes from" for more on his methodology and its limits.`,
        ],
      },
      {
        heading: "What it feels like day to day",
        paragraphs: [
          `To be neutral means to be relatively unattached to outcomes. Not getting one's way is no longer experienced as defeating, frightening, or frustrating.`,
          `At the neutral level, a person can say: "Well, if I don't get this job, then I'll get another." This is the beginning of inner confidence.`,
          `People at neutrality have a sense of well-being. This is the level of safety. People at this level are easy to get along with and safe to associate with because they are not interested in conflict, competition, or guilt. They are comfortable and basically emotionally undisturbed. This attitude is nonjudgmental and does not lead to any need to control other people's behaviours.`,
          `This level results in greater freedom for self and others. One is free from trying to "prove" anything about oneself.`,
          `The level of neutrality is relatively free of anxiety, for it doesn't place survival value on preconceived outcomes. Thus, the source of happiness is not projected externally onto others or the outside world.`,
        ],
      },
      {
        heading: "Nonattachment, not detachment",
        paragraphs: [
          `**Nonattachment vs detachment** — detachment indicates withdrawal as well as negation, leading to indifference, which in itself is a defense against the fear of attachment. The pathway to the state of Enlightenment is via nonattachment rather than negation. Nonattachment means nondependence on form. It allows for freedom from the attraction of projected values and anticipations such as gain.`,
          `Without fear of either attraction or aversion, neutrality allows for participation and the enjoyment of life because life becomes more like a play than a high-stakes involvement. This is consistent with the teachings of Tao, in that the flow of life is neither sought nor resisted. Thus, life becomes effortless, and existence itself is pleasurable, without conditions—easygoing, like a cork in the sea.`,
        ],
      },
    ],
    translations: {
      ru: {
        title: "Нейтральность",
        frame: `Не безразличие — спокойствие оттого, что вещам больше не нужно складываться определённым образом.`,
        personalFrame: `Вы сейчас не безразличны — вам просто больше не нужно, чтобы вещи складывались определённым образом.`,
        signals: [
          { label: "Ощущается как", value: "невозмутимость в том, как всё обернётся, без того, чтобы перестать заботиться." },
          { label: "Личность", value: "лёгкая на подъём, трудно втянуть в конфликт, не нужно выигрывать в комнате." },
          { label: "Проявление в обществе", value: "спокойный коллега или друг, за которым никто не следит с опаской." },
          { label: "Уязвимо к", value: "тому, что её принимают за апатию люди, не различающие «мне не нужен исход» и «мне всё равно»." },
        ],
        sections: [
          {
            heading: "Каково это на ощупь",
            paragraphs: [
              `Невозмутимость в том, как что-то обернётся, без того, чтобы перестать заботиться о том, как это обернётся. Проигрыш переживается не как поражение — просто как один из исходов, который всегда был на столе.`,
            ],
          },
          {
            heading: "Для чего это",
            paragraphs: [
              `Нет одной фигуры, которой принадлежал бы этот уровень так, как Франклу принадлежит смелость, а Линехан — принятие, — стоит заметить, ведь нейтральность редко называют добродетелью саму по себе. Ближайший точный язык для неё гораздо древнее: наставление Бхагавад-гиты действовать без привязанности к результату, «уравновешенность зовётся йогой».`,
              `Различие, которое стоит удержать: нейтральность — не безразличие. Безразличие перестало заботиться. Нейтральность просто перестала нуждаться в том, чтобы вещи сложились определённым образом, чтобы быть в порядке.`,
            ],
          },
          {
            heading: "Попробуйте прямо сейчас",
            paragraphs: [
              `Перед следующим неопределённым исходом — сообщением, которого ждёте, решением, которое ещё не принято, — назовите вслух настоящий запасной вариант: «если этого не случится, тогда я ___». К нейтральности легче прийти, когда вы нашли дно.`,
            ],
          },
          {
            heading: "В чём люди ошибаются",
            paragraphs: [
              `Нейтральность со стороны выглядит как апатия, и эти два состояния постоянно путают. Настоящая проверка: апатия перестала верить, что что-либо поможет. Нейтральность просто не вцепляется в исход — помощь по-прежнему желанна, просто не обязательна.`,
            ],
          },
        ],
        deepDive: [
          {
            heading: "Об этом разделе",
            paragraphs: [
              `Остальная часть этого более глубокого материала следует собственному описанию этого состояния Дэвидом Р. Хокинсом из его книги *Сила против насилия* — это его система и его язык, а не независимо подтверждённая наука. Подробнее о его методологии и её ограничениях — в разделе «Откуда это взято».`,
            ],
          },
          {
            heading: "Каково это день за днём",
            paragraphs: [
              `Быть нейтральным — значит быть относительно непривязанным к исходам. Не получить своего больше не переживается как поражение, пугающее или разочаровывающее.`,
              `На уровне нейтральности человек может сказать: «Что ж, если я не получу эту работу, получу другую». Это начало внутренней уверенности.`,
              `У людей на уровне нейтральности есть чувство благополучия. Это уровень безопасности. С людьми этого уровня легко ладить, и общаться с ними безопасно, потому что они не заинтересованы в конфликте, конкуренции или вине. Они спокойны и в целом эмоционально невозмутимы. Эта позиция неосуждающая и не порождает потребности контролировать поведение других людей.`,
              `Этот уровень даёт большую свободу и себе, и другим. Человек свободен от попыток что-либо «доказать» о себе.`,
              `Уровень нейтральности относительно свободен от тревоги, ведь он не придаёт заранее заданным исходам ценности для выживания. Поэтому источник счастья не проецируется вовне — на других или на внешний мир.`,
            ],
          },
          {
            heading: "Непривязанность, а не отстранённость",
            paragraphs: [
              `**Непривязанность против отстранённости** — отстранённость подразумевает отказ, а также отрицание, ведущее к безразличию, которое само по себе является защитой от страха привязанности. Путь к состоянию Просветления лежит через непривязанность, а не через отрицание. Непривязанность означает независимость от формы. Она даёт свободу от притяжения спроецированных ценностей и ожиданий, таких как выгода.`,
              `Без страха ни притяжения, ни отвращения нейтральность позволяет участвовать в жизни и наслаждаться ею, потому что жизнь становится больше похожа на игру, чем на вовлечённость с высокими ставками. Это созвучно учению Дао, согласно которому течение жизни не ищут и ему не сопротивляются. Так жизнь становится лёгкой, а само существование — приятным, безусловным — беззаботным, как пробка в море.`,
            ],
          },
        ],
      },
    },
  },
  {
    slug: "courage",
    name: "courage",
    title: "Courage",
    score: 200,
    frame: `Not the absence of fear — the willingness to meet it standing up.`,
    personalFrame: `You're not fearless right now — you're just meeting the fear standing up.`,
    signals: [
      { label: "Feels like", value: "afraid, and moving anyway." },
      { label: "Personality", value: "willing to try things that might not work, values effort over guaranteed outcome." },
      { label: "Used in society", value: "what gets someone through a diagnosis, a layoff, or a first attempt at something hard." },
      { label: "Prone to", value: "being confused with fearlessness — actual courage requires the fear still be present." },
    ],
    sections: [
      {
        heading: "What this feels like",
        paragraphs: [
          `Fear is still present — courage isn't its absence. What's different is the decision to act anyway, and the fact that acting despite it gets easier to do again next time.`,
        ],
      },
      {
        heading: "What it's for",
        paragraphs: [
          `Nelson Mandela, describing his own years of imprisonment and resistance rather than a general theory: "I learned that courage was not the absence of fear, but the triumph over it. The brave man is not he who does not feel afraid, but he who conquers that fear." He was, by his own account, afraid often. He acted anyway, repeatedly. That's the whole definition.`,
          `Viktor Frankl, writing from inside Auschwitz, extended it further: courage isn't only bold action, it's the capacity to bear what can't be changed and still find it meant something. "There was no need to be ashamed of tears, for tears bore witness that a man had the greatest of courage — the courage to suffer."`,
        ],
      },
      {
        heading: "Try this now",
        paragraphs: [
          `Name the smallest true fear behind whatever you're avoiding right now, out loud or on paper. Then do the smallest possible version of the thing anyway. The size of the action matters less than doing it while still afraid.`,
        ],
      },
      {
        heading: "Where people get it wrong",
        paragraphs: [
          `Waiting to feel fearless before acting means waiting forever — fearlessness isn't a prerequisite, it's what courage sometimes produces afterward, not before. Mandela was afraid the whole time. That's not a disqualifying detail, it's the definition.`,
        ],
      },
    ],
    deepDive: [
      {
        heading: "About this section",
        paragraphs: [
          `The rest of this deeper read follows David R. Hawkins' own account of this state from his book *Power vs. Force* — his framework and his language, not independently verified science. See "Where this comes from" for more on his methodology and its limits.`,
        ],
      },
      {
        heading: "Crossing the threshold",
        paragraphs: [
          `Level of empowerment. Zone of exploration, accomplishment, fortitude, determination.`,
          `Life is seen as exciting, challenging, and stimulating.`,
          `Courage implies the willingness to try new things and to deal with the vicissitudes of life. One is able to cope with and effectively handle the opportunities of life. There is the capacity to face fears and to grow despite any perceived defects. Obstacles that defeat people whose consciousness level is below 200 act as stimulants to those who have evolved into courage.`,
          `Crossing over level 200 is the most critical step in the evolution of human consciousness. There is intuitive acceptance of the truth of accountability as a spiritual and social reality. Truth is now seen as an ally instead of an enemy. Alignment with truth rather than gain brings strength, self-respect, and true empowerment rather than ego inflation.`,
          `"What gains a man to win the world but lose his soul?"`,
        ],
      },
      {
        heading: "What it feels like from the inside",
        paragraphs: [
          `Courage brings inner confidence and a greater sense of personal power because it is not dependent on external factors or results. To choose integrity and self-honesty is self-rewarding and reinforcing.`,
          `There is a greater sense of inner freedom due to the relief from guilt and fear. Steadfastness and integrous performance result in inner gratifications that accrue from the satisfactory fulfillment of inner standards.`,
          `At this level, it is the effort and intention, not just the result, that are important.`,
          `The long-term goal of life becomes the development of inner potentials, such as strength, rather than the acquisition of externals.`,
          `Although courage is both recognised and rewarded by society, social approval becomes only secondary. Temptations to violate integrity for gain are recognised and rejected.`,
        ],
      },
      {
        heading: "Self-honesty and what the body already knows",
        paragraphs: [
          `Hawkins claimed that everyone knows unconsciously when they are being lied to, and that his own muscle-testing method could reveal this directly in the body's response — the mind denying something the body still registered as false. This is Hawkins' own theory of "consciousness calibration," not a finding accepted by mainstream science; muscle testing has not been validated in controlled studies. The plainer, uncontroversial version of the same idea: most people can feel in their body when they're not being honest with themselves, even before they can say why.`,
          `Self-honesty brings relief from the negative emotions of lower energy fields. Negative emotions are now unwelcome and unpleasant in both oneself and others. Argument, conflict, and discord are no longer attractive because they have lost their ego appeal.`,
        ],
      },
      {
        heading: "How relationships and emotion change",
        paragraphs: [
          `Transitory difficulties of social realities are accepted aspects of human life rather than being seen as personal insults. There is a progressive distaste for violence and the theatrics of political and ideological extremism, as the comfort of inner calm is preferred to the excitement of adrenaline.`,
          `With maturity, there is the development of a sense of humor that replaces hostile attacks and outbursts. The peace and quiet that seem boring to lower levels of consciousness are now preferred, as are periods of calm during which to think and contemplate.`,
          `Reflection now becomes more important than emotionalized reactivity.`,
          `Desires are less demanding, and the quality of patience replaces drivenness and intolerance for delayed gratification.`,
          `Personal happiness becomes an achievable goal, and gratitude replaces resentment, self-pity, and blaming others.`,
          `The subjective experience of the world changes for the better, and people seem more friendly and hospitable.`,
        ],
      },
      {
        heading: "The key move",
        paragraphs: [
          `Courage leads to exploration and self-development, and it facilitates personal growth and the evolution of consciousness.`,
          `The critical key to moving into the strength of courage is the acceptance of personal responsibility and accountability. This major move requires personal relinquishment of a victim/perpetrator dualistic fallacy that socially undermines integrity via blame, by which an external "cause" or social condition replaces integrous personal autonomy and self-honesty.`,
          `Courage doesn't mean absence of fear, but the willingness to surmount it, which—when accomplished—reveals hidden strength and the capacity for fortitude.`,
        ],
      },
    ],
    translations: {
      ru: {
        title: "Смелость",
        frame: `Не отсутствие страха — готовность встретить его стоя.`,
        personalFrame: `Вы сейчас не бесстрашны — вы просто встречаете страх стоя.`,
        signals: [
          { label: "Ощущается как", value: "страшно, и всё равно двигаться." },
          { label: "Личность", value: "готова пробовать то, что может не сработать, ценит усилие выше гарантированного результата." },
          { label: "Проявление в обществе", value: "то, что проводит человека через диагноз, увольнение или первую попытку чего-то трудного." },
          { label: "Уязвимо к", value: "тому, что её путают с бесстрашием — настоящая смелость требует, чтобы страх ещё присутствовал." },
        ],
        sections: [
          {
            heading: "Каково это на ощупь",
            paragraphs: [
              `Страх всё ещё присутствует — смелость не в его отсутствии. Разница в решении действовать несмотря на него, и в том, что действовать вопреки страху с каждым разом становится легче.`,
            ],
          },
          {
            heading: "Для чего это",
            paragraphs: [
              `Нельсон Мандела, описывая собственные годы заключения и сопротивления, а не общую теорию: «Я понял, что смелость — это не отсутствие страха, а победа над ним. Смелый человек не тот, кто не чувствует страха, а тот, кто побеждает этот страх». Он сам, по собственному признанию, часто боялся. И всё равно действовал, снова и снова. Это и есть всё определение.`,
              `Виктор Франкл, писавший изнутри Освенцима, развил эту мысль дальше: смелость — это не только дерзкое действие, но и способность вынести то, что нельзя изменить, и всё же найти в этом смысл. «Не было причин стыдиться слёз, ведь слёзы свидетельствовали, что у человека есть величайшая смелость — смелость страдать».`,
            ],
          },
          {
            heading: "Попробуйте прямо сейчас",
            paragraphs: [
              `Назовите наименьший истинный страх за тем, что вы сейчас избегаете, вслух или на бумаге. Затем сделайте наименьшую возможную версию этого действия всё равно. Размер поступка значит меньше, чем то, что вы совершаете его, всё ещё испытывая страх.`,
            ],
          },
          {
            heading: "В чём люди ошибаются",
            paragraphs: [
              `Ждать, что почувствуешь бесстрашие, прежде чем действовать, значит ждать вечно — бесстрашие не предпосылка, а то, что смелость иногда производит уже после, а не до. Мандела боялся всё это время. Это не дисквалифицирующая деталь, это и есть определение.`,
            ],
          },
        ],
        deepDive: [
          {
            heading: "Об этом разделе",
            paragraphs: [
              `Остальная часть этого более глубокого материала следует собственному описанию этого состояния Дэвидом Р. Хокинсом из его книги *Сила против насилия* — это его система и его язык, а не независимо подтверждённая наука. Подробнее о его методологии и её ограничениях — в разделе «Откуда это взято».`,
            ],
          },
          {
            heading: "Пересечение порога",
            paragraphs: [
              `Уровень наделения силой. Зона исследования, свершения, стойкости, решимости.`,
              `Жизнь видится захватывающей, полной вызовов и стимулирующей.`,
              `Смелость подразумевает готовность пробовать новое и справляться с превратностями жизни. Есть способность справляться с возможностями жизни и эффективно ими пользоваться. Есть способность встречать страхи лицом к лицу и расти вопреки любым воспринимаемым недостаткам. Препятствия, которые побеждают людей с уровнем сознания ниже 200, действуют как стимул для тех, кто вошёл в смелость.`,
              `Переход через уровень 200 — самый критический шаг в эволюции человеческого сознания. Появляется интуитивное принятие истины подотчётности как духовной и социальной реальности. Истина теперь видится союзником, а не врагом. Согласованность с истиной, а не с выгодой, приносит силу, самоуважение и подлинное наделение силой, а не раздувание эго.`,
              `«Что пользы человеку, если он приобретёт весь мир, а душе своей повредит?»`,
            ],
          },
          {
            heading: "Каково это изнутри",
            paragraphs: [
              `Смелость приносит внутреннюю уверенность и большее чувство личной силы, потому что она не зависит от внешних факторов или результатов. Выбирать целостность и честность с собой — само по себе награда и подкрепление.`,
              `Возникает большее чувство внутренней свободы благодаря освобождению от вины и страха. Стойкость и целостное поведение приносят внутреннее удовлетворение, накапливающееся от успешного соответствия внутренним стандартам.`,
              `На этом уровне важен именно усилие и намерение, а не только результат.`,
              `Долгосрочной целью жизни становится развитие внутреннего потенциала, такого как сила, а не приобретение внешнего.`,
              `Хотя смелость признаётся и вознаграждается обществом, социальное одобрение становится лишь вторичным. Соблазны поступиться целостностью ради выгоды распознаются и отвергаются.`,
            ],
          },
          {
            heading: "Честность с собой и то, что тело уже знает",
            paragraphs: [
              `Хокинс утверждал, что каждый бессознательно знает, когда ему лгут, и что его собственный метод мышечного тестирования способен выявить это напрямую в реакции тела — ум отрицает то, что тело всё равно регистрирует как ложь. Это собственная теория Хокинса о «калибровке сознания», а не заключение, принятое основной наукой; мышечное тестирование не подтверждено в контролируемых исследованиях. Более простая, бесспорная версия той же идеи: большинство людей способны почувствовать в теле, когда они нечестны сами с собой, ещё до того, как смогут сказать почему.`,
              `Честность с собой приносит облегчение от отрицательных эмоций более низких энергетических полей. Отрицательные эмоции теперь нежеланны и неприятны — как в себе, так и в других. Спор, конфликт и разлад больше не привлекают, потому что утратили свою привлекательность для эго.`,
            ],
          },
          {
            heading: "Как меняются отношения и эмоции",
            paragraphs: [
              `Временные трудности социальной реальности воспринимаются как признанная часть человеческой жизни, а не как личное оскорбление. Постепенно нарастает неприязнь к насилию и театральности политического и идеологического экстремизма, поскольку удобство внутреннего покоя предпочитается возбуждению адреналина.`,
              `С обретением зрелости развивается чувство юмора, заменяющее враждебные атаки и вспышки. Тишина и покой, которые кажутся скучными на более низких уровнях сознания, теперь предпочтительны, как и периоды спокойствия для размышления и созерцания.`,
              `Размышление теперь становится важнее эмоционализированной реактивности.`,
              `Желания становятся менее требовательными, и качество терпения заменяет напористость и нетерпимость к отсроченному вознаграждению.`,
              `Личное счастье становится достижимой целью, и благодарность заменяет обиду, жалость к себе и обвинение других.`,
              `Субъективное переживание мира меняется к лучшему, и люди кажутся более дружелюбными и гостеприимными.`,
            ],
          },
          {
            heading: "Ключевой шаг",
            paragraphs: [
              `Смелость ведёт к исследованию и саморазвитию, способствуя личностному росту и эволюции сознания.`,
              `Ключ к переходу в силу смелости — принятие личной ответственности и подотчётности. Этот важный шаг требует личного отказа от дуалистического заблуждения «жертва/преступник», которое социально подрывает целостность через обвинение, при котором внешняя «причина» или социальное условие подменяет собой целостную личную автономию и честность с собой.`,
              `Смелость не означает отсутствие страха, но готовность преодолеть его, что при достижении раскрывает скрытую силу и способность к стойкости.`,
            ],
          },
        ],
      },
    },
  },
  {
    slug: "pride",
    name: "pride",
    title: "Pride",
    score: 175,
    frame: `Not vanity — self-worth borrowing its shape from comparison before it has learned to stand on its own.`,
    personalFrame: `This isn't vanity — it's your self-worth borrowing its shape from comparison, before it's learned to stand on its own.`,
    signals: [
      { label: "Feels like", value: "a lift in self-worth, tied to something you did or have." },
      { label: "Personality", value: "image-conscious, motivated by recognition, sensitive to being overlooked." },
      { label: "Used in society", value: "what drives achievement culture, status displays, and most competitive fields." },
      { label: "Prone to", value: "curdling into defensiveness or arrogance when the achievement is challenged." },
    ],
    sections: [
      {
        heading: "What this feels like",
        paragraphs: [
          `A lift in self-worth attached to something specific — an achievement, a possession, a status. It feels good, but noticeably better in contrast to what came before than as something solid on its own.`,
        ],
      },
      {
        heading: "What it's for",
        paragraphs: [
          `Psychologist Jessica Tracy's research (UBC Emotion & Self Lab) found something the word itself hides: there are two distinct forms of pride, not one. Authentic pride — earned, effort-based, tied to something you actually did — measurably boosts creativity and motivates people to keep showing up. Hubristic pride — grandiose, defensive, about dominance rather than achievement — does the opposite. (See "Where this comes from" for more on her research.)`,
          `Which means the question worth asking when pride shows up isn't whether to feel it. It's which of the two you're actually standing in.`,
        ],
      },
      {
        heading: "Try this now",
        paragraphs: [
          `Next time you feel proud of something, try locating whether it's about the effort you actually made, or about what it lets other people think of you. Neither answer is wrong — just worth knowing which one you're standing in.`,
        ],
      },
      {
        heading: "Where people get it wrong",
        paragraphs: [
          `Hubristic pride — the defensive, ego-driven kind — gets triggered the moment the achievement is questioned, because the whole thing was propping something up. Authentic pride doesn't flinch at a challenge the same way, because it was never that fragile to begin with.`,
        ],
      },
    ],
    deepDive: [
      {
        heading: "About this section",
        paragraphs: [
          `The rest of this deeper read follows David R. Hawkins' own account of this state from his book *Power vs. Force* — his framework and his language, not independently verified science. See "Where this comes from" for more on his methodology and its limits.`,
        ],
      },
      {
        heading: "Where this self-esteem comes from",
        paragraphs: [
          `This level is characterised by a rise in self-esteem, which balms all the pain experienced at lower levels of consciousness. But it feels good only in contrast to the lower levels.`,
          `The self-esteem of pride rests on an inflated and exaggerated opinion rather than on reality. Thus, the ego searches for confirmation, which rests on the insecure premises of opinion.`,
          `Pride is operationally serviceable as a transitory self-reward for successful accomplishment, but the error occurs when the ego assumes that it is the "me" being rewarded, rather than the behaviour itself. This leads to seeking the reward of admiration, by which actions become subservient to the goal of winning approval.`,
          `This motivating pattern persists in most adults to varying degrees, but with progressive maturity, the pattern becomes internalised, and self-reward occurs by virtue of the authority of internalised parental figures and standards.`,
        ],
      },
      {
        heading: "Why it's still fragile",
        paragraphs: [
          `The downside of pride is arrogance and denial, which block growth. Recovery from addictions is impossible because emotional problems are denied.`,
          `Pride, like anger and fear, is still a defensive posture due to its intrinsic vulnerability that requires its positions to be guarded and defended. Pride is gratifying, yet a block to moving on to the solid ground of courage, which lies beyond fear and vulnerability.`,
        ],
      },
      {
        heading: "How society shapes it",
        paragraphs: [
          `Pride is often dependent on social image and its expressions via possessions, publicity, title, and wealth. Social status and its symbols motivate subcultures, which have their own intrinsic earmarks of success.`,
          `Each subculture has its own ranking system and stratifications. These appear in nuances of roles and privileges, as well as responsibilities and expectations, with consequent rewards and obligations as a result of complex system motivators. Values can automatically accrue to certain activities and qualities, such as education, personality traits, and styles of behaviour and speech.`,
          `The social pressure of subcultures is quite strong and often determines the content of internalised behavioural patterns that define success or failure—and affect pride, self-esteem, and perceived social value.`,
          `The same behavioural style that leads to approval or success in one subculture may spell failure and rejection in another. "When in Rome, do as the Romans do."`,
        ],
      },
    ],
    translations: {
      ru: {
        title: "Гордость",
        frame: `Не тщеславие — самоценность, ещё занимающая форму у сравнения, прежде чем научилась стоять сама.`,
        personalFrame: `Это не тщеславие — ваша самоценность сейчас занимает форму у сравнения, прежде чем научилась стоять сама.`,
        signals: [
          { label: "Ощущается как", value: "подъём самоценности, привязанный к тому, что вы сделали или имеете." },
          { label: "Личность", value: "заботится об образе, мотивирована признанием, чувствительна к тому, что её обошли вниманием." },
          { label: "Проявление в обществе", value: "то, что движет культурой достижений, демонстрацией статуса и большинством конкурентных сфер." },
          { label: "Уязвимо к", value: "тому, что при вызове ей сворачивается в защитную реакцию или высокомерие." },
        ],
        sections: [
          {
            heading: "Каково это на ощупь",
            paragraphs: [
              `Подъём самоценности, привязанный к чему-то конкретному — достижению, вещи, статусу. Ощущается хорошо, но заметно лучше в контрасте с тем, что было раньше, чем как нечто устойчивое само по себе.`,
            ],
          },
          {
            heading: "Для чего это",
            paragraphs: [
              `Исследование психолога Джессики Трейси (UBC Emotion & Self Lab) обнаружило то, что скрывает само слово: существуют две разные формы гордости, а не одна. Подлинная гордость — заслуженная, основанная на усилии, привязанная к тому, что вы действительно сделали, — измеримо повышает креативность и мотивирует продолжать. Высокомерная гордость — грандиозная, защитная, про доминирование, а не достижение — делает обратное. (Подробнее о её исследовании — в разделе «Откуда это взято».)`,
              `А значит, вопрос, который стоит задать, когда появляется гордость, — не чувствовать её или нет. А в которой из двух вы на самом деле стоите.`,
            ],
          },
          {
            heading: "Попробуйте прямо сейчас",
            paragraphs: [
              `В следующий раз, когда почувствуете гордость за что-то, попробуйте определить: она про усилие, которое вы действительно приложили, или про то, что об этом подумают другие люди. Ни один ответ не неверен — просто стоит знать, в котором вы стоите.`,
            ],
          },
          {
            heading: "В чём люди ошибаются",
            paragraphs: [
              `Высокомерная гордость — защитная, движимая эго — включается в тот момент, когда достижение ставят под вопрос, потому что вся конструкция что-то подпирала. Подлинная гордость не вздрагивает от вызова так же, потому что изначально не была настолько хрупкой.`,
            ],
          },
        ],
        deepDive: [
          {
            heading: "Об этом разделе",
            paragraphs: [
              `Остальная часть этого более глубокого материала следует собственному описанию этого состояния Дэвидом Р. Хокинсом из его книги *Сила против насилия* — это его система и его язык, а не независимо подтверждённая наука. Подробнее о его методологии и её ограничениях — в разделе «Откуда это взято».`,
            ],
          },
          {
            heading: "Откуда берётся это самоуважение",
            paragraphs: [
              `Этот уровень характеризуется ростом самоуважения, которое смягчает всю боль, испытанную на более низких уровнях сознания. Но ощущается хорошо только в контрасте с более низкими уровнями.`,
              `Самоуважение гордости опирается на раздутое и преувеличенное мнение, а не на реальность. Поэтому эго ищет подтверждения, которое покоится на ненадёжных основах мнения.`,
              `Гордость функционально полезна как временная самонаграда за успешное достижение, но ошибка возникает, когда эго полагает, что вознаграждается именно «я», а не само поведение. Это ведёт к поиску награды в виде восхищения, из-за чего действия становятся подчинены цели заслужить одобрение.`,
              `Этот мотивирующий паттерн сохраняется у большинства взрослых в разной степени, но с постепенным взрослением он интернализируется, и самонаграда происходит благодаря авторитету интернализированных родительских фигур и стандартов.`,
            ],
          },
          {
            heading: "Почему она всё ещё хрупка",
            paragraphs: [
              `Обратная сторона гордости — высокомерие и отрицание, блокирующие рост. Восстановление от зависимостей невозможно, потому что эмоциональные проблемы отрицаются.`,
              `Гордость, как гнев и страх, всё ещё остаётся защитной позицией из-за своей внутренней уязвимости, требующей, чтобы её позиции охранялись и защищались. Гордость приносит удовлетворение, но при этом блокирует переход на твёрдую почву смелости, лежащую за пределами страха и уязвимости.`,
            ],
          },
          {
            heading: "Как её формирует общество",
            paragraphs: [
              `Гордость часто зависит от социального образа и его выражений через имущество, публичность, титул и богатство. Социальный статус и его символы мотивируют субкультуры, у которых есть собственные врождённые признаки успеха.`,
              `У каждой субкультуры своя система ранжирования и расслоения. Они проявляются в нюансах ролей и привилегий, а также обязанностей и ожиданий, с соответствующими вознаграждениями и обязательствами как результатом сложных систем мотивации. Ценность может автоматически приписываться определённым видам деятельности и качествам, таким как образование, черты личности, стиль поведения и речи.`,
              `Социальное давление субкультур довольно сильно и часто определяет содержание интернализированных поведенческих паттернов, которые определяют успех или неудачу — и влияют на гордость, самоуважение и воспринимаемую социальную ценность.`,
              `Один и тот же стиль поведения, ведущий к одобрению или успеху в одной субкультуре, может означать провал и отвержение в другой. «В чужой монастырь со своим уставом не ходят».`,
            ],
          },
        ],
      },
    },
  },
  {
    slug: "anger",
    name: "anger",
    title: "Anger",
    score: 150,
    frame: `Anger is not pathology; it is the signal that a boundary has been crossed.`,
    personalFrame: `You're not broken right now — something crossed a boundary, and this is the signal telling you so.`,
    signals: [
      { label: "Feels like", value: "heat rising fast, a pull to push back or push through right now." },
      { label: "Personality", value: "quick to react, protective of boundaries, impatient with unfairness." },
      { label: "Used in society", value: "fuel for protest, self-defense, and change — or a tool of intimidation when it isn't examined." },
      { label: "Prone to", value: "outbursts if it has no outlet; resentment or passive aggression if it's swallowed instead." },
    ],
    sections: [
      {
        heading: "What this feels like",
        paragraphs: [
          `A rush of heat, a tightening in the chest or jaw, an urge to correct something immediately. It's sharp and situational, and it usually knows exactly what it's about. Left unexpressed for long enough, it can curdle into something quieter and more permanent — a running list of grievances, replayed on a loop, aimed at people who aren't even in the room anymore.`,
        ],
      },
      {
        heading: "What it's for",
        paragraphs: [
          `Muhammad Ali's boxing career began, by his own account, with a stolen bicycle: a twelve-year-old too angry to let it go, taken to a gym by a police officer who told him he'd better learn to fight before he tried to find whoever took it. The anger didn't disappear. It became a career.`,
          `James Baldwin was more direct about it as a working writer: "To be a Negro in this country and to be relatively conscious is to be in a state of rage almost all the time" — and he used that rage as material, not something to manage around. Anger given a direction is just force with somewhere to go.`,
        ],
      },
      {
        heading: "Try this now",
        paragraphs: [
          `Give it somewhere physical to go before you try to decide what it means. A hard walk, a heavy bag, twenty minutes of real effort — anger moves fastest through the body, not through more thinking about who's right.`,
        ],
      },
      {
        heading: "Where people get it wrong",
        paragraphs: [
          `Anger that never gets expressed doesn't go away — it tends to leak out sideways, at whoever's nearest rather than whoever actually caused it, or turn inward as resentment that quietly outlasts the original reason. Years of that is its own kind of exhausting: a body kept in a low simmer that never gets to finish what it started.`,
        ],
      },
    ],
    deepDive: [
      {
        heading: "About this section",
        paragraphs: [
          `The rest of this deeper read follows David R. Hawkins' own account of this state from his book *Power vs. Force* — his framework and his language, not independently verified science. See "Where this comes from" for more on his methodology and its limits.`,
        ],
      },
      {
        heading: "What it can do",
        paragraphs: [
          `Anger can be a fulcrum by which the oppressed are eventually catapulted to freedom. Anger over social injustice, victimization, and inequality has energized great movements that have led to major changes in the structure of society.`,
        ],
      },
      {
        heading: "What it usually becomes",
        paragraphs: [
          `Anger, however, expresses itself most often as resentment or as a lifestyle that is exemplified by irritable, explosive people who are oversensitive to slights and become "injustice collectors."`,
          `Frustration results from exaggerating the importance of desires. Anger easily leads to hatred, which has an erosive effect on all areas of a person's life.`,
          `Anger as an emotion is prevalent throughout society as a transient reaction, but anger as a level of consciousness is indicative of dominance by a pervasive, negative energy field that is reflective of the ego's distorted perceptions.`,
        ],
      },
      {
        heading: "The ego underneath it",
        paragraphs: [
          `A primary aspect of the distortion is a narcissistically oriented worldview and expectations that the world should cater and conform to one's wishes and perceptions. The result is chronic frustration and resentment.`,
          `The narcissistic ego is competitive and prone to feel slighted and insulted with even minimal provocation, as the core of the ego sees itself as sovereignty that expects priority, agreement, or compliance with its expectations, as well as satisfaction of its wants and proclivities.`,
          `A major defense of the ego is to project its superego onto the outer world and then live in fear of it in the form of fears of vengeance. Thus, the angry ego fears truth, honesty, and balance, which would reduce its dominance.`,
          `The angry person's ego sees relationships as a battleground for dominance, control, and primitive attitudes and actions. The ego at this level extracts pleasure from negativity.`,
          `To people who feel inwardly weak and vulnerable, anger seems like strength, whereas to strong people, anger is seen as a primitive, vulgar weakness that is disliked and viewed as immature and embarrassing.`,
        ],
      },
      {
        heading: "What it's standing in for",
        paragraphs: [
          `In and of itself, anger is merely a subjective emotion that does not actually accomplish anything in the world as would the use of reason and restraint.`,
          `Anger is used by the ego as a substitute for courage.`,
        ],
      },
    ],
    translations: {
      ru: {
        title: "Гнев",
        frame: `Гнев — не патология; это сигнал о том, что нарушена граница.`,
        personalFrame: `Вы сейчас не сломаны — что-то нарушило границу, и это сигнал, который сообщает вам об этом.`,
        signals: [
          { label: "Ощущается как", value: "быстро поднимающийся жар, тяга дать отпор или прорваться прямо сейчас." },
          { label: "Личность", value: "быстро реагирует, защищает границы, нетерпелива к несправедливости." },
          { label: "Проявление в обществе", value: "топливо для протеста, самозащиты и перемен — или инструмент запугивания, если его не осмыслить." },
          { label: "Уязвимо к", value: "вспышкам, если нет выхода; обиде или пассивной агрессии, если его проглатывают вместо этого." },
        ],
        sections: [
          {
            heading: "Каково это на ощупь",
            paragraphs: [
              `Прилив жара, стеснение в груди или челюсти, порыв немедленно что-то исправить. Он резкий и ситуативный и обычно точно знает, о чём он. Оставаясь невыраженным достаточно долго, он может свернуться в нечто более тихое и постоянное — постоянный список обид, прокручиваемый по кругу и направленный на людей, которых уже даже нет в комнате.`,
            ],
          },
          {
            heading: "Для чего это",
            paragraphs: [
              `Боксёрская карьера Мухаммеда Али началась, по его собственному рассказу, с украденного велосипеда: двенадцатилетний мальчик был слишком зол, чтобы это забыть, и полицейский, отведший его в зал, сказал, что ему лучше сперва научиться драться, прежде чем пытаться найти того, кто украл велосипед. Гнев не исчез. Он стал карьерой.`,
              `Джеймс Болдуин был прямее об этом как работающий писатель: «Быть негром в этой стране и быть при этом относительно сознательным — значит почти всё время находиться в состоянии ярости» — и он использовал эту ярость как материал, а не как то, чем нужно управлять. Гнев, получивший направление, — это просто сила, которой есть куда идти.`,
            ],
          },
          {
            heading: "Попробуйте прямо сейчас",
            paragraphs: [
              `Дайте ему физический выход, прежде чем пытаться решить, что он значит. Тяжёлая прогулка, боксёрская груша, двадцать минут настоящего усилия — гнев быстрее всего проходит через тело, а не через ещё больше размышлений о том, кто прав.`,
            ],
          },
          {
            heading: "В чём люди ошибаются",
            paragraphs: [
              `Гнев, который никогда не выражается, не исчезает — он обычно просачивается наружу сбоку, на того, кто оказался ближе, а не на того, кто действительно его вызвал, или уходит внутрь как обида, которая тихо переживает изначальную причину. Годы этого — свой собственный вид изнурения: тело, годами удерживаемое на медленном огне, которому так и не дали закончить то, что оно начало.`,
            ],
          },
        ],
        deepDive: [
          {
            heading: "Об этом разделе",
            paragraphs: [
              `Остальная часть этого более глубокого материала следует собственному описанию этого состояния Дэвидом Р. Хокинсом из его книги *Сила против насилия* — это его система и его язык, а не независимо подтверждённая наука. Подробнее о его методологии и её ограничениях — в разделе «Откуда это взято».`,
            ],
          },
          {
            heading: "Что он может дать",
            paragraphs: [
              `Гнев может стать рычагом, которым угнетённых в итоге катапультирует к свободе. Гнев по поводу социальной несправедливости, виктимизации и неравенства заряжал энергией великие движения, приведшие к крупным изменениям в устройстве общества.`,
            ],
          },
          {
            heading: "Чем он обычно становится",
            paragraphs: [
              `Однако гнев чаще всего выражается как обида или как образ жизни, воплощённый в раздражительных, взрывных людях, чрезмерно чувствительных к пренебрежению и становящихся «коллекционерами несправедливостей».`,
              `Разочарование возникает из преувеличения важности желаний. Гнев легко перерастает в ненависть, которая разъедающе действует на все области жизни человека.`,
              `Гнев как эмоция широко распространён в обществе как временная реакция, но гнев как уровень сознания указывает на доминирование пронизывающего негативного энергетического поля, отражающего искажённые восприятия эго.`,
            ],
          },
          {
            heading: "Эго под ним",
            paragraphs: [
              `Главный аспект этого искажения — нарциссически ориентированное мировоззрение и ожидание, что мир должен подстраиваться под чужие желания и восприятия. Результат — хроническое разочарование и обида.`,
              `Нарциссическое эго конкурентно и склонно чувствовать себя оскорблённым и уязвлённым даже при минимальной провокации, поскольку в основе эго лежит представление о себе как о суверенитете, ожидающем приоритета, согласия или подчинения своим ожиданиям, а также удовлетворения своих желаний и склонностей.`,
              `Главная защита эго — спроецировать своё супер-эго на внешний мир, а затем жить в страхе перед ним в форме страха возмездия. Так разгневанное эго боится истины, честности и равновесия, которые уменьшили бы его господство.`,
              `Эго разгневанного человека видит отношения как поле битвы за доминирование, контроль, примитивные установки и действия. Эго на этом уровне извлекает удовольствие из негативности.`,
              `Людям, чувствующим себя внутренне слабыми и уязвимыми, гнев кажется силой, тогда как для сильных людей гнев видится примитивной, вульгарной слабостью, которая не нравится и воспринимается как незрелая и постыдная.`,
            ],
          },
          {
            heading: "Чем он подменяет собой",
            paragraphs: [
              `Сам по себе гнев — лишь субъективная эмоция, которая на деле не достигает в мире ничего из того, чего достигли бы разум и сдержанность.`,
              `Эго использует гнев как заменитель смелости.`,
            ],
          },
        ],
      },
    },
  },
  {
    slug: "desire",
    name: "desire",
    title: "Desire",
    score: 125,
    frame: `Not greed — the mind reaching outward to fill a lack it hasn't yet located within.`,
    personalFrame: `This isn't greed — it's you reaching outward for something, before you've located the actual lack within.`,
    signals: [
      { label: "Feels like", value: "pulled toward something, restless until you have it." },
      { label: "Personality", value: "driven, ambitious, has trouble sitting still with unmet wants." },
      { label: "Used in society", value: "the engine behind entrepreneurship, invention, and most consumer advertising." },
      { label: "Prone to", value: "escalating into craving, where the wanting itself becomes the addiction rather than the thing wanted." },
    ],
    sections: [
      {
        heading: "What this feels like",
        paragraphs: [
          `A pull toward something specific, with restlessness underneath until you have it. Sharper than a preference — this is wanting that organizes your attention around itself.`,
        ],
      },
      {
        heading: "What it's for",
        paragraphs: [
          `Nikola Tesla described his own desire almost as a physical force: "When natural inclination develops into a passionate desire, one advances towards his goal in seven-league boots." He also described what it cost him — desire strong enough to make him "forget food, sleep, friends, love, everything." Worth being honest about that too: desire is an engine, and an engine with no destination just burns fuel.`,
          `The difference between Tesla's desire and addiction isn't the intensity. It's whether the wanting is pointed at something that's actually yours to build, or at something that was only ever going to numb the wanting itself for an hour.`,
        ],
      },
      {
        heading: "Try this now",
        paragraphs: [
          `Pick the desire that's loudest right now and ask what it's actually in service of — is this yours to build, or is it a stand-in for something you're avoiding feeling? Both are real desires. Only one tends to satisfy once you get it.`,
        ],
      },
      {
        heading: "Where people get it wrong",
        paragraphs: [
          `Desire becomes addiction exactly at the point where satisfying it stops being the goal and avoiding the discomfort of wanting becomes the goal instead. Tesla's desire built things. Desire that's only trying to numb itself just needs more of itself, endlessly.`,
        ],
      },
    ],
    deepDive: [
      {
        heading: "About this section",
        paragraphs: [
          `The rest of this deeper read follows David R. Hawkins' own account of this state from his book *Power vs. Force* — his framework and his language, not independently verified science. See "Where this comes from" for more on his methodology and its limits.`,
        ],
      },
      {
        heading: "What it moves us toward",
        paragraphs: [
          `Desire motivates vast areas of human activity, including the economy. Advertisers play on desires to program us with needs linked to instinctual drives. It is linked to jealousy and greed.`,
          `Desire moves us to expend great effort to achieve goals or obtain rewards. The desire for money, prestige, or power runs the lives of many of those who have risen above fear as their predominant life motive.`,
          `The desire for power and control over others is a common expression of this level of consciousness.`,
          `The desire for sexual approval has produced the huge cosmetics and fashion industries that extol glamour and allure.`,
        ],
      },
      {
        heading: "Where it becomes craving",
        paragraphs: [
          `Desire is also the level of addictions, wherein desire becomes a craving more important than life itself. The victims of desire may actually be unaware of the basis of their motives.`,
          `Desire has to do with acquisition and accumulation, but satisfaction of one desire is merely replaced by the unsatisfied desire for something else, so the acquisition is endless.`,
          `The consequence of a life of endless pursuit and anxiety about the acquisition of externalised, artificial sources of satisfaction is increased exposure to fear of loss.`,
          `Cravings can be continuous due to a failure of the internal satisfaction mechanism, by which there never seems to be enough, and acquisition becomes a lifestyle of endless pursuit.`,
        ],
      },
      {
        heading: "What it's actually about",
        paragraphs: [
          `Social craving is often compensatory to self-doubt and low self-esteem. Social expressions of needing and wanting may attach to external concepts, political positions, and the need to control others for the sought-after feelings of importance and public attention.`,
          `The basic problem with this level of consciousness is the inner feeling of lack that results in chronic dissatisfaction. The ego becomes infatuated with its own projections of attractiveness onto external objects, without recognising the value of what it already possesses.`,
          `The ego's inner anxiety about fulfillment of its projected needs leads to an insatiable greed for power and control over others that emerges, in its most expanded form, as a desire to dominate the entire world.`,
        ],
      },
    ],
    translations: {
      ru: {
        title: "Желание",
        frame: `Не жадность — ум, тянущийся вовне, чтобы заполнить нехватку, которую он ещё не нашёл внутри.`,
        personalFrame: `Это не жадность — вы тянетесь к чему-то вовне, ещё не обнаружив настоящую нехватку внутри.`,
        signals: [
          { label: "Ощущается как", value: "тяга к чему-то, беспокойство, пока этого не получишь." },
          { label: "Личность", value: "целеустремлённая, амбициозная, трудно усидеть на месте с неудовлетворёнными желаниями." },
          { label: "Проявление в обществе", value: "двигатель предпринимательства, изобретений и большинства потребительской рекламы." },
          { label: "Уязвимо к", value: "перерастанию в тягу, где само желание становится зависимостью, а не желаемая вещь." },
        ],
        sections: [
          {
            heading: "Каково это на ощупь",
            paragraphs: [
              `Тяга к чему-то конкретному, с беспокойством под ней, пока это не получено. Острее, чем предпочтение, — это желание, организующее вокруг себя всё ваше внимание.`,
            ],
          },
          {
            heading: "Для чего это",
            paragraphs: [
              `Никола Тесла описывал своё желание почти как физическую силу: «Когда естественная склонность перерастает в страстное желание, человек продвигается к своей цели семимильными шагами». Он также описывал, чего это ему стоило — желание, достаточно сильное, чтобы заставить его «забыть еду, сон, друзей, любовь, всё». Стоит быть честным и насчёт этого: желание — двигатель, а двигатель без пункта назначения просто сжигает топливо.`,
              `Разница между желанием Теслы и зависимостью не в интенсивности. Она в том, направлено ли желание на то, что действительно ваше и что можно построить, или на то, что лишь на час притупит само желание.`,
            ],
          },
          {
            heading: "Попробуйте прямо сейчас",
            paragraphs: [
              `Выберите желание, которое сейчас звучит громче всего, и спросите, чему оно на самом деле служит — это ваше, что можно построить, или заместитель того, что вы избегаете почувствовать? Оба желания настоящие. Только одно из них склонно удовлетворять, когда вы его получаете.`,
            ],
          },
          {
            heading: "В чём люди ошибаются",
            paragraphs: [
              `Желание становится зависимостью именно в той точке, где удовлетворение перестаёт быть целью, а целью становится избегание дискомфорта самого желания. Желание Теслы строило вещи. Желание, которое лишь пытается притупить себя, бесконечно требует ещё себя самого.`,
            ],
          },
        ],
        deepDive: [
          {
            heading: "Об этом разделе",
            paragraphs: [
              `Остальная часть этого более глубокого материала следует собственному описанию этого состояния Дэвидом Р. Хокинсом из его книги *Сила против насилия* — это его система и его язык, а не независимо подтверждённая наука. Подробнее о его методологии и её ограничениях — в разделе «Откуда это взято».`,
            ],
          },
          {
            heading: "К чему оно нас движет",
            paragraphs: [
              `Желание мотивирует огромные области человеческой деятельности, включая экономику. Рекламодатели играют на желаниях, программируя нас потребностями, связанными с инстинктивными влечениями. Оно связано с завистью и жадностью.`,
              `Желание побуждает нас прилагать огромные усилия для достижения целей или получения наград. Желание денег, престижа или власти управляет жизнью многих из тех, кто поднялся над страхом как основным жизненным мотивом.`,
              `Желание власти и контроля над другими — распространённое проявление этого уровня сознания.`,
              `Желание сексуального одобрения породило огромные индустрии косметики и моды, восхваляющие гламур и притягательность.`,
            ],
          },
          {
            heading: "Где оно превращается в тягу",
            paragraphs: [
              `Желание — это также уровень зависимостей, где желание становится тягой, более важной, чем сама жизнь. Жертвы желания могут даже не осознавать основу своих мотивов.`,
              `Желание связано с приобретением и накоплением, но удовлетворение одного желания просто заменяется неудовлетворённым желанием чего-то другого, так что приобретение бесконечно.`,
              `Следствие жизни в бесконечной погоне и тревоге по поводу приобретения внешних, искусственных источников удовлетворения — усиленное подвержение страху потери.`,
              `Тяга может быть постоянной из-за сбоя внутреннего механизма удовлетворения, из-за которого никогда не кажется достаточно, и приобретение становится образом жизни бесконечной погони.`,
            ],
          },
          {
            heading: "О чём это на самом деле",
            paragraphs: [
              `Социальная тяга часто компенсирует сомнение в себе и низкую самооценку. Социальные выражения нужды и желания могут привязываться к внешним понятиям, политическим позициям и потребности контролировать других ради желанных чувств значимости и общественного внимания.`,
              `Основная проблема этого уровня сознания — внутреннее чувство нехватки, приводящее к хронической неудовлетворённости. Эго увлекается собственными проекциями привлекательности на внешние объекты, не признавая ценности того, чем оно уже обладает.`,
              `Внутренняя тревога эго по поводу удовлетворения его спроецированных потребностей ведёт к ненасытной жадности к власти и контролю над другими, которая в своей наиболее развёрнутой форме проявляется как желание господствовать над всем миром.`,
            ],
          },
        ],
      },
    },
  },
  {
    slug: "fear",
    name: "fear",
    title: "Fear",
    score: 100,
    frame: `Fear is not weakness; it is intelligence about uncertainty.`,
    personalFrame: `You're not weak right now — you're just picking up real intelligence about something uncertain.`,
    signals: [
      { label: "Feels like", value: "tight, alert, wanting to avoid or escape something specific." },
      { label: "Personality", value: "cautious, scans for risk, prepares for the worst before it commits." },
      { label: "Used in society", value: "what keeps people out of genuinely dangerous situations — and what's exploited by anyone selling safety." },
      { label: "Prone to", value: "ballooning past the actual threat into generalized anxiety or avoidance." },
    ],
    sections: [
      {
        heading: "What this feels like",
        paragraphs: [
          `Tight and alert, focused on avoiding or escaping something specific. Useful fear points clearly at a real risk. The unhelpful kind shows up the same way, but about something that isn't actually happening.`,
        ],
      },
      {
        heading: "What it's for",
        paragraphs: [
          `Susan Jeffers built an entire practice around one reframe: "Some fear is instinctual and healthy and keeps us alert to trouble. The rest... is inappropriate and destructive." Her point wasn't to eliminate fear — her book is called "Feel the Fear and Do It Anyway" for a reason. It's to stop treating every instance of it as a stop sign.`,
          `The actual skill is sorting: is this fear telling you something true about the situation, or is it just an old alarm going off out of habit? One is worth listening to. The other is worth noticing and moving through anyway.`,
        ],
      },
      {
        heading: "Try this now",
        paragraphs: [
          `Ask, specifically: is this fear about something happening right now, or about something that might happen? If it's the second one, name the actual next physical action you'd take anyway, and take it — per Jeffers, feel the fear and do it anyway.`,
        ],
      },
      {
        heading: "Where people get it wrong",
        paragraphs: [
          `Treating every instance of fear as a stop sign means avoiding things that were never actually dangerous, just unfamiliar. The skill isn't eliminating fear — it's telling the useful kind from the kind that's just an old alarm still going off.`,
        ],
      },
    ],
    deepDive: [
      {
        heading: "About this section",
        paragraphs: [
          `The rest of this deeper read follows David R. Hawkins' own account of this state from his book *Power vs. Force* — his framework and his language, not independently verified science. See "Where this comes from" for more on his methodology and its limits.`,
        ],
      },
      {
        heading: "How it runs the show",
        paragraphs: [
          `Fear of danger runs much of the world, spurring on endless activity. Fear of enemies, old age, or death is a basic motivator in the lives of most people.`,
          `Fear makes one numb and limits the ability to think and act rationally.`,
          `The world appears hazardous, filled with traps. Fear is the favoured official tool for control by oppressive agencies. The proliferation of fears is as limitless as the human imagination.`,
          `Fearful thinking can balloon into paranoia or generate neurotic defensive structures, becoming a contagious social trend.`,
          `Fear limits the growth of the personality and leads to inhibition.`,
          `The fearful seek strong leaders who appear to have conquered their fear to lead them out of its slavery.`,
        ],
      },
      {
        heading: "The useful kind vs. the costly kind",
        paragraphs: [
          `Fear as caution serves survival, in contrast to irrational fears, which—as a prevailing mode of behaviour—become uncomfortable and decrease the level of consciousness.`,
        ],
      },
      {
        heading: "Working with it",
        paragraphs: [
          `To let go of fear, one can start by looking at the universe as loving instead of evil.`,
          `Another way of conquering fear is to let it be, and feel it in the body. Ask yourself: where does it feel, and how does it feel?`,
        ],
      },
    ],
    translations: {
      ru: {
        title: "Страх",
        frame: `Страх — не слабость; это разум, разбирающийся с неопределённостью.`,
        personalFrame: `Вы не слабы прямо сейчас — вы просто получаете настоящую информацию о чём-то неопределённом.`,
        signals: [
          { label: "Ощущается как", value: "напряжённо, настороженно, хочется избежать или сбежать от чего-то конкретного." },
          { label: "Личность", value: "осторожная, сканирует риски, готовится к худшему прежде, чем взять на себя обязательства." },
          { label: "Проявление в обществе", value: "то, что удерживает людей от по-настоящему опасных ситуаций — и то, чем пользуется любой, кто продаёт безопасность." },
          { label: "Уязвимо к", value: "раздуванию за пределы реальной угрозы в генерализованную тревогу или избегание." },
        ],
        sections: [
          {
            heading: "Каково это на ощупь",
            paragraphs: [
              `Напряжённо и настороженно, сосредоточено на том, чтобы избежать или сбежать от чего-то конкретного. Полезный страх ясно указывает на реальный риск. Бесполезный проявляется так же, но по поводу того, чего на самом деле не происходит.`,
            ],
          },
          {
            heading: "Для чего это",
            paragraphs: [
              `Сьюзан Джефферс построила целую практику вокруг одной переформулировки: «Одни страхи инстинктивны и полезны, они держат нас настороже перед опасностью. Остальные... неуместны и разрушительны». Её мысль была не в том, чтобы устранить страх — её книга не зря называется «Почувствуй страх и всё равно сделай это». Дело в том, чтобы перестать воспринимать каждый его случай как знак «стоп».`,
              `Настоящий навык — сортировка: говорит ли этот страх вам что-то истинное о ситуации, или это просто старая сигнализация, срабатывающая по привычке? Один стоит слушать. Другой стоит заметить и пройти сквозь него всё равно.`,
            ],
          },
          {
            heading: "Попробуйте прямо сейчас",
            paragraphs: [
              `Спросите конкретно: этот страх о чём-то, происходящем прямо сейчас, или о том, что может произойти? Если второе — назовите настоящее следующее физическое действие, которое вы бы всё равно предприняли, и сделайте его — по Джефферс, почувствуйте страх и всё равно сделайте это.`,
            ],
          },
          {
            heading: "В чём люди ошибаются",
            paragraphs: [
              `Воспринимать каждый случай страха как знак «стоп» означает избегать вещей, которые никогда на самом деле не были опасны, просто непривычны. Навык не в устранении страха — а в том, чтобы отличить полезный от того, что просто старая сигнализация, всё ещё срабатывающая.`,
            ],
          },
        ],
        deepDive: [
          {
            heading: "Об этом разделе",
            paragraphs: [
              `Остальная часть этого более глубокого материала следует собственному описанию этого состояния Дэвидом Р. Хокинсом из его книги *Сила против насилия* — это его система и его язык, а не независимо подтверждённая наука. Подробнее о его методологии и её ограничениях — в разделе «Откуда это взято».`,
            ],
          },
          {
            heading: "Как он управляет происходящим",
            paragraphs: [
              `Страх опасности управляет большей частью мира, подстёгивая бесконечную деятельность. Страх врагов, старости или смерти — базовый мотиватор в жизни большинства людей.`,
              `Страх делает человека оцепенелым и ограничивает способность мыслить и действовать рационально.`,
              `Мир кажется опасным, полным ловушек. Страх — излюбленный официальный инструмент контроля у репрессивных структур. Разрастание страхов так же безгранично, как человеческое воображение.`,
              `Тревожное мышление может раздуться до паранойи или породить невротические защитные структуры, становясь заразной социальной тенденцией.`,
              `Страх ограничивает рост личности и ведёт к скованности.`,
              `Испуганные ищут сильных лидеров, которые, как кажется, победили собственный страх и способны вывести их из его рабства.`,
            ],
          },
          {
            heading: "Полезный вид против затратного",
            paragraphs: [
              `Страх как осторожность служит выживанию, в отличие от иррациональных страхов, которые — как преобладающий способ поведения — становятся некомфортными и снижают уровень сознания.`,
            ],
          },
          {
            heading: "Работа с ним",
            paragraphs: [
              `Чтобы отпустить страх, можно начать с того, чтобы смотреть на вселенную как на любящую, а не злую.`,
              `Другой способ победить страх — позволить ему быть и почувствовать его в теле. Спросите себя: где это ощущается и как это ощущается?`,
            ],
          },
        ],
      },
    },
  },
  {
    slug: "grief",
    name: "grief",
    title: "Grief",
    score: 75,
    frame: `Not weakness — the honest cost of having valued something enough to feel its loss.`,
    personalFrame: `This isn't weakness — it's the honest cost of having valued something enough to feel losing it.`,
    signals: [
      { label: "Feels like", value: "heavy, tearful, pulled backward toward what's gone." },
      { label: "Personality", value: "reflective, prone to withdrawing, more attuned to loss than to what's still present." },
      { label: "Used in society", value: "rarely given enough time — most workplaces and even families expect it to resolve faster than it does." },
      { label: "Prone to", value: "becoming chronic if there's nowhere safe to actually feel it, curdling into a permanent low mood." },
    ],
    sections: [
      {
        heading: "What this feels like",
        paragraphs: [
          `Heavy, often tearful, pulled backward toward whatever's gone. It doesn't move in a straight line — it comes in waves that don't follow a schedule, no matter how much you'd like them to.`,
        ],
      },
      {
        heading: "What it's for",
        paragraphs: [
          `C.S. Lewis, writing after his wife's death, discovered something he hadn't expected: "Grief turns out to be not a state but a process." It wasn't a wound to close as fast as possible — it kept moving, on its own schedule, whether he cooperated or not.`,
          `His conclusion is the one worth keeping: "Bereavement is a universal and integral part of our experience of love." Grief isn't evidence something is wrong with you. It's the exact size of what you were willing to care about. Kübler-Ross's stages exist for the same reason — not a checklist to complete, but a way of naming what's actually happening so it doesn't feel like it's happening for no reason. (See "Where this comes from" for more on her work.)`,
        ],
      },
      {
        heading: "Try this now",
        paragraphs: [
          `Let this round of it be exactly as long as it needs to be, without a deadline attached. If a specific memory is surfacing, let it finish playing rather than pushing it away — Lewis found the process moved faster once he stopped trying to shortcut it.`,
        ],
      },
      {
        heading: "Where people get it wrong",
        paragraphs: [
          `Treating grief as a malfunction to fix quickly usually just delays it — it tends to resurface later, often at a worse time, in a less recognizable shape. Grief isn't evidence something is wrong with you. It's the accurate size of what you were willing to care about.`,
        ],
      },
    ],
    deepDive: [
      {
        heading: "About this section",
        paragraphs: [
          `The rest of this deeper read follows David R. Hawkins' own account of this state from his book *Power vs. Force* — his framework and his language, not independently verified science. See "Where this comes from" for more on his methodology and its limits.`,
        ],
      },
      {
        heading: "Why it lingers",
        paragraphs: [
          `Most people have experienced it for periods of time, but those who remain at this level live a life of constant regret and depression, which makes them feel like a loser and accept failure as part of their lifestyle. This often results in the loss of jobs, friends, family, opportunities, as well as money and health.`,
          `In grief, one sees sadness everywhere—everything seems miserable and grim.`,
          `Grief carries more energy than apathy does, even though it doesn't feel that way. In Hawkins' clinical observations, someone who had gone numb and withdrawn started to reconnect with life around the same time they were able to cry again — grief moving through, rather than around, someone.`,
        ],
      },
      {
        heading: "Where happiness actually comes from",
        paragraphs: [
          `The universality of the experience is due to the structure and nature of the ego, which misperceives the source of happiness as external or emotional and imbues it with specialness. In reality, the only source of happiness is from within, and its mechanism is intrapsychic and internal.`,
          `Society collectively assumes that certain conditions, objects, or qualities are valuable, while in reality, the value is always in the eyes of the beholder and is never intrinsic to the desired object or person itself.`,
          `It is possible to evolve spiritually so as to become relatively immune to grief—to realise that the source of happiness originates from within and is not dependent on externals.`,
          `If the source of happiness is acquired through ego mechanisms, objects, qualities, or relationships become overvalued by virtue of the mechanism of attachment.`,
        ],
      },
      {
        heading: "The mechanics of loss",
        paragraphs: [
          `Fear of loss contributes to dependent attachments, as well as materiality or social attributes such as money and fame.`,
          `A loss at first is an unwelcome event because it is disruptive and emotionally intrusive. The initial response may be shock, resentment, disbelief. Processing the crisis is helped by focusing on certain inner realities and transcending their limitations.`,
          `Disruption of life by the unexpected also creates anxiety at the forced readjustment, which may require major decision-making. Suffering and emotional pain result largely from resistance to what is and what could be. Its cure lies in surrender, acceptance, and trust that everything that happens is for the highest good.`,
          `The source of pain is not the belief system itself, but one's attachment to it and the inflation of its imaginary value. The inner processing of attachments is dependent on the exercise of the will, which alone has the power to surrender.`,
        ],
      },
      {
        heading: "Letting the ownership loosen",
        paragraphs: [
          `Grief has to do with loss, and loss implies prior ownership and a special relationship. The idea of "mine" or "my" denotes a unique contextualisation by which a separate "I" is magically bonded, in fantasy, to an "it" or a "you", and thereby to some quality, possession, or person. For example, a watch is merely an object, but with the claim of ownership, it is now imbued with a unique, special quality called "mine".`,
          `The emotional charge can be loosened by realising that everything actually belongs to the universe at large. Ownership in human terms is a transitory specialness, and value and worth exist only in perception, conceptualisation, and legalities.`,
        ],
      },
    ],
    translations: {
      ru: {
        title: "Горе",
        frame: `Не слабость — честная цена того, что вы ценили что-то достаточно, чтобы почувствовать его утрату.`,
        personalFrame: `Это не слабость — это честная цена того, что вы ценили что-то достаточно, чтобы почувствовать его потерю.`,
        signals: [
          { label: "Ощущается как", value: "тяжело, со слезами, тянет назад к тому, чего больше нет." },
          { label: "Личность", value: "склонна к рефлексии, склонна замыкаться, больше настроена на потерю, чем на то, что ещё присутствует." },
          { label: "Проявление в обществе", value: "редко получает достаточно времени — большинство рабочих мест и даже семьи ждут, что оно разрешится быстрее, чем это происходит." },
          { label: "Уязвимо к", value: "тому, чтобы стать хроническим, если негде по-настоящему его прочувствовать, свернувшись в постоянно пониженное настроение." },
        ],
        sections: [
          {
            heading: "Каково это на ощупь",
            paragraphs: [
              `Тяжело, часто со слезами, тянет назад к тому, чего больше нет. Оно не движется по прямой линии — приходит волнами, не следующими расписанию, как бы вам этого ни хотелось.`,
            ],
          },
          {
            heading: "Для чего это",
            paragraphs: [
              `К. С. Льюис, писавший после смерти жены, обнаружил то, чего не ожидал: «Горе оказывается не состоянием, а процессом». Это была не рана, которую нужно закрыть как можно быстрее, — оно продолжало двигаться, по собственному расписанию, сотрудничал он с ним или нет.`,
              `Его вывод стоит запомнить: «Утрата — универсальная и неотъемлемая часть нашего опыта любви». Горе — не свидетельство того, что с вами что-то не так. Это точный размер того, о чём вы были готовы заботиться. Стадии Кюблер-Росс существуют по той же причине — не чек-лист для выполнения, а способ назвать происходящее, чтобы оно не ощущалось происходящим без причины. (Подробнее о её работе — в разделе «Откуда это взято».)`,
            ],
          },
          {
            heading: "Попробуйте прямо сейчас",
            paragraphs: [
              `Позвольте этому кругу горя длиться ровно столько, сколько нужно, без привязанного дедлайна. Если всплывает конкретное воспоминание, дайте ему доиграть до конца, а не отталкивайте его — Льюис обнаружил, что процесс шёл быстрее, когда он переставал пытаться его сократить.`,
            ],
          },
          {
            heading: "В чём люди ошибаются",
            paragraphs: [
              `Обращение с горем как с поломкой, которую нужно быстро починить, обычно просто откладывает его — оно склонно всплывать позже, часто в худший момент, в менее узнаваемой форме. Горе — не свидетельство того, что с вами что-то не так. Это точный размер того, о чём вы были готовы заботиться.`,
            ],
          },
        ],
        deepDive: [
          {
            heading: "Об этом разделе",
            paragraphs: [
              `Остальная часть этого более глубокого материала следует собственному описанию этого состояния Дэвидом Р. Хокинсом из его книги *Сила против насилия* — это его система и его язык, а не независимо подтверждённая наука. Подробнее о его методологии и её ограничениях — в разделе «Откуда это взято».`,
            ],
          },
          {
            heading: "Почему оно задерживается",
            paragraphs: [
              `Большинство людей испытывали его периодами, но те, кто остаётся на этом уровне, живут жизнью постоянного сожаления и депрессии, из-за чего чувствуют себя неудачниками и принимают провал как часть образа жизни. Это часто приводит к потере работы, друзей, семьи, возможностей, а также денег и здоровья.`,
              `В горе человек видит печаль повсюду — всё кажется несчастным и мрачным.`,
              `Горе несёт больше энергии, чем апатия, даже если так не ощущается. В клинических наблюдениях Хокинса человек, ставший оцепенелым и замкнутым, начинал вновь соединяться с жизнью примерно тогда же, когда снова становился способен плакать, — горе, проходящее сквозь человека, а не в обход него.`,
            ],
          },
          {
            heading: "Откуда на самом деле берётся счастье",
            paragraphs: [
              `Универсальность этого опыта объясняется структурой и природой эго, которое ошибочно воспринимает источник счастья как внешний или эмоциональный и наделяет его особостью. На деле единственный источник счастья — изнутри, и его механизм внутрипсихический и внутренний.`,
              `Общество коллективно предполагает, что определённые условия, объекты или качества ценны, тогда как на деле ценность всегда в глазах смотрящего и никогда не присуща самому желанному объекту или человеку.`,
              `Возможно духовно развиться настолько, чтобы стать относительно невосприимчивым к горю — осознать, что источник счастья происходит изнутри и не зависит от внешнего.`,
              `Если источник счастья приобретается через механизмы эго, объекты, качества или отношения становятся переоценёнными в силу механизма привязанности.`,
            ],
          },
          {
            heading: "Механика утраты",
            paragraphs: [
              `Страх потери способствует зависимым привязанностям, а также материальности или социальным атрибутам, таким как деньги и слава.`,
              `Потеря поначалу — нежеланное событие, потому что она разрушительна и эмоционально вторгается. Первоначальной реакцией может быть шок, обида, недоверие. Переживанию кризиса помогает сосредоточение на определённых внутренних реальностях и преодоление их ограничений.`,
              `Разрушение жизни неожиданным также порождает тревогу от вынужденной перестройки, которая может требовать серьёзных решений. Страдание и эмоциональная боль в основном возникают из сопротивления тому, что есть, и тому, что могло бы быть. Их лекарство — в сдаче, принятии и доверии, что всё происходящее — к высшему благу.`,
              `Источник боли — не сама система убеждений, а привязанность к ней и раздувание её воображаемой ценности. Внутренняя обработка привязанностей зависит от применения воли, которая одна обладает силой сдаться.`,
            ],
          },
          {
            heading: "Ослабление владения",
            paragraphs: [
              `Горе связано с потерей, а потеря подразумевает прежнее владение и особые отношения. Идея «моё» или «мой» обозначает уникальную контекстуализацию, посредством которой отдельное «я» магически связывается, в фантазии, с «этим» или «тобой», а через это — с каким-то качеством, имуществом или человеком. Например, часы — просто предмет, но с заявлением о владении они теперь наделяются уникальным, особым качеством, называемым «моё».`,
              `Эмоциональный заряд можно ослабить, осознав, что на самом деле всё принадлежит вселенной в целом. Владение в человеческих терминах — преходящая особость, а ценность и стоимость существуют только в восприятии, концептуализации и юридических нормах.`,
            ],
          },
        ],
      },
    },
  },
  {
    slug: "apathy",
    name: "apathy",
    title: "Apathy, Hatred",
    score: 50,
    frame: `Not laziness — exhaustion in a system that has stopped expecting help to arrive.`,
    personalFrame: `You're not lazy right now — you're exhausted, and some part of you has stopped expecting help to arrive.`,
    signals: [
      { label: "Feels like", value: "flat, distant, can't locate the energy to want anything." },
      { label: "Personality", value: "withdrawn, low initiative, may look lazy from outside but experiences it as having nothing left." },
      { label: "Used in society", value: "often mistaken for laziness or a character flaw rather than depletion." },
      { label: "Prone to", value: "lasting far longer than it needs to if mistaken for a personality trait instead of a temporary state." },
    ],
    sections: [
      {
        heading: "What this feels like",
        paragraphs: [
          `Flat and distant — the energy to want anything specific just isn't available. Not sad exactly, more like the machinery that would produce caring has gone quiet.`,
        ],
      },
      {
        heading: "What it's for",
        paragraphs: [
          `Kathleen Norris revived an old monastic word for this exact state: acedia, "the inability to care, even to the extent that you can't care that you don't care anymore." Her precise distinction: despair believes relief is possible but out of reach. Acedia has stopped believing relief is even worth wanting.`,
          `Eckhart Tolle's own account of the year before his awakening reads like a documented case of this — a "deep loathing of the world" so total it emptied out into something closer to nothing at all. What matters about his story isn't that it was pleasant. It's that it wasn't permanent, and naming it accurately was the first thing that moved.`,
        ],
      },
      {
        heading: "Try this now",
        paragraphs: [
          `Don't try to want something big yet — that's not available from here. Pick one small, physical, no-decision-required action (stand up, open a window, drink water) and just do that one thing, without expecting it to fix the flatness.`,
        ],
      },
      {
        heading: "Where people get it wrong",
        paragraphs: [
          `Apathy gets treated as laziness or a moral failing, which just adds shame on top of exhaustion. Norris's distinction is the useful one: this isn't refusing to care, it's a system that's stopped expecting help to arrive — and the way out starts with naming it accurately, not pushing harder.`,
        ],
      },
    ],
    deepDive: [
      {
        heading: "About this section",
        paragraphs: [
          `The rest of this deeper read follows David R. Hawkins' own account of this state from his book *Power vs. Force* — his framework and his language, not independently verified science. See "Where this comes from" for more on his methodology and its limits.`,
        ],
      },
      {
        heading: "How it's met by the world",
        paragraphs: [
          `Society often lacks sufficient motivation to be of any real help to cultures or individuals at this level and sees them as drains on resources.`,
        ],
      },
      {
        heading: "What's underneath it",
        paragraphs: [
          `Sloth is included as one of the seven deadly sins because it is a rejection of God's gift of life. In this state, there is no concern for the welfare of others or even appropriate concern for the quality of one's own life. The same attitude is then projected onto God, who is seen as rejecting, unavailable, and uncaring.`,
          `The feeling of worthlessness reinforces negative social attitudes and behaviours that result in poverty and low quality of life.`,
          `Responsibility is rejected and replaced by a chronic victim mentality that seeks to avoid the real issues by projecting the supposed source onto the external world, which is then comfortably blamed as being the "cause."`,
          `Apathetic periods may occur temporarily in almost anyone's life, while such a lifestyle becomes a denial of the value of life.`,
          `In what is seen as apathy, there is a strong internal resistance, often subtly disguised as pride and egotism, expressed as "I can't." The persistence of the ego is so strong that it frequently takes a mass catastrophe—such as war or an earthquake—to confront it to the degree that it is willing to surrender.`,
        ],
      },
    ],
    translations: {
      ru: {
        title: "Апатия, Ненависть",
        frame: `Не лень — истощение в системе, переставшей ждать, что помощь придёт.`,
        personalFrame: `Вы не ленивы прямо сейчас — вы истощены, и какая-то часть вас перестала ждать, что помощь придёт.`,
        signals: [
          { label: "Ощущается как", value: "плоско, отстранённо, не найти энергии, чтобы чего-то хотеть." },
          { label: "Личность", value: "замкнутая, с низкой инициативой, может выглядеть ленивой со стороны, но переживает это как отсутствие сил." },
          { label: "Проявление в обществе", value: "часто принимается за лень или изъян характера, а не за истощение." },
          { label: "Уязвимо к", value: "тому, чтобы длиться намного дольше необходимого, если её приняли за черту личности, а не временное состояние." },
        ],
        sections: [
          {
            heading: "Каково это на ощупь",
            paragraphs: [
              `Плоско и отстранённо — энергии, чтобы хотеть чего-то конкретного, просто нет. Не совсем грустно, скорее так, будто механизм, производящий заботу, затих.`,
            ],
          },
          {
            heading: "Для чего это",
            paragraphs: [
              `Кэтлин Норрис возродила старое монашеское слово именно для этого состояния: acedia — «неспособность заботиться, вплоть до того, что не можешь позаботиться о том, что тебе уже всё равно». Её точное различие: отчаяние верит, что облегчение возможно, но недостижимо. Acedia перестала верить, что облегчение вообще стоит желать.`,
              `Собственный рассказ Экхарта Толле о годе перед его пробуждением читается как документированный случай именно этого — «глубокое отвращение к миру», настолько полное, что опустошилось до чего-то, близкого к полному ничто. Важно в его истории не то, что это было приятно. Важно, что это не было постоянным, и что точное называние этого стало первым, что сдвинулось.`,
            ],
          },
          {
            heading: "Попробуйте прямо сейчас",
            paragraphs: [
              `Не пытайтесь пока хотеть чего-то большого — это сейчас недоступно. Выберите одно маленькое, физическое действие, не требующее решения (встать, открыть окно, выпить воды), и просто сделайте это одно, не ожидая, что оно исправит плоскость.`,
            ],
          },
          {
            heading: "В чём люди ошибаются",
            paragraphs: [
              `С апатией обращаются как с ленью или моральным изъяном, что просто добавляет стыд поверх истощения. Различие Норрис — полезное: это не отказ заботиться, это система, переставшая ждать, что помощь придёт, — и выход начинается с точного называния, а не с того, чтобы давить сильнее.`,
            ],
          },
        ],
        deepDive: [
          {
            heading: "Об этом разделе",
            paragraphs: [
              `Остальная часть этого более глубокого материала следует собственному описанию этого состояния Дэвидом Р. Хокинсом из его книги *Сила против насилия* — это его система и его язык, а не независимо подтверждённая наука. Подробнее о его методологии и её ограничениях — в разделе «Откуда это взято».`,
            ],
          },
          {
            heading: "Как мир встречает это",
            paragraphs: [
              `Обществу часто не хватает достаточной мотивации, чтобы оказать реальную помощь культурам или людям на этом уровне, и оно видит в них обузу для ресурсов.`,
            ],
          },
          {
            heading: "Что лежит под этим",
            paragraphs: [
              `Уныние включено в число семи смертных грехов, потому что это отказ от Божьего дара жизни. В этом состоянии нет заботы о благополучии других или даже уместной заботы о качестве собственной жизни. То же отношение затем проецируется на Бога, который видится отвергающим, недоступным и безучастным.`,
              `Чувство никчёмности подкрепляет негативные социальные установки и поведение, приводящие к бедности и низкому качеству жизни.`,
              `Ответственность отвергается и заменяется хронической менталитетом жертвы, стремящимся избежать настоящих проблем, проецируя предполагаемый источник на внешний мир, который затем удобно обвиняется как «причина».`,
              `Периоды апатии могут временно возникать почти в чьей угодно жизни, тогда как такой образ жизни становится отрицанием ценности жизни.`,
              `В том, что видится апатией, есть сильное внутреннее сопротивление, часто тонко замаскированное под гордость и эгоизм, выражаемое как «я не могу». Упорство эго настолько сильно, что зачастую требуется массовая катастрофа — такая как война или землетрясение, — чтобы противостоять ему настолько, чтобы оно было готово сдаться.`,
            ],
          },
        ],
      },
    },
  },
  {
    slug: "guilt",
    name: "guilt",
    title: "Guilt and Vindictive Hate",
    score: 30,
    frame: `Not evidence of being bad — an old standard the mind hasn't yet forgiven itself for missing.`,
    personalFrame: `This isn't evidence you're bad — it's an old standard you haven't forgiven yourself for missing yet.`,
    signals: [
      { label: "Feels like", value: "a specific, nameable weight about something you did." },
      { label: "Personality", value: "conscientious, replays past actions, quick to apologize." },
      { label: "Used in society", value: "used constructively as a moral compass — and abused as a tool for manipulation and control." },
      { label: "Prone to", value: "curdling into shame if unresolved — \"I did something bad\" sliding into \"I am something bad.\"" },
    ],
    sections: [
      {
        heading: "What this feels like",
        paragraphs: [
          `A specific, nameable weight about a particular thing you did — not a verdict on your whole character, just about that one action. It points somewhere exact, which is what makes it different from shame.`,
        ],
      },
      {
        heading: "What it's for",
        paragraphs: [
          `Tolstoy, at the height of his wealth and fame, was stopped cold by his own guilt — he catalogued it without softening: lying, cruelty, wasted years, harm done and excused. He hid a rope from himself for a while, afraid of what he might do with it. And then that same guilt became the engine of the entire second half of his life and work.`,
          `The distinction that matters: guilt says "I did something that didn't match what I actually value" — information you can act on. It's different from shame, which says something is wrong with you as a person. Guilt, taken seriously instead of run from, is usually just the beginning of a correction.`,
        ],
      },
      {
        heading: "Try this now",
        paragraphs: [
          `Name the actual value the action didn't match, out loud or on paper — not "I'm bad" but "I value honesty and I wasn't honest there." Then do one concrete thing the guilt is actually asking for: an apology, a repair, a changed decision next time.`,
        ],
      },
      {
        heading: "Where people get it wrong",
        paragraphs: [
          `Left unresolved, guilt tends to slide into shame — "I did something bad" becomes "I am bad," which is a much harder place to think clearly from. The fix isn't more guilt, it's the specific correction the guilt was pointing at.`,
        ],
      },
    ],
    deepDive: [
      {
        heading: "About this section",
        paragraphs: [
          `The rest of this deeper read follows David R. Hawkins' own account of this state from his book *Power vs. Force* — his framework and his language, not independently verified science. See "Where this comes from" for more on his methodology and its limits.`,
        ],
      },
      {
        heading: "What guilt actually is",
        paragraphs: [
          `Guilt is the consequence of the memory of regretted past actions as they are recalled. These can be transcended by recontextualisation — mistakes are the natural, impersonal consequence of learning and development, and therefore unavoidable.`,
          `Guilt is a learned behaviour with major psychological components.`,
          `A spiritual paradox is represented by the religious teaching of "hating sin," which merely expresses the very thing it deplores.`,
        ],
      },
      {
        heading: "How to work with it",
        paragraphs: [
          `To bypass guilt: feel compassion, forgiveness, and realise that individuals are limited, ignorant, and don't always understand what they do.`,
          `Guilt can be an educative emotion that arises as a warning not to repeat the same mistake. The past cannot be rewritten, but it can be recontextualised so as to become the source of constructive learning.`,
          `The literal, absolute definition of the word "sin" is "error."`,
          `Self-forgiveness is facilitated by humility and acceptance of limitations.`,
        ],
      },
      {
        heading: "Where it turns toxic",
        paragraphs: [
          `Excessive guilt and remorse are a disguised form of egotism, in which the self becomes blown up, exaggerated, and the hero of the tragedy — the negativity of which feeds the ego. Release from guilt requires surrender of this egotism, because the ego reenergises itself through the negativity.`,
          `"I should have known better" is another egoic position that brings in the hypothetical, which is always fallacious. Wallowing in guilt is feeding the ego and is an indulgence.`,
          `A hypertrophied superego can be the source of excessive guilt. When projected onto others, it justifies vindictiveness in extreme forms as revenge against the "evil" enemy. This rationalises killing others as their being "deserving" of death. The worst ravages of humanity have often been done in the name of God — the classic Luciferic inversion of good and evil.`,
          `God is not a sadist, so self-degradation or self-punishment serves neither God nor one's fellow humans.`,
        ],
      },
      {
        heading: "The deeper mechanics",
        paragraphs: [
          `In psychological terms, the source of guilt is the superego, a concept named by Freud (see "Where this comes from" for more) — the part of the mind comprised of introjected judgments, points of view, and learned content.`,
          `Reluctance to forgive is a consequence of the illusion that others do not "deserve" it. In reality, it is the forgiver — not the forgiven — who benefits the most.`,
          `Forgiveness cannot be done by the ego/mind because it lacks the necessary power when caught up in the energy field of hate, which calibrates at only 30. The transformative source of power cannot originate from the mind or the personality called the personal "I." The necessary power resides in the nonlinear quality of consciousness termed the "will."`,
          `Guilt-ridden cultures commonly have a negative view of God as judgmental, vindictive, angry, and punitive — seen through natural disasters contextualised as punishment for wickedness.`,
          `The public often expresses concern that the guilty might go unpunished. Anyone familiar with the reality of consciousness realises that no such thing is possible. Everyone is accountable to the universe and is subject to Divine Justice by the very dynamics of the universe itself. There are no accidents in the universe.`,
        ],
      },
      {
        heading: "Coming back to center",
        paragraphs: [
          `Personal past history represents the best that one could have done then, under the given circumstances — which included one's perceptions and emotional-mental states at the time. Every given moment includes limitation. What we were is not what we are now. Mistakes are intrinsic to the learning process, which is the fate of the human condition itself.`,
          `In the long run, the consequences of merely being kind to others and to all of life have far greater positive results than worldly success as defined by the ego. It is beneficial to periodically reassess goals and ask whether they are really important — or just the consequence of egotism.`,
          `True success is simply the automatic consequence of being the best that one can be as a lifestyle, without looking for gain.`,
        ],
      },
    ],
    translations: {
      ru: {
        title: "Вина и Мстительная ненависть",
        frame: `Не доказательство того, что вы плохой, — старый стандарт, за несоответствие которому ум ещё не простил себя.`,
        personalFrame: `Это не доказательство того, что вы плохой, — это старый стандарт, за несоответствие которому вы ещё не простили себя.`,
        signals: [
          { label: "Ощущается как", value: "конкретная, называемая тяжесть о чём-то, что вы сделали." },
          { label: "Личность", value: "добросовестная, прокручивает прошлые поступки, быстро извиняется." },
          { label: "Проявление в обществе", value: "используется конструктивно как моральный компас — и злоупотребляется как инструмент манипуляции и контроля." },
          { label: "Уязвимо к", value: "сворачиванию в стыд, если не разрешена, — «я сделал что-то плохое» соскальзывает в «я сам что-то плохое»." },
        ],
        sections: [
          {
            heading: "Каково это на ощупь",
            paragraphs: [
              `Конкретная, называемая тяжесть по поводу конкретной вещи, которую вы сделали — не приговор всему вашему характеру, а именно об этом одном поступке. Она указывает на что-то точное, чем и отличается от стыда.`,
            ],
          },
          {
            heading: "Для чего это",
            paragraphs: [
              `Толстой, на вершине своего богатства и славы, был остановлен на месте собственной виной — он каталогизировал её без смягчения: ложь, жестокость, потраченные впустую годы, причинённый и оправданный вред. Какое-то время он прятал от себя верёвку, боясь, что может с ней сделать. А затем та же вина стала двигателем всей второй половины его жизни и творчества.`,
              `Различие, которое имеет значение: вина говорит «я сделал что-то, что не соответствовало тому, что я на самом деле ценю» — информация, на основе которой можно действовать. Это отличается от стыда, который говорит, что с вами что-то не так как с человеком. Вина, воспринятая всерьёз, а не убегание от неё, — обычно просто начало исправления.`,
            ],
          },
          {
            heading: "Попробуйте прямо сейчас",
            paragraphs: [
              `Назовите вслух или на бумаге ценность, которой не соответствовал поступок, — не «я плохой», а «я ценю честность, и там я не был честен». Затем сделайте одну конкретную вещь, о которой на самом деле просит вина: извинение, исправление, другое решение в следующий раз.`,
            ],
          },
          {
            heading: "В чём люди ошибаются",
            paragraphs: [
              `Оставленная неразрешённой, вина склонна соскальзывать в стыд — «я сделал что-то плохое» становится «я плохой», а из этого места гораздо труднее мыслить ясно. Исправление — не больше вины, а конкретная коррекция, на которую указывала вина.`,
            ],
          },
        ],
        deepDive: [
          {
            heading: "Об этом разделе",
            paragraphs: [
              `Остальная часть этого более глубокого материала следует собственному описанию этого состояния Дэвидом Р. Хокинсом из его книги *Сила против насилия* — это его система и его язык, а не независимо подтверждённая наука. Подробнее о его методологии и её ограничениях — в разделе «Откуда это взято».`,
            ],
          },
          {
            heading: "Чем на самом деле является вина",
            paragraphs: [
              `Вина — следствие памяти о сожалеемых прошлых поступках по мере того, как они вспоминаются. Их можно преодолеть через переосмысление контекста — ошибки являются естественным, безличным следствием обучения и развития, а потому неизбежны.`,
              `Вина — усвоенное поведение с значительными психологическими компонентами.`,
              `Духовный парадокс представлен религиозным учением о «ненависти к греху», которое лишь выражает то самое, что осуждает.`,
            ],
          },
          {
            heading: "Как с ней работать",
            paragraphs: [
              `Чтобы обойти вину: почувствуйте сострадание, прощение и осознайте, что люди ограничены, невежественны и не всегда понимают, что делают.`,
              `Вина может быть обучающей эмоцией, возникающей как предупреждение не повторять ту же ошибку. Прошлое нельзя переписать, но можно переосмыслить его контекст, чтобы оно стало источником конструктивного обучения.`,
              `Буквальное, абсолютное значение слова «грех» — «ошибка».`,
              `Прощению себя способствуют смирение и принятие ограничений.`,
            ],
          },
          {
            heading: "Где она становится токсичной",
            paragraphs: [
              `Чрезмерная вина и раскаяние — замаскированная форма эгоизма, при которой «я» раздувается, преувеличивается и становится героем трагедии — негатив которой питает эго. Освобождение от вины требует отказа от этого эгоизма, потому что эго подпитывает себя через негатив.`,
              `«Мне следовало бы знать лучше» — ещё одна эгоическая позиция, вводящая гипотетическое, которое всегда ложно. Купание в вине питает эго и является потаканием себе.`,
              `Гипертрофированное супер-эго может быть источником чрезмерной вины. Спроецированное на других, оно оправдывает мстительность в крайних формах как месть «злому» врагу. Это рационализирует убийство других как «заслуживающих» смерти. Худшие разрушения человечества часто совершались во имя Бога — классическая люциферова инверсия добра и зла.`,
              `Бог не садист, поэтому самоуничижение или самонаказание не служат ни Богу, ни ближним.`,
            ],
          },
          {
            heading: "Более глубокая механика",
            paragraphs: [
              `В психологических терминах источник вины — супер-эго, понятие, названное Фрейдом (подробнее — в разделе «Откуда это взято»), — часть ума, состоящая из интроецированных суждений, точек зрения и усвоенного содержания.`,
              `Нежелание прощать — следствие иллюзии, что другие этого не «заслуживают». На деле именно прощающий, а не прощённый, выигрывает больше всего.`,
              `Прощение не может быть совершено эго/умом, потому что ему не хватает необходимой силы, когда оно захвачено энергетическим полем ненависти, калибрующимся всего на 30. Преобразующий источник силы не может исходить из ума или личности, называемой личным «я». Необходимая сила заключена в нелинейном качестве сознания, называемом «волей».`,
              `Культуры, пропитанные виной, обычно имеют негативный образ Бога как осуждающего, мстительного, гневного и карающего — видимый через природные катастрофы, контекстуализируемые как наказание за порочность.`,
              `Общественность часто выражает опасение, что виновные могут остаться безнаказанными. Любой, знакомый с реальностью сознания, осознаёт, что такое невозможно. Каждый подотчётен вселенной и подлежит Божественной Справедливости самой динамикой вселенной. В ней нет случайностей.`,
            ],
          },
          {
            heading: "Возвращение к центру",
            paragraphs: [
              `Личная прошлая история представляет собой лучшее, что можно было сделать тогда, при данных обстоятельствах — включавших восприятие и эмоционально-психическое состояние того времени. Каждый данный момент включает ограничение. То, кем мы были, — не то, кем мы являемся сейчас. Ошибки неотъемлемы от процесса обучения, что является уделом самого человеческого состояния.`,
              `В долгосрочной перспективе последствия простой доброты к другим и ко всей жизни имеют гораздо более положительные результаты, чем мирской успех, как его определяет эго. Полезно периодически пересматривать цели и спрашивать, действительно ли они важны — или просто следствие эгоизма.`,
              `Истинный успех — это просто автоматическое следствие того, чтобы быть лучшим, каким можешь быть, как образ жизни, без поиска выгоды.`,
            ],
          },
        ],
      },
    },
  },
  {
    slug: "shame",
    name: "shame",
    title: "Shame: Despair",
    score: 20,
    frame: `Shame is not a failure; it is the soul's extreme sensitivity to dignity.`,
    personalFrame: `You haven't failed right now — you're just feeling how sensitive you are to your own dignity.`,
    signals: [
      { label: "Feels like", value: "wanting to be invisible." },
      { label: "Personality", value: "shy, withdrawn, introverted, self-deprecating." },
      { label: "Used in society", value: "as a fear of disapproval; a tool for cruelty." },
      { label: "Factors leading to it", value: "neglect, physical, emotional, or sexual abuse." },
      { label: "Prone to", value: "wanting to hide from everyone, and believing others see you the way you see yourself." },
    ],
    sections: [
      {
        heading: "What this feels like",
        paragraphs: [
          `A pull to disappear — to not be seen, to take up less space. Unlike guilt, it's not about a specific action; it's a feeling that something about you, generally, is wrong.`,
        ],
      },
      {
        heading: "What it's for",
        paragraphs: [
          `Brené Brown's research draws the line precisely: guilt is "I did something bad," shame is "I am bad" — and the second one is almost never true, even when it feels total. Her own finding, after years of interviewing people about it: "Shame cannot survive being spoken. It cannot survive being spoken and being met with empathy." (See "Where this comes from" for more on her research.)`,
          `Which is the opposite of the instinct shame produces — the pull to hide, to go quiet, to make sure no one sees. The way out isn't proving the shame wrong through more achievement. It's saying the actual thing out loud to one person who won't flinch.`,
        ],
      },
      {
        heading: "Try this now",
        paragraphs: [
          `Say the specific thing you're ashamed of out loud to one person you trust not to flinch — not the whole story, just the actual thing. Brown's research point is precise: shame loses most of its power the moment it's spoken and met with anything other than judgment.`,
        ],
      },
      {
        heading: "Where people get it wrong",
        paragraphs: [
          `The instinct shame produces — hide, go quiet, make sure no one sees — is exactly backwards. Proving the shame wrong through more achievement doesn't touch it, because achievement was never the actual question it was asking.`,
        ],
      },
    ],
    deepDive: [
      {
        heading: "About this section",
        paragraphs: [
          `The rest of this deeper read follows David R. Hawkins' own account of this state from his book *Power vs. Force* — his framework and his language, not independently verified science. See "Where this comes from" for more on his methodology and its limits.`,
        ],
      },
      {
        heading: "What it can become",
        paragraphs: [
          `Despair is helplessness and hopelessness together — a hard state to be in, and one where even everyday things like eating or basic care can start to fall away. If this is where you are, or if the will to live itself feels gone, please reach out to a doctor, a mental health professional, or a crisis line where you are — this app is a self-reflection practice, not a substitute for that kind of help.`,
          `Left unaddressed for a long time, shame this heavy can turn inward as self-hatred, or, less often, outward as anger at others.`,
        ],
      },
      {
        heading: "Working with it",
        paragraphs: [
          `To go up: see that all fear is illusion, so it is safe to let go of ego attachments. The ego is not the source of life, no matter how intense the experience may seem. With the surrender of what seems to be the very source, irreducible core, and essence of one's life—the personal "I"—the mind dissolves into the Infinite "I" of the Eternal, with its profound peace and state of Oneness beyond all time.`,
          `This state may also be a transitory phase, as a consequence of intense inner spiritual work. Severe spiritual depression—the "dark night of the soul"—can represent the last toehold of the ego as it fights for survival. The ego's basic illusion is that it is God, and that without it, death will occur. What is described as "the dark night of the soul" is actually the dark night of the ego. It is not really the soul that is in the dark, but the ego.`,
          `Some comfort can be obtained by recalling the spiritual dictum that one can only go as high as they have been low, or that Jesus Christ sweat blood in Gethsemane, or that the Buddha reported he felt as though his bones were being broken and he was being attacked by demons.`,
        ],
      },
    ],
    translations: {
      ru: {
        title: "Стыд: Отчаяние",
        frame: `Стыд — не провал; это крайняя чувствительность души к собственному достоинству.`,
        personalFrame: `Вы не потерпели неудачу прямо сейчас — вы просто чувствуете, насколько чувствительны к собственному достоинству.`,
        signals: [
          { label: "Ощущается как", value: "желание стать невидимым." },
          { label: "Личность", value: "застенчивая, замкнутая, интровертная, самоуничижительная." },
          { label: "Проявление в обществе", value: "как страх неодобрения; инструмент жестокости." },
          { label: "Факторы, ведущие к этому", value: "пренебрежение, физическое, эмоциональное или сексуальное насилие." },
          { label: "Уязвимо к", value: "желанию спрятаться от всех и вере, что другие видят вас так же, как вы видите себя." },
        ],
        sections: [
          {
            heading: "Каково это на ощупь",
            paragraphs: [
              `Тяга исчезнуть — не быть увиденным, занимать меньше места. В отличие от вины, дело не в конкретном поступке; это чувство, что с вами в целом что-то не так.`,
            ],
          },
          {
            heading: "Для чего это",
            paragraphs: [
              `Исследование Брене Браун проводит черту точно: вина — это «я сделал что-то плохое», стыд — это «я плохой» — и второе почти никогда не истинно, даже когда ощущается абсолютным. Её собственный вывод после многих лет интервью на эту тему: «Стыд не может выжить, если его произнести вслух. Он не может выжить, будучи произнесённым и встреченным сочувствием». (Подробнее о её исследовании — в разделе «Откуда это взято».)`,
              `Это противоположно инстинкту, который порождает стыд, — тяге спрятаться, замолчать, убедиться, что никто не видит. Выход не в том, чтобы опровергнуть стыд новыми достижениями. Он в том, чтобы сказать конкретную вещь вслух одному человеку, который не дрогнет.`,
            ],
          },
          {
            heading: "Попробуйте прямо сейчас",
            paragraphs: [
              `Скажите вслух конкретную вещь, за которую вам стыдно, одному человеку, которому вы доверяете и который не дрогнет, — не всю историю, только саму суть. Вывод исследования Браун точен: стыд теряет большую часть своей силы в момент, когда он произнесён и встречен чем угодно, кроме осуждения.`,
            ],
          },
          {
            heading: "В чём люди ошибаются",
            paragraphs: [
              `Инстинкт, который порождает стыд, — спрятаться, замолчать, убедиться, что никто не видит, — работает ровно наоборот. Опровержение стыда новыми достижениями его не касается, потому что достижение никогда не было тем вопросом, который он на самом деле задавал.`,
            ],
          },
        ],
        deepDive: [
          {
            heading: "Об этом разделе",
            paragraphs: [
              `Остальная часть этого более глубокого материала следует собственному описанию этого состояния Дэвидом Р. Хокинсом из его книги *Сила против насилия* — это его система и его язык, а не независимо подтверждённая наука. Подробнее о его методологии и её ограничениях — в разделе «Откуда это взято».`,
            ],
          },
          {
            heading: "Чем это может стать",
            paragraphs: [
              `Отчаяние — это беспомощность и безнадёжность вместе, тяжёлое состояние, в котором даже повседневные вещи вроде еды или базовой заботы о себе могут начать выпадать. Если это то, где вы сейчас находитесь, или если сама воля к жизни ощущается пропавшей, пожалуйста, обратитесь к врачу, специалисту по психическому здоровью или на кризисную линию там, где вы находитесь, — это приложение — практика самоисследования, а не замена такой помощи.`,
              `Оставленный без внимания надолго, такой тяжёлый стыд может обратиться внутрь как самоненависть или, реже, наружу как гнев на других.`,
            ],
          },
          {
            heading: "Работа с этим",
            paragraphs: [
              `Чтобы подняться: увидьте, что весь страх — иллюзия, и потому безопасно отпустить привязанности эго. Эго не источник жизни, каким бы интенсивным ни казался опыт. С отказом от того, что кажется самим источником, несводимым ядром и сущностью собственной жизни — личного «я», — ум растворяется в Бесконечном «Я» Вечного, с его глубоким покоем и состоянием Единства за пределами всякого времени.`,
              `Это состояние также может быть переходной фазой как следствие интенсивной внутренней духовной работы. Тяжёлая духовная депрессия — «тёмная ночь души» — может представлять собой последнюю опору эго в его борьбе за выживание. Основная иллюзия эго в том, что оно и есть Бог, и что без него наступит смерть. То, что описывается как «тёмная ночь души», на самом деле является тёмной ночью эго. В темноте на самом деле не душа, а эго.`,
              `Некоторое утешение можно найти, вспомнив духовное изречение, что подняться можно ровно настолько высоко, насколько низко опускался, или что Иисус Христос обливался кровавым потом в Гефсимании, или что Будда, по преданию, чувствовал, будто его кости ломаются и на него нападают демоны.`,
            ],
          },
        ],
      },
    },
  },
];

export const getLevelBySlug = (slug: string): LevelContent | undefined =>
  LEVELS.find((level) => level.slug === slug);

// Same pattern as getLocalizedPhilosopher (philosophers.ts) — slug/name stay
// fixed (name is the stable key used by LEVEL_COLORS/measureConfig
// elsewhere), only the reader-facing prose swaps. Called at the point of
// use (the level detail screen) rather than baked into LEVELS directly, so
// getLevelBySlug stays a simple locale-independent lookup.
export function getLocalizedLevel(level: LevelContent, locale: Locale): LevelContent {
  const translation = locale === 'ru' ? level.translations?.ru : undefined;
  if (!translation) return level;
  return { ...level, ...translation };
}
