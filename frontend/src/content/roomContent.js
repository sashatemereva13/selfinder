// ─── Persona Word Pool (28 words) ────────────────────────────────────────────
export const PERSONA_WORD_POOL = [
  "capable", "warm", "calm", "driven", "open", "curious", "strong", "reliable",
  "playful", "decisive", "caring", "independent", "sensitive", "uncertain",
  "tired", "afraid", "needy", "lonely", "angry", "guarded", "ashamed",
  "resentful", "fragile", "overwhelmed", "jealous", "lost", "scattered", "ambitious",
];

// ─── Shadow Quality List (24 traits) ─────────────────────────────────────────
export const SHADOW_QUALITIES = [
  "controlling", "needy", "cold", "dramatic", "passive", "competitive",
  "avoidant", "perfectionistic", "impulsive", "manipulative", "withdrawn",
  "aggressive", "dependent", "rigid", "dismissive", "volatile", "calculating",
  "self-righteous", "envious", "reckless", "stubborn", "scattered", "obsessive", "intense",
];

// ─── Anima Spectrums (4 dimensions) ──────────────────────────────────────────
export const ANIMA_SPECTRUMS = [
  { dimension: "cognition",  leftLabel: "thinking",  rightLabel: "feeling",   default: 50 },
  { dimension: "energy",     leftLabel: "action",    rightLabel: "stillness", default: 50 },
  { dimension: "exchange",   leftLabel: "giving",    rightLabel: "receiving", default: 50 },
  { dimension: "expression", leftLabel: "speaking",  rightLabel: "listening", default: 50 },
];

// ─── Inner Child Writing Prompts ──────────────────────────────────────────────
export const INNER_CHILD_PROMPTS = [
  {
    key: "aliveness",
    prompt: "A memory of pure aliveness — something you loved before you knew you were supposed to have reasons.",
  },
  {
    key: "editing",
    prompt: "The moment the editing began — when you first learned to be different to survive or belong.",
  },
  {
    key: "carrying",
    prompt: "What you're still carrying — something from that time that hasn't resolved.",
  },
];

// ─── Room Unlock Prompts ──────────────────────────────────────────────────────
export const ROOM_UNLOCK_PROMPTS = {
  persona:    "Complete this sentence: The face I most need to let down is…",
  shadow:     "Complete this sentence: The quality in myself I'm most ready to acknowledge is…",
  anima:      "Complete this sentence: What I see in others that I am ready to own as mine is…",
  innerchild: "Complete this sentence: What my younger self most needed to hear is…",
  self:       "Complete this sentence: The thread that runs through all of this is…",
};

// ─── Room Psychological Summaries (for prompt building) ──────────────────────
const ROOM_PSYCHOLOGY = {
  persona: {
    move: "mapping the gap between the performed self and the felt self",
    completionCondition: "articulating one quality the user is ready to let be seen",
  },
  shadow: {
    move: "recognising projected qualities as parts of the self",
    completionCondition: "naming one disowned quality the user is willing to acknowledge",
  },
  anima: {
    move: "locating the contrasexual dimensions within — what has been projected outward",
    completionCondition: "naming one quality the user recognises as theirs, not just seen in others",
  },
  innerchild: {
    move: "making contact with the formative wound and the unlived aliveness",
    completionCondition: "offering something to the younger self that was not received",
  },
  self: {
    move: "integrating the artefacts from all previous rooms into a felt sense of wholeness",
    completionCondition: "naming the thread that connects all the work",
  },
};

// ─── Mechanic Output → Readable Text ─────────────────────────────────────────
function formatPersonaOutput(mechanicOutput) {
  if (!mechanicOutput) return "";
  const { publicFace = [], privateFace = [], onlyPublic = [], onlyPrivate = [], inBoth = [] } = mechanicOutput;
  return [
    `Public face (shown to the world): ${publicFace.join(", ") || "none selected"}`,
    `Private face (known only to self): ${privateFace.join(", ") || "none selected"}`,
    `Only public, not private: ${onlyPublic.join(", ") || "none"}`,
    `Only private, not public: ${onlyPrivate.join(", ") || "none"}`,
    `Present in both: ${inBoth.join(", ") || "none"}`,
  ].join("\n");
}

function formatShadowOutput(mechanicOutput) {
  if (!mechanicOutput) return "";
  const { self = [], others = [], difficult = [], crossReference = [] } = mechanicOutput;
  return [
    `Recognised in self: ${self.join(", ") || "none"}`,
    `Seen in others, not self: ${others.join(", ") || "none"}`,
    `Difficult to be around: ${difficult.join(", ") || "none"}`,
    `Shadow crossfire (seen in others AND difficult to be around): ${crossReference.join(", ") || "none"}`,
  ].join("\n");
}

function formatAnimaOutput(mechanicOutput) {
  if (!mechanicOutput) return "";
  const { placements = [], extremes = [] } = mechanicOutput;
  const placementLines = placements.map(({ dimension, leftLabel, rightLabel, value }) => {
    const side = value < 50 ? `leans ${leftLabel}` : value > 50 ? `leans ${rightLabel}` : "balanced";
    return `${dimension}: ${value}/100 (${side})`;
  });
  const extremeNames = extremes.map((e) => e.dimension).join(", ");
  return [
    "Spectrum placements:",
    ...placementLines,
    extremes.length ? `\nMost charged dimensions: ${extremeNames}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function formatInnerChildOutput(mechanicOutput) {
  if (!mechanicOutput) return "";
  const { aliveness = "", editing = "", carrying = "", letter = "" } = mechanicOutput;
  return [
    `Aliveness memory: ${aliveness}`,
    `When the editing began: ${editing}`,
    `Still carrying: ${carrying}`,
    letter ? `Letter to younger self: ${letter}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function formatSelfOutput(mechanicOutput) {
  if (!mechanicOutput) return "";
  const { artefacts = {} } = mechanicOutput;
  const lines = Object.entries(artefacts).map(
    ([room, data]) => `${room}: "${data.unlock}"`
  );
  return lines.length
    ? `Artefacts carried in from previous rooms:\n${lines.join("\n")}`
    : "No artefacts yet.";
}

// ─── buildRoomPrompt ──────────────────────────────────────────────────────────
export function buildRoomPrompt(roomKey, mechanicOutput) {
  const psych = ROOM_PSYCHOLOGY[roomKey];
  if (!psych) return "";

  let mechanicText = "";
  switch (roomKey) {
    case "persona":    mechanicText = formatPersonaOutput(mechanicOutput); break;
    case "shadow":     mechanicText = formatShadowOutput(mechanicOutput); break;
    case "anima":      mechanicText = formatAnimaOutput(mechanicOutput); break;
    case "innerchild": mechanicText = formatInnerChildOutput(mechanicOutput); break;
    case "self":       mechanicText = formatSelfOutput(mechanicOutput); break;
    default:           mechanicText = JSON.stringify(mechanicOutput, null, 2);
  }

  const unlockPrompt = ROOM_UNLOCK_PROMPTS[roomKey] ?? "";

  return [
    `── ROOM CONTEXT: ${roomKey.toUpperCase()} ──`,
    `Psychological move: ${psych.move}`,
    "",
    "What the user worked through before this conversation:",
    mechanicText,
    "",
    `Completion condition: ${psych.completionCondition}`,
    "",
    "When the conversation reaches readiness, move gently toward this unlock prompt:",
    unlockPrompt,
    "── END ROOM CONTEXT ──",
  ].join("\n");
}
