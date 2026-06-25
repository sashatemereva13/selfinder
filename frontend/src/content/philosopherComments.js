export const PHILOSOPHER_COMMENTS = {
  socrates: {
    "/":           "What do you expect to find here — and where did that expectation come from?",
    "/depths":     "A number won't tell you who you are. But it will tell you where to look. What are you afraid it will say?",
    "/self":       "You have been asking questions your whole life. What is the one you haven't dared to ask?",
    "/measure":    "What number do you hope it gives you? That hope is worth more attention than the score.",
    "/luna":       "The moon has no opinion of you. Does that disturb you, or free you?",
    "/tunein":     "Before you listen — what are you hoping to hear?",
    "/levels":     "Which level do you secretly believe you deserve? Start there.",
    "/space":      "A room of your own. Tell me — what did you find today that surprised you?",
  },
  stoics: {
    "/":           "You chose to be here. That choice is entirely yours. That is enough.",
    "/depths":     "Whatever the reading shows you, it is not a verdict. It is information. What you do with it is yours.",
    "/self":       "Strip away the roles. Strip away the opinions. What remains is what was always yours.",
    "/measure":    "Feel it clearly. The signal is information. What you do with it is yours.",
    "/luna":       "Nature has its rhythm. Fighting cycles that do not belong to you is how exhaustion begins.",
    "/tunein":     "Before you can return to yourself, notice how far you have drifted.",
    "/levels":     "You are not trapped at any level. You are also not in control of where you begin — only of where you move from here.",
    "/space":      "Here is what belongs to you. The work done, the choices made. Review them honestly.",
  },
  kierkegaard: {
    "/":           "The anxiety you feel at the threshold — it is not a warning. It is the sensation of being free.",
    "/depths":     "A score is a single moment, not a sentence. What will you do with the anxiety of not knowing what it will say?",
    "/self":       "Not the self others handed you. Not the one you performed. The one that has been waiting.",
    "/measure":    "A number cannot hold the weight of an existence. But it can point toward the next honest question.",
    "/luna":       "Time, for the soul, has its own seasons. Trust the rhythm over the calendar.",
    "/tunein":     "You cannot hear what is real in you while performing for an audience that is not here.",
    "/levels":     "You are always standing at the edge of the next thing. What is it costing you to stay where you are?",
    "/space":      "Your own space. Few people ever truly occupy one.",
  },
  camus: {
    "/":           "You are here. That is already a choice — and in the absurd, choice is the only honest answer.",
    "/depths":     "A diamond has many faces and is still one stone. Body, mind, heart, spirit — none of them need to apologise for the others.",
    "/self":       "There is no final self waiting ready-made. There is only who you are willing to be today.",
    "/measure":    "Even Sisyphus needed to know where the boulder was. A score is a beginning, not a verdict.",
    "/luna":       "The moon moves in cycles that have nothing to do with you. There is something clarifying in that indifference.",
    "/tunein":     "Listen without wanting it to mean something. Sometimes a sound is just a sound. That is enough.",
    "/levels":     "Consciousness is not a ladder toward a reward. It is a territory to inhabit as honestly as you can.",
    "/space":      "A record of being here. That is not nothing. That is, in fact, everything.",
  },
  aristotle: {
    "/":           "Every journey begins with a choice to move. What kind of person do you intend to build here?",
    "/depths":     "A person is not one virtue practiced everywhere equally. Different parts of a life ripen at different times. Feel into each.",
    "/self":       "The good life is not arrived at. It is practiced, daily, until it becomes indistinguishable from who you are.",
    "/measure":    "Self-knowledge is the foundation of all virtue. Feel it clearly, then decide what it asks you to practice.",
    "/luna":       "Nature has its rhythms. The wise act in accordance with them, not against them.",
    "/tunein":     "The body knows things the mind has not yet articulated. Listen with that as your guide.",
    "/levels":     "You are always becoming. Every level shows you where your practice needs to go next.",
    "/space":      "Review what you have done. Virtue grows from honest reflection on practice.",
  },
};

const PAGE_CONTEXT = {
  "/": {
    label: "The Threshold",
    description: "The entry into the experience. A place of arrival, opening, and first choice.",
    themes: ["arrival", "threshold", "beginning"],
  },
  "/depths": {
    label: "The Depths",
    description: "Feel into your vibration across body, mind, heart, and spirit, gathered into one diamond — then read what that level is useful for.",
    themes: ["vibration", "self-inquiry", "many parts"],
  },
  "/self": {
    label: "The Self",
    description: "A room about integration, wholeness, and the meeting of conscious and unconscious life.",
    themes: ["integration", "wholeness", "selfhood"],
  },
  "/measure": {
    label: "Feel",
    description: "A tool that offers a frequency reading — not a verdict, just information about where you are right now.",
    themes: ["feeling", "self-inquiry", "signal"],
  },
  "/luna": {
    label: "Luna",
    description: "A tool for understanding timing, cycles, and the lunar rhythm.",
    themes: ["cycles", "timing", "moon"],
  },
  "/tunein": {
    label: "Tune In",
    description: "A space for regulation, listening inward, and returning to the body.",
    themes: ["regulation", "listening", "return"],
  },
  "/levels": {
    label: "Levels",
    description: "A map of consciousness and emotional development across different levels.",
    themes: ["levels", "consciousness", "orientation"],
  },
  "/space": {
    label: "Your Space",
    description: "A personal area for reviewing progress, saved data, and choices made in the journey.",
    themes: ["reflection", "privacy", "review"],
  },
  "/login": {
    label: "Sign In",
    description: "A page for creating an account or returning to an existing one.",
    themes: ["access", "account", "entry"],
  },
};

export function resolveCommentPath(pathname) {
  if (!pathname) return "/";
  if (pathname === "/" || pathname.startsWith("/threshold")) return "/";
  if (pathname.startsWith("/depths/spheres")) return "/measure";
  if (pathname.startsWith("/depths")) return "/depths";
  if (pathname.startsWith("/self") && !pathname.startsWith("/selfinder")) return "/self";
  if (pathname.startsWith("/measure")) return "/measure";
  if (pathname.startsWith("/luna")) return "/luna";
  if (pathname.startsWith("/tunein")) return "/tunein";
  if (pathname.startsWith("/levels")) return "/levels";
  if (pathname.startsWith("/space")) return "/space";
  if (pathname.startsWith("/login")) return "/login";
  return pathname;
}

function humanizePath(pathname) {
  return pathname
    .replace(/^\//, "")
    .split(/[/-]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ") || "This Page";
}

export function getPhilosopherComment(philosopherId, pathname) {
  const resolvedPath = resolveCommentPath(pathname);
  return PHILOSOPHER_COMMENTS[philosopherId]?.[resolvedPath] ?? null;
}

export function getBadgePageContext(pathname) {
  const resolvedPath = resolveCommentPath(pathname);
  const knownContext = PAGE_CONTEXT[resolvedPath];

  if (knownContext) {
    return {
      pathname: resolvedPath,
      ...knownContext,
    };
  }

  return {
    pathname: resolvedPath,
    label: humanizePath(resolvedPath),
    description: "A page within the Selfinder journey.",
    themes: ["journey", "reflection"],
  };
}

export function getBadgeSupplementalCopy(pathname) {
  const resolvedPath = resolveCommentPath(pathname);
  void resolvedPath;
  return null;
}
