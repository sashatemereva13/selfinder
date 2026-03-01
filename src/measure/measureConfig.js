export const MEASURE_RESULT_STORAGE_KEY = "selfinder.latestMeasureResult";

export const STEP_CONFIG = [
  {
    key: "color",
    title: "Choose a color that feels right",
    helper: "Pick the color your body relaxes toward first.",
    options: [
      {
        value: "violet",
        label: "Violet",
        swatch: "#a47cff",
        vibe: "intuitive",
        vibration: 420,
        scores: { calm: 1, clarity: 2, intensity: 0, grounding: 0 },
        meaning:
          "You may be looking for perspective, softness, or a wider view before acting.",
      },
      {
        value: "blue",
        label: "Blue",
        swatch: "#5f8bff",
        vibe: "clear",
        vibration: 350,
        scores: { calm: 2, clarity: 2, intensity: 0, grounding: 1 },
        meaning:
          "Your system is leaning toward clarity, emotional cooling, and stable focus.",
      },
      {
        value: "green",
        label: "Green",
        swatch: "#7affad",
        vibe: "restorative",
        vibration: 310,
        scores: { calm: 2, clarity: 1, intensity: 0, grounding: 2 },
        meaning:
          "You may be in a repair phase and ready for balance instead of pressure.",
      },
      {
        value: "yellow",
        label: "Yellow",
        swatch: "#ffe870",
        vibe: "bright",
        vibration: 250,
        scores: { calm: 0, clarity: 2, intensity: 1, grounding: 0 },
        meaning:
          "Your energy is likely asking for momentum, visibility, or mental stimulation.",
      },
      {
        value: "red",
        label: "Red",
        swatch: "#ff7b7b",
        vibe: "active",
        vibration: 175,
        scores: { calm: 0, clarity: 0, intensity: 3, grounding: 1 },
        meaning:
          "There may be strong activation present: desire, urgency, courage, or heat.",
      },
    ],
  },
  {
    key: "sound",
    title: "Choose the sound that resonates",
    helper: "This tells us how your energy wants to move right now.",
    options: [
      {
        value: "soft-tone",
        label: "Soft tone",
        vibe: "soothing",
        vibration: 350,
        scores: { calm: 3, clarity: 1, intensity: 0, grounding: 1 },
        meaning:
          "Your field may be asking for softness, longer exhale, and less pressure while it recalibrates.",
      },
      {
        value: "deep-bass",
        label: "Deep bass",
        vibe: "anchored",
        vibration: 250,
        scores: { calm: 1, clarity: 0, intensity: 1, grounding: 3 },
        meaning:
          "You may be looking for a stronger root: containment, support, and body-level steadiness.",
      },
      {
        value: "bright-chime",
        label: "Bright chime",
        vibe: "uplifting",
        vibration: 400,
        scores: { calm: 0, clarity: 3, intensity: 1, grounding: 0 },
        meaning:
          "Your signal feels ready for a lift in brightness, attention, and mental refresh.",
      },
    ],
  },
  {
    key: "texture",
    title: "Choose the texture that appeals to you",
    helper: "Texture often reveals what kind of support feels safest.",
    options: [
      {
        value: "liquid",
        label: "Liquid flow",
        vibe: "adaptive",
        vibration: 310,
        scores: { calm: 1, clarity: 1, intensity: 1, grounding: 0 },
        meaning:
          "Your energy may want movement, circulation, and a next step with less resistance.",
      },
      {
        value: "sparkling",
        label: "Sparkling air",
        vibe: "expansive",
        vibration: 400,
        scores: { calm: 0, clarity: 2, intensity: 2, grounding: 0 },
        meaning:
          "Your system may be asking for inspiration, newness, and a change in atmosphere.",
      },
      {
        value: "grounded",
        label: "Grounded stone",
        vibe: "steady",
        vibration: 250,
        scores: { calm: 1, clarity: 0, intensity: 0, grounding: 3 },
        meaning:
          "You may be ready for simplicity, boundaries, and stabilizing rituals that are easy to repeat.",
      },
    ],
  },
  {
    key: "pace",
    title: "What pace feels most true right now?",
    helper:
      "Choose the speed your system is actually operating at, not what you wish it was.",
    options: [
      {
        value: "stalled",
        label: "Heavy / slowed",
        vibe: "low momentum",
        vibration: 100,
        scores: { calm: 0, clarity: 0, intensity: 0, grounding: 1 },
        meaning:
          "Your energy may need restoration before momentum can feel natural.",
      },
      {
        value: "steady",
        label: "Steady",
        vibe: "sustainable",
        vibration: 250,
        scores: { calm: 2, clarity: 1, intensity: 0, grounding: 2 },
        meaning:
          "A stable rhythm is available, which supports consistency over force.",
      },
      {
        value: "charged",
        label: "Charged / fast",
        vibe: "surging",
        vibration: 200,
        scores: { calm: 0, clarity: 1, intensity: 3, grounding: 0 },
        meaning:
          "There is momentum here, but it may need direction to stay constructive.",
      },
    ],
  },
  {
    key: "focus",
    title: "How does your attention feel?",
    helper: "Notice your mind-state without trying to fix it yet.",
    options: [
      {
        value: "scattered",
        label: "Scattered",
        vibe: "fragmented",
        vibration: 125,
        scores: { calm: 0, clarity: 0, intensity: 2, grounding: 0 },
        meaning:
          "Attention may be dispersed, making simple structure especially useful.",
      },
      {
        value: "functional",
        label: "Functional focus",
        vibe: "workable",
        vibration: 250,
        scores: { calm: 1, clarity: 2, intensity: 0, grounding: 1 },
        meaning:
          "You have enough focus to make progress if the next step stays clear.",
      },
      {
        value: "crisp",
        label: "Crisp / clear",
        vibe: "precise",
        vibration: 400,
        scores: { calm: 1, clarity: 3, intensity: 0, grounding: 1 },
        meaning:
          "Clarity is available; this is a good moment for decisions and prioritizing.",
      },
    ],
  },
  {
    key: "body",
    title: "What does your body feel like?",
    helper: "Body signal often reveals more than thoughts do.",
    options: [
      {
        value: "contracted",
        label: "Tense / contracted",
        vibe: "guarded",
        vibration: 100,
        scores: { calm: 0, clarity: 0, intensity: 2, grounding: 0 },
        meaning:
          "Your system may be guarding energy and asking for safety first.",
      },
      {
        value: "neutral-body",
        label: "Neutral / okay",
        vibe: "baseline",
        vibration: 200,
        scores: { calm: 1, clarity: 1, intensity: 0, grounding: 1 },
        meaning:
          "You may be in a workable baseline state with room for small positive shifts.",
      },
      {
        value: "open",
        label: "Open / relaxed",
        vibe: "receptive",
        vibration: 350,
        scores: { calm: 2, clarity: 1, intensity: 0, grounding: 1 },
        meaning:
          "Relaxation and receptivity suggest your energy can move with less resistance.",
      },
    ],
  },
  {
    key: "thoughts",
    title: "What tone do your thoughts have?",
    helper: "Pick the tone that is most frequent, not just the loudest.",
    options: [
      {
        value: "critical",
        label: "Critical / harsh",
        vibe: "pressure",
        vibration: 50,
        scores: { calm: 0, clarity: 0, intensity: 2, grounding: 0 },
        meaning:
          "Internal pressure may be draining energy faster than effort alone.",
      },
      {
        value: "practical",
        label: "Practical / neutral",
        vibe: "measured",
        vibration: 250,
        scores: { calm: 1, clarity: 2, intensity: 0, grounding: 1 },
        meaning:
          "A neutral mental tone supports useful action and lower emotional drag.",
      },
      {
        value: "kind",
        label: "Kind / compassionate",
        vibe: "supportive",
        vibration: 500,
        scores: { calm: 2, clarity: 2, intensity: 0, grounding: 0 },
        meaning:
          "A compassionate tone often increases resilience and sustainable energy.",
      },
    ],
  },
  {
    key: "motivation",
    title: "What is driving you most right now?",
    helper: "This points to the emotional engine underneath your decisions.",
    options: [
      {
        value: "avoidance",
        label: "Avoiding pain",
        vibe: "defensive",
        vibration: 100,
        scores: { calm: 0, clarity: 0, intensity: 1, grounding: 1 },
        meaning:
          "Defensive motivation can work short-term, but usually costs energy quickly.",
      },
      {
        value: "obligation",
        label: "Responsibility / duty",
        vibe: "steady effort",
        vibration: 200,
        scores: { calm: 1, clarity: 1, intensity: 1, grounding: 1 },
        meaning:
          "Duty creates movement, and with clarity it can become empowered action.",
      },
      {
        value: "creation",
        label: "Growth / contribution",
        vibe: "expansive",
        vibration: 350,
        scores: { calm: 1, clarity: 2, intensity: 1, grounding: 0 },
        meaning:
          "Creation-oriented energy usually signals rising capacity and openness.",
      },
    ],
  },
  {
    key: "connection",
    title: "How connected do you feel to others?",
    helper:
      "Connection can be emotional, practical, or simply a sense of not being alone.",
    options: [
      {
        value: "withdrawn",
        label: "Withdrawn",
        vibe: "isolated",
        vibration: 75,
        scores: { calm: 0, clarity: 0, intensity: 0, grounding: 1 },
        meaning:
          "There may be a protective withdrawal pattern active in your field.",
      },
      {
        value: "selective",
        label: "Selective but available",
        vibe: "guarded openness",
        vibration: 250,
        scores: { calm: 1, clarity: 1, intensity: 0, grounding: 1 },
        meaning:
          "You may be preserving energy while still leaving room for support.",
      },
      {
        value: "connected",
        label: "Connected / warm",
        vibe: "relational",
        vibration: 500,
        scores: { calm: 2, clarity: 1, intensity: 0, grounding: 0 },
        meaning:
          "Warm connection often corresponds with higher coherence and resilience.",
      },
    ],
  },
  {
    key: "response",
    title: "When something difficult happens, what is your first response?",
    helper: "Choose the reflex, not the ideal response.",
    options: [
      {
        value: "freeze",
        label: "Freeze / shut down",
        vibe: "protection",
        vibration: 75,
        scores: { calm: 0, clarity: 0, intensity: 0, grounding: 1 },
        meaning:
          "Your system may default to protection before action becomes available.",
      },
      {
        value: "push",
        label: "Push / control",
        vibe: "force",
        vibration: 175,
        scores: { calm: 0, clarity: 1, intensity: 2, grounding: 0 },
        meaning:
          "Force can create motion, but may need balance to stay effective.",
      },
      {
        value: "observe",
        label: "Pause and observe",
        vibe: "aware",
        vibration: 350,
        scores: { calm: 2, clarity: 2, intensity: 0, grounding: 0 },
        meaning:
          "Observation before reaction suggests rising capacity and self-regulation.",
      },
    ],
  },
  {
    key: "meaning",
    title: "What feels most meaningful today?",
    helper: "Meaning shapes vibration more than productivity alone.",
    options: [
      {
        value: "survival",
        label: "Getting through the day",
        vibe: "survival",
        vibration: 100,
        scores: { calm: 0, clarity: 0, intensity: 0, grounding: 2 },
        meaning:
          "Survival focus is valid, and it often means your energy needs support and recovery.",
      },
      {
        value: "progress",
        label: "Making progress",
        vibe: "building",
        vibration: 250,
        scores: { calm: 1, clarity: 2, intensity: 1, grounding: 1 },
        meaning:
          "Progress orientation often indicates enough capacity for structured forward movement.",
      },
      {
        value: "service",
        label: "Helping / creating value",
        vibe: "contribution",
        vibration: 400,
        scores: { calm: 1, clarity: 2, intensity: 1, grounding: 0 },
        meaning:
          "Contribution-focused energy often appears when your field is expanding beyond self-protection.",
      },
    ],
  },
  {
    key: "horizon",
    title: "What feels possible in your next step?",
    helper: "This captures your current horizon of possibility.",
    options: [
      {
        value: "small-safe",
        label: "Very small and safe",
        vibe: "contained",
        vibration: 125,
        scores: { calm: 1, clarity: 1, intensity: 0, grounding: 2 },
        meaning:
          "A smaller horizon may be wise right now if it helps rebuild steadiness.",
      },
      {
        value: "clear-next",
        label: "One clear next move",
        vibe: "practical",
        vibration: 250,
        scores: { calm: 1, clarity: 2, intensity: 0, grounding: 1 },
        meaning:
          "A clear next move is often the strongest bridge between insight and action.",
      },
      {
        value: "expansive-next",
        label: "A bold or expansive step",
        vibe: "ready",
        vibration: 500,
        scores: { calm: 1, clarity: 2, intensity: 1, grounding: 0 },
        meaning:
          "An expansive horizon suggests trust, capacity, and greater energetic availability.",
      },
    ],
  },
];

export const INITIAL_CHOICES = Object.fromEntries(
  STEP_CONFIG.map((step) => [step.key, null]),
);

export const VIBRATION_LEVELS = [
  { name: "Shame", slug: "shame", score: 20, route: "/levels/shame" },
  { name: "Guilt", slug: "guilt", score: 30, route: "/levels/guilt" },
  { name: "Apathy", slug: "apathy", score: 50, route: "/levels/apathy" },
  { name: "Grief", slug: "grief", score: 75, route: "/levels/grief" },
  { name: "Fear", slug: "fear", score: 100, route: "/levels/fear" },
  { name: "Desire", slug: "desire", score: 125, route: "/levels/desire" },
  { name: "Anger", slug: "anger", score: 150, route: "/levels/anger" },
  { name: "Pride", slug: "pride", score: 175, route: "/levels/pride" },
  { name: "Courage", slug: "courage", score: 200, route: "/levels/courage" },
  {
    name: "Neutrality",
    slug: "neutrality",
    score: 250,
    route: "/levels/neutrality",
  },
  {
    name: "Willingness",
    slug: "willingness",
    score: 310,
    route: "/levels/willingness",
  },
  {
    name: "Acceptance",
    slug: "acceptance",
    score: 350,
    route: "/levels/acceptance",
  },
  { name: "Reason", slug: "reason", score: 400, route: "/levels/reason" },
  { name: "Love", slug: "love", score: 500, route: "/levels/love" },
  {
    name: "Unconditional Love",
    slug: "unconditionallove",
    score: 540,
    route: "/levels/unconditionallove",
  },
  { name: "Peace", slug: "peace", score: 600, route: "/levels/peace" },
  {
    name: "Enlightenment",
    slug: "enlightenment",
    score: 700,
    route: "/levels/enlightenment",
  },
];

export const STEP_VISUALS = {
  sound: { label: "Sound", icon: ")))" },
  pace: { label: "Pace", icon: ">>" },
  focus: { label: "Focus", icon: "[]" },
  body: { label: "Body", icon: "()" },
  thoughts: { label: "Thoughts", icon: "//" },
  motivation: { label: "Drive", icon: "^" },
  connection: { label: "Connect", icon: "<>" },
  response: { label: "Response", icon: "!?" },
  meaning: { label: "Meaning", icon: "++" },
  horizon: { label: "Horizon", icon: "->" },
};

export const STEP_WEIGHTS = {
  color: 1.15,
  sound: 1.1,
  texture: 1.1,
  pace: 0.95,
  focus: 1.05,
  body: 1.1,
  thoughts: 1.1,
  motivation: 0.95,
  connection: 1,
  response: 0.95,
  meaning: 1,
  horizon: 0.95,
};

export const SIGNAL_AXES = [
  { key: "calm", label: "Calm", short: "C" },
  { key: "clarity", label: "Clarity", short: "Cl" },
  { key: "grounding", label: "Grounding", short: "G" },
  { key: "intensity", label: "Intensity", short: "I" },
];

export const MEANING_VISUALS = {
  survival: {
    pill: "Stabilize",
    hint: "Secure basics first",
    level: 1,
    icon: "•",
  },
  progress: {
    pill: "Build",
    hint: "Move one concrete step",
    level: 2,
    icon: "••",
  },
  service: {
    pill: "Contribute",
    hint: "Create value outward",
    level: 3,
    icon: "•••",
  },
};

export const HORIZON_VISUALS = {
  "small-safe": { level: 1, hint: "Safe next move" },
  "clear-next": { level: 2, hint: "Clear practical next" },
  "expansive-next": { level: 3, hint: "Bold expansion" },
};
