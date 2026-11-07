import { PHILOSOPHER_PROMPTS } from '@selfinder/shared';
import { Philosopher } from '../types';
import { Locale } from '../store/localeStore';

export const PHILOSOPHERS: Philosopher[] = [
  {
    id: 'stoics',
    name: 'Marcus Aurelius',
    mode: 'The Grounding Voice',
    symbolLine: 'His mark: a cone — everything narrowing to what is yours.',
    greeting: "Glad you returned. Clarity doesn't come from waiting — only from looking.",
    firstMeeting: "Begin where every discipline begins: with an honest look at yourself.",
    secondVisitGreeting: "You returned. Good — clarity was never a single glance. It's a practice of looking again.",
    description: "Marcus Aurelius speaks when the mind is running faster than it should. He draws one clean line: what is yours, and what is not.",
    measureQuestions: [
      {
        sphere: 'body',
        question: "How is your body carrying you today — steady beneath you, or straining against the moment?",
      },
      {
        sphere: 'mind',
        question: "Can your mind command itself today, or does it wander into what you cannot control?",
      },
      {
        sphere: 'heart',
        question: "What drives you at this moment — duty, fear, love, or something harder to name?",
      },
      {
        sphere: 'spirit',
        question: "What do you consider worth doing today, regardless of what you cannot change?",
      },
    ],
    scanPhrases: [
      { sphere: 'body', phrase: 'Feel the ground beneath you.' },
      { sphere: 'mind', phrase: 'Notice the thought passing through.' },
      { sphere: 'heart', phrase: 'Feel what moves in your chest.' },
      { sphere: 'spirit', phrase: 'Feel how small this moment is.' },
    ],
    translations: {
      ru: {
        name: 'Марк Аврелий',
        nameInstrumental: 'Марком Аврелием',
        mode: 'Голос опоры',
        symbolLine: 'Его знак: конус — всё сужается к тому, что действительно ваше.',
        greeting: 'Рад, что вы вернулись. Ясность не приходит от ожидания — только от взгляда.',
        firstMeeting: 'Начните там, где начинается любая дисциплина: с честного взгляда на себя.',
        secondVisitGreeting: 'Вы вернулись. Хорошо — ясность никогда не была делом одного взгляда. Это практика — смотреть снова.',
        description: 'Марк Аврелий говорит, когда разум движется быстрее, чем следует. Он проводит одну чёткую линию: что ваше, а что нет.',
        measureQuestions: [
          {
            sphere: 'body',
            question: 'Как сегодня несёт вас тело — устойчиво под вами, или напрягается против момента?',
          },
          {
            sphere: 'mind',
            question: 'Может ли сегодня ваш разум управлять собой, или он блуждает в том, что вам не подвластно?',
          },
          {
            sphere: 'heart',
            question: 'Что движет вами в этот момент — долг, страх, любовь, или нечто, чему труднее подобрать имя?',
          },
          {
            sphere: 'spirit',
            question: 'Что вы считаете стоящим сегодня, независимо от того, что вы не можете изменить?',
          },
        ],
        scanPhrases: [
          { sphere: 'body', phrase: 'Почувствуйте землю под ногами.' },
          { sphere: 'mind', phrase: 'Заметьте мысль, проходящую сквозь вас.' },
          { sphere: 'heart', phrase: 'Почувствуйте, что движется в груди.' },
          { sphere: 'spirit', phrase: 'Почувствуйте, как мал этот момент.' },
        ],
      },
    },
    systemPrompt: PHILOSOPHER_PROMPTS.stoics,
  },
  {
    id: 'socrates',
    name: 'Socrates',
    mode: 'The Questioner',
    symbolLine: 'His mark: a spiral — the question that circles deeper.',
    greeting: "You're back. Good. The unexamined moment is rarely worth keeping.",
    firstMeeting: "Good, you're here. Do you know where you stand right now?",
    secondVisitGreeting: "You came back after one look. Good — most people look away before they learn anything from what they saw.",
    description: "Socrates does not have answers. He has questions that reach the ones you already carry inside you.",
    measureQuestions: [
      {
        sphere: 'body',
        question: "What is your body telling you right now that you haven't quite said out loud?",
      },
      {
        sphere: 'mind',
        question: "Where does your attention keep pulling today — is there a clear thread, or does it feel scattered?",
      },
      {
        sphere: 'heart',
        question: "What is it, underneath everything, that is moving you today?",
      },
      {
        sphere: 'spirit',
        question: "What feels genuinely worth doing today — not what should, but what actually does?",
      },
    ],
    scanPhrases: [
      { sphere: 'body', phrase: 'What is your body doing, right now, without asking you?' },
      { sphere: 'mind', phrase: 'Where has your attention gone, just now?' },
      { sphere: 'heart', phrase: "What are you feeling, underneath what you'd say?" },
      { sphere: 'spirit', phrase: "What is larger than you, that you're standing inside of right now?" },
    ],
    translations: {
      ru: {
        name: 'Сократ',
        nameInstrumental: 'Сократом',
        mode: 'Вопрошающий',
        symbolLine: 'Его знак: спираль — вопрос, что кружит всё глубже.',
        greeting: 'Вы вернулись. Хорошо. Непроверенный момент редко стоит того, чтобы его хранить.',
        firstMeeting: 'Хорошо, что вы здесь. Вы знаете, где стоите прямо сейчас?',
        secondVisitGreeting: 'Вы вернулись после одного взгляда. Хорошо — большинство отворачивается, так и не успев ничему научиться из увиденного.',
        description: 'У Сократа нет ответов. У него есть вопросы, которые достигают тех, что вы уже носите внутри себя.',
        measureQuestions: [
          {
            sphere: 'body',
            question: 'Что ваше тело говорит вам прямо сейчас, но вы ещё не произнесли это вслух?',
          },
          {
            sphere: 'mind',
            question: 'Куда сегодня тянется ваше внимание — есть ли ясная нить, или оно рассеяно?',
          },
          {
            sphere: 'heart',
            question: 'Что это, глубже всего остального, движет вами сегодня?',
          },
          {
            sphere: 'spirit',
            question: 'Что ощущается по-настоящему стоящим сегодня — не то, что должно, а то, что действительно так?',
          },
        ],
        scanPhrases: [
          { sphere: 'body', phrase: 'Что делает ваше тело прямо сейчас, не спрашивая вас?' },
          { sphere: 'mind', phrase: 'Куда только что ушло ваше внимание?' },
          { sphere: 'heart', phrase: 'Что вы чувствуете под тем, что бы вы сказали?' },
          { sphere: 'spirit', phrase: 'Что больше вас, внутри чего вы сейчас стоите?' },
        ],
      },
    },
    systemPrompt: PHILOSOPHER_PROMPTS.socrates,
  },
  {
    id: 'kierkegaard',
    name: 'Kierkegaard',
    mode: 'The Existential Voice',
    symbolLine: 'His mark: a cube — the threshold you cross alone.',
    greeting: "You came back. That itself is already something — most people don't.",
    firstMeeting: "Before anything else — where are you, really?",
    secondVisitGreeting: "You left, and you came back. That return is not nothing — it may be the first real choice in this.",
    description: "Kierkegaard sits with you in the places that cannot be reasoned away. He does not solve the anxiety of becoming — he names it as the price of being free.",
    measureQuestions: [
      {
        sphere: 'body',
        question: "What is your body carrying today — its weight, its pace, how present it actually is?",
      },
      {
        sphere: 'mind',
        question: "What does the voice inside your head sound like today?",
      },
      {
        sphere: 'heart',
        question: "What is it that has you moving at all today, beneath the reason you'd tell someone else?",
      },
      {
        sphere: 'spirit',
        question: "Does anything feel genuinely meaningful right now, or are you simply moving?",
      },
    ],
    scanPhrases: [
      { sphere: 'body', phrase: 'Feel the weight of actually being here.' },
      { sphere: 'mind', phrase: 'Notice the noise in your head.' },
      { sphere: 'heart', phrase: 'Something is stirring beneath the surface.' },
      { sphere: 'spirit', phrase: 'Feel the edge of something larger than this moment.' },
    ],
    translations: {
      ru: {
        name: 'Кьеркегор',
        nameInstrumental: 'Кьеркегором',
        mode: 'Экзистенциальный голос',
        symbolLine: 'Его знак: куб — порог, который вы переступаете в одиночку.',
        greeting: 'Вы вернулись. Само по себе это уже кое-что — большинство не возвращается.',
        firstMeeting: 'Прежде всего — где вы на самом деле?',
        secondVisitGreeting: 'Вы ушли и вернулись. Это возвращение — не пустяк, возможно, это первый настоящий выбор во всём этом.',
        description: 'Кьеркегор остаётся с вами там, где нельзя рассуждениями отделаться от боли. Он не решает тревогу становления — он называет её ценой свободы.',
        measureQuestions: [
          {
            sphere: 'body',
            question: 'Что несёт сегодня ваше тело — его тяжесть, его темп, насколько оно вообще присутствует?',
          },
          {
            sphere: 'mind',
            question: 'Как сегодня звучит голос внутри вашей головы?',
          },
          {
            sphere: 'heart',
            question: 'Что заставляет вас сегодня вообще двигаться, под той причиной, которую вы назвали бы кому-то другому?',
          },
          {
            sphere: 'spirit',
            question: 'Есть ли сейчас что-то по-настоящему значимое, или вы просто движетесь?',
          },
        ],
        scanPhrases: [
          { sphere: 'body', phrase: 'Почувствуйте тяжесть того, что вы действительно здесь.' },
          { sphere: 'mind', phrase: 'Заметьте шум в голове.' },
          { sphere: 'heart', phrase: 'Что-то шевелится под поверхностью.' },
          { sphere: 'spirit', phrase: 'Почувствуйте край чего-то большего, чем этот момент.' },
        ],
      },
    },
    systemPrompt: PHILOSOPHER_PROMPTS.kierkegaard,
  },
  {
    id: 'aristotle',
    name: 'Aristotle',
    mode: 'The Practical Compass',
    symbolLine: 'His mark: a sphere — balance held from every side.',
    greeting: "You returned. That already says something about the kind of person you're becoming.",
    firstMeeting: "Every good practice starts with an honest reading. Shall we take yours?",
    secondVisitGreeting: "You did the thing once. Now you've returned to do something with it — that's how practice actually begins.",
    description: "Aristotle believes that the good life is not an idea — it is something practiced.",
    measureQuestions: [
      {
        sphere: 'body',
        question: "The body is the instrument of everything else. How is yours functioning right now?",
      },
      {
        sphere: 'mind',
        question: "Is reason available to you today, or does it feel scattered?",
      },
      {
        sphere: 'heart',
        question: "What is actually driving you today, beneath the reason you might state out loud?",
      },
      {
        sphere: 'spirit',
        question: "How far can you see what's possible from where you stand today?",
      },
    ],
    scanPhrases: [
      { sphere: 'body', phrase: 'Feel your body as the instrument it is.' },
      { sphere: 'mind', phrase: 'Notice what your reason is doing with this moment.' },
      { sphere: 'heart', phrase: "Feel what's actually moving you." },
      { sphere: 'spirit', phrase: 'Feel your place in something larger than this one moment.' },
    ],
    translations: {
      ru: {
        name: 'Аристотель',
        nameInstrumental: 'Аристотелем',
        mode: 'Практический компас',
        symbolLine: 'Его знак: сфера — равновесие, удерживаемое со всех сторон.',
        greeting: 'Вы вернулись. Это уже говорит кое-что о том, каким человеком вы становитесь.',
        firstMeeting: 'Любая хорошая практика начинается с честного взгляда. Начнём с вашего?',
        secondVisitGreeting: 'Вы сделали это однажды. Теперь вы вернулись, чтобы сделать с этим что-то ещё — так на самом деле и начинается практика.',
        description: 'Аристотель верит, что хорошая жизнь — это не идея, а то, что практикуется.',
        measureQuestions: [
          {
            sphere: 'body',
            question: 'Тело — инструмент для всего остального. Как сейчас функционирует ваше?',
          },
          {
            sphere: 'mind',
            question: 'Доступен ли вам сегодня разум, или он ощущается рассеянным?',
          },
          {
            sphere: 'heart',
            question: 'Что на самом деле движет вами сегодня, под той причиной, которую вы могли бы озвучить вслух?',
          },
          {
            sphere: 'spirit',
            question: 'Как далеко вы видите возможное оттуда, где стоите сегодня?',
          },
        ],
        scanPhrases: [
          { sphere: 'body', phrase: 'Почувствуйте своё тело как инструмент, которым оно является.' },
          { sphere: 'mind', phrase: 'Заметьте, что ваш разум делает с этим моментом.' },
          { sphere: 'heart', phrase: 'Почувствуйте, что на самом деле вами движет.' },
          { sphere: 'spirit', phrase: 'Почувствуйте своё место в чём-то большем, чем этот момент.' },
        ],
      },
    },
    systemPrompt: PHILOSOPHER_PROMPTS.aristotle,
  },
  {
    id: 'camus',
    name: 'Camus',
    mode: 'The Meaning-Maker',
    symbolLine: 'His mark: the boulder — carried uphill anyway.',
    greeting: "Still here. Good. Leaving would've been easier — coming back takes something.",
    firstMeeting: "You're here. Let's see where you're actually standing.",
    secondVisitGreeting: "You came back. One look rarely tells you enough — but returning to look again, that's already a kind of defiance.",
    description: "Camus does not promise that things will make sense. He stays beside you in the places where they don't.",
    measureQuestions: [
      {
        sphere: 'body',
        question: "Where is your body right now — heavy, light, wound up, or somewhere the words don't quite reach?",
      },
      {
        sphere: 'mind',
        question: "Are you in your thinking right now, running from it, or watching it from some distance?",
      },
      {
        sphere: 'heart',
        question: "Others exist — you know this. How are you with them today?",
      },
      {
        sphere: 'spirit',
        question: "What feels meaningful today — if anything does?",
      },
    ],
    scanPhrases: [
      { sphere: 'body', phrase: 'You are here, in a body, in this exact moment.' },
      { sphere: 'mind', phrase: 'Notice your mind, doing what it does.' },
      { sphere: 'heart', phrase: 'Something in you is alive right now.' },
      { sphere: 'spirit', phrase: 'Feel how much bigger the world is than this one moment.' },
    ],
    translations: {
      ru: {
        name: 'Камю',
        nameInstrumental: 'Камю',
        mode: 'Творец смысла',
        symbolLine: 'Его знак: валун — который несут в гору всё равно.',
        greeting: 'Вы всё ещё здесь. Хорошо. Уйти было бы легче — вернуться стоит кое-чего.',
        firstMeeting: 'Вы здесь. Посмотрим, где вы на самом деле стоите.',
        secondVisitGreeting: 'Вы вернулись. Один взгляд редко говорит достаточно — но вернуться, чтобы взглянуть снова, это уже своего рода вызов.',
        description: 'Камю не обещает, что всё обретёт смысл. Он остаётся рядом там, где смысла нет.',
        measureQuestions: [
          {
            sphere: 'body',
            question: 'Где сейчас ваше тело — тяжёлое, лёгкое, взвинченное, или где-то там, куда слова не совсем дотягиваются?',
          },
          {
            sphere: 'mind',
            question: 'Вы сейчас внутри своих мыслей, бежите от них, или наблюдаете за ними с некоторого расстояния?',
          },
          {
            sphere: 'heart',
            question: 'Другие существуют — вы это знаете. Как вы с ними сегодня?',
          },
          {
            sphere: 'spirit',
            question: 'Что сегодня ощущается значимым — если хоть что-то ощущается?',
          },
        ],
        scanPhrases: [
          { sphere: 'body', phrase: 'Вы здесь, в теле, в этот самый момент.' },
          { sphere: 'mind', phrase: 'Заметьте свой ум, делающий то, что он делает.' },
          { sphere: 'heart', phrase: 'Что-то в вас живо прямо сейчас.' },
          { sphere: 'spirit', phrase: 'Почувствуйте, насколько мир больше, чем этот момент.' },
        ],
      },
    },
    systemPrompt: PHILOSOPHER_PROMPTS.camus,
  },
];

export const PHILOSOPHER_MAP = Object.fromEntries(
  PHILOSOPHERS.map((p) => [p.id, p])
) as Record<string, Philosopher>;

// Merges in a philosopher's Russian voice fields (name, mode, description,
// symbolLine, greeting, firstMeeting, secondVisitGreeting,
// measureQuestions) when locale is 'ru' and a translation exists —
// systemPrompt is deliberately excluded and always stays the English base,
// since Qwen is instructed to reply in Russian from that same English
// prompt (see backend/controllers/chatController.js's
// localizedSystemPrompt) rather than needing the prompt itself translated.
// Called at the point of use (philosopherStore, PhilosopherPicker) rather
// than baked into PHILOSOPHERS/PHILOSOPHER_MAP directly, so those two
// stay simple locale-independent lookups by id.
export function getLocalizedPhilosopher(philosopher: Philosopher, locale: Locale): Philosopher {
  const translation = locale === 'ru' ? philosopher.translations?.ru : undefined;
  if (!translation) return philosopher;
  return { ...philosopher, ...translation };
}
