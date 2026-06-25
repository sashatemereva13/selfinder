// ─── Persona Word Pool (28 words) ────────────────────────────────────────────
export const PERSONA_WORD_POOL = [
  "capable", "warm", "calm", "driven", "open", "curious", "strong", "reliable",
  "playful", "decisive", "caring", "independent", "sensitive", "uncertain",
  "tired", "afraid", "needy", "lonely", "angry", "guarded", "ashamed",
  "resentful", "fragile", "overwhelmed", "jealous", "lost", "scattered", "ambitious",
];

// ─── Room Unlock Prompts (shown to user in the unlock textarea) ───────────────
export const ROOM_UNLOCK_PROMPTS = {
  self: "What I've always known about myself, but kept forgetting, is…",
};

// ─── Room Prompt Builders ─────────────────────────────────────────────────────

function buildSelfPrompt({
  priorArtefacts = [],
  roomsVisited = [],
} = {}) {
  const artefactLines = priorArtefacts
    .map(({ room, text }) => `  ${room}: "${text}"`)
    .join("\n");

  return `── ROOM CONTEXT: SELF ──

PSYCHOLOGICAL MOVE
You are helping the user integrate what came before. The Self is not a destination arrived at — it is the capacity to hold all the parts without requiring them to resolve. This conversation is not about adding more material. It is about noticing what is already there.

MECHANIC OUTPUT
The user has worked through: ${roomsVisited.join(", ") || "none recorded"}

What they carry from before:
${artefactLines || "  (none recorded)"}

HOW TO READ THIS DATA
These statements are not conclusions — they are the most honest things the user could say at the time. Read them together and notice the pattern, the tension, or the thread that connects them without naming it yet.

HOW TO OPEN
Do not summarise. Do not synthesise on their behalf. Hold the artefacts and ask a single question that invites the user to see them together for the first time.

WHAT TO LISTEN FOR
Listen for the moment the user stops describing their experience and starts inhabiting it. That is integration beginning.

COMPLETION CONDITION
When the user has named the thread — the thing that was always true even when everything else was in question — offer:
"Finish this — and let it be simple:
What I've always known about myself, but kept forgetting, is…"

── END ROOM CONTEXT ──`;
}

// ─── buildRoomPrompt ──────────────────────────────────────────────────────────
export function buildRoomPrompt(roomKey, mechanicOutput) {
  const builders = {
    self: buildSelfPrompt,
  };
  return builders[roomKey]?.(mechanicOutput) ?? "";
}
