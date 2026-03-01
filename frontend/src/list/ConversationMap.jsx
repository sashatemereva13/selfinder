const ConversationMap = {
  start: {
    message: "glad to see you, let's measure your vibration",
    options: [{ label: "let's!", next: "goToMeasure" }],
  },
  prettyGood: {
    message: "twins! ok, now, let me explain what the party is about...",
    options: [
      { label: "deep explanation", next: "longExplanation" },
      { label: "simple explanation", next: "shortExplanation" },
    ],
  },
  couldBeBetter: {
    message: "allow me to make it better?",
    options: [
      { label: "please do", next: "healingSpell" },
      { label: "not now", next: "exit" },
    ],
  },
  longExplanation: {
    message: `You are God. In your own universe. 
    All-powerful. All-loving. All-knowing.`,
    options: [{ label: "next", next: "longExplanation2" }],
  },
  longExplanation2: {
    message: `
 Sounds crazy? Go to the depths of who you are and see it for yourself.
`,
    options: [{ label: "yes", next: "explorationStart" }],
  },
  shortExplanation: {
    message:
      "it's simple: this is your inner space. and you're invited to explore it.",
    options: [{ label: "start exploring", next: "explorationStart" }],
  },
  healingSpell: {
    message:
      "✨ sending you softness and clarity. take a deep breath. you’re safe here.",
    options: [{ label: "thank you", next: "explorationStart" }],
  },
  exit: {
    message: "alright, I’ll be here when you’re ready.",
    options: [],
  },
  explorationStart: {
    message: "want to discover what lies beneath the surface?",
    options: [{ label: "yes!", next: "askFirstQuestion" }],
  },

  askFirstQuestion: {
    message: "what part of you feels most alive lately?",
    options: [
      { label: "my mind", next: "mindPath" },
      { label: "my heart", next: "heartPath" },
      { label: "my body", next: "bodyPath" },
    ],
  },
  bodyPath: {
    message:
      "beautiful. your body remembers what your mind forgets. want to tune into it now?",
    options: [
      { label: "yes, guide me", next: "bodyExperience1" },
      { label: "maybe later", next: "exit" },
    ],
  },
  bodyExperience1: {
    message: `let’s begin. close your eyes for a moment.\ntake a deep breath…\ncan you feel your feet on the ground?`,
    options: [{ label: "yes", next: "bodyExperience2" }],
  },
  bodyExperience2: {
    message: `now slowly scan your body from head to toe.\nwhere do you feel warmth?\nwhere do you feel tension?`,
    options: [{ label: "continue", next: "bodyExperience3" }],
  },
  bodyExperience3: {
    message: `breathe into the area that feels tense.\nno need to fix, just notice.\nthat’s it.\nthat’s presence.`,
    options: [{ label: "i feel more grounded", next: "askFirstQuestion" }],
  },

  heartPath: {
    message: "your heart has been whispering. would you like to listen now?",
    options: [
      { label: "yes", next: "innerCall1" },
      { label: "not yet", next: "exit" },
    ],
  },
  innerCall1: {
    message: `imagine you're standing before two paths.\none feels familiar, safe.\nthe other feels alive, electric, unknown.\nwhich one is calling you?`,
    options: [
      { label: "the electric one", next: "innerCall2" },
      { label: "the safe one", next: "innerCallSafe" },
    ],
  },
  innerCall2: {
    message: `that's the voice.\nthe one that pulls you toward becoming.\nwhat is one thing you've always wanted to do but never dared to start?`,
    options: [{ label: "i know what it is", next: "innerCall3" }],
  },
  innerCall3: {
    message: `take this as a sign.\nthe universe already said yes.\nwill you?`,
    options: [{ label: "yes", next: "askFirstQuestion" }],
  },
  innerCallSafe: {
    message: `that’s okay too.\nsafety is sacred.\ntake your time.\ni’ll be here when you’re ready.`,
    options: [{ label: "integration" }],
  },

  mindPath: {
    message: `the mind is loud for a reason.\nit wants to protect you, solve, prepare.\nwant to give it a moment of rest?`,
    options: [
      { label: "yes, please", next: "mindExperience1" },
      { label: "not now", next: "exit" },
    ],
  },
  mindExperience1: {
    message: `close your eyes gently.\nnotice the thoughts passing through.\nsee if you can watch them without holding on.`,
    options: [{ label: "i’m watching", next: "mindExperience2" }],
  },
  mindExperience2: {
    message: `good.\nnow take a deep breath in… and out.\nimagine your thoughts floating like clouds.\nthey pass, but you remain.`,
    options: [{ label: "there’s space", next: "mindExperience3" }],
  },
  mindExperience3: {
    message: `this space — that’s you.\nthe one behind the thoughts.\nwelcome back.`,
    options: [{ label: "thank you", next: "askFirstQuestion" }],
  },

  integration: {
    message: `you’ve stepped through a portal into your inner world.\nyou’ve felt it, heard it, witnessed it.\nwhat will you do with it now?`,
    options: [
      { label: "begin the deeper dive", next: "deeperExperienceStart" },
      { label: "just wander", next: "freeExploreMode" },
    ],
  },
};

export default ConversationMap;
