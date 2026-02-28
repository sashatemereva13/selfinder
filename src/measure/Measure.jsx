import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import JourneyNav from "../designElements/JourneyNav";
import "./measure.css";

const MEASURE_RESULT_STORAGE_KEY = "selfinder.latestMeasureResult";

const STEP_CONFIG = [
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
    helper: "Choose the speed your system is actually operating at, not what you wish it was.",
    options: [
      {
        value: "stalled",
        label: "Heavy / slowed",
        vibe: "low momentum",
        vibration: 100,
        scores: { calm: 0, clarity: 0, intensity: 0, grounding: 1 },
        meaning: "Your energy may need restoration before momentum can feel natural.",
      },
      {
        value: "steady",
        label: "Steady",
        vibe: "sustainable",
        vibration: 250,
        scores: { calm: 2, clarity: 1, intensity: 0, grounding: 2 },
        meaning: "A stable rhythm is available, which supports consistency over force.",
      },
      {
        value: "charged",
        label: "Charged / fast",
        vibe: "surging",
        vibration: 200,
        scores: { calm: 0, clarity: 1, intensity: 3, grounding: 0 },
        meaning: "There is momentum here, but it may need direction to stay constructive.",
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
        meaning: "Attention may be dispersed, making simple structure especially useful.",
      },
      {
        value: "functional",
        label: "Functional focus",
        vibe: "workable",
        vibration: 250,
        scores: { calm: 1, clarity: 2, intensity: 0, grounding: 1 },
        meaning: "You have enough focus to make progress if the next step stays clear.",
      },
      {
        value: "crisp",
        label: "Crisp / clear",
        vibe: "precise",
        vibration: 400,
        scores: { calm: 1, clarity: 3, intensity: 0, grounding: 1 },
        meaning: "Clarity is available; this is a good moment for decisions and prioritizing.",
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
        meaning: "Your system may be guarding energy and asking for safety first.",
      },
      {
        value: "neutral-body",
        label: "Neutral / okay",
        vibe: "baseline",
        vibration: 200,
        scores: { calm: 1, clarity: 1, intensity: 0, grounding: 1 },
        meaning: "You may be in a workable baseline state with room for small positive shifts.",
      },
      {
        value: "open",
        label: "Open / relaxed",
        vibe: "receptive",
        vibration: 350,
        scores: { calm: 2, clarity: 1, intensity: 0, grounding: 1 },
        meaning: "Relaxation and receptivity suggest your energy can move with less resistance.",
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
        meaning: "Internal pressure may be draining energy faster than effort alone.",
      },
      {
        value: "practical",
        label: "Practical / neutral",
        vibe: "measured",
        vibration: 250,
        scores: { calm: 1, clarity: 2, intensity: 0, grounding: 1 },
        meaning: "A neutral mental tone supports useful action and lower emotional drag.",
      },
      {
        value: "kind",
        label: "Kind / compassionate",
        vibe: "supportive",
        vibration: 500,
        scores: { calm: 2, clarity: 2, intensity: 0, grounding: 0 },
        meaning: "A compassionate tone often increases resilience and sustainable energy.",
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
        meaning: "Defensive motivation can work short-term, but usually costs energy quickly.",
      },
      {
        value: "obligation",
        label: "Responsibility / duty",
        vibe: "steady effort",
        vibration: 200,
        scores: { calm: 1, clarity: 1, intensity: 1, grounding: 1 },
        meaning: "Duty creates movement, and with clarity it can become empowered action.",
      },
      {
        value: "creation",
        label: "Growth / contribution",
        vibe: "expansive",
        vibration: 350,
        scores: { calm: 1, clarity: 2, intensity: 1, grounding: 0 },
        meaning: "Creation-oriented energy usually signals rising capacity and openness.",
      },
    ],
  },
  {
    key: "connection",
    title: "How connected do you feel to others?",
    helper: "Connection can be emotional, practical, or simply a sense of not being alone.",
    options: [
      {
        value: "withdrawn",
        label: "Withdrawn",
        vibe: "isolated",
        vibration: 75,
        scores: { calm: 0, clarity: 0, intensity: 0, grounding: 1 },
        meaning: "There may be a protective withdrawal pattern active in your field.",
      },
      {
        value: "selective",
        label: "Selective but available",
        vibe: "guarded openness",
        vibration: 250,
        scores: { calm: 1, clarity: 1, intensity: 0, grounding: 1 },
        meaning: "You may be preserving energy while still leaving room for support.",
      },
      {
        value: "connected",
        label: "Connected / warm",
        vibe: "relational",
        vibration: 500,
        scores: { calm: 2, clarity: 1, intensity: 0, grounding: 0 },
        meaning: "Warm connection often corresponds with higher coherence and resilience.",
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
        meaning: "Your system may default to protection before action becomes available.",
      },
      {
        value: "push",
        label: "Push / control",
        vibe: "force",
        vibration: 175,
        scores: { calm: 0, clarity: 1, intensity: 2, grounding: 0 },
        meaning: "Force can create motion, but may need balance to stay effective.",
      },
      {
        value: "observe",
        label: "Pause and observe",
        vibe: "aware",
        vibration: 350,
        scores: { calm: 2, clarity: 2, intensity: 0, grounding: 0 },
        meaning: "Observation before reaction suggests rising capacity and self-regulation.",
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
        meaning: "Survival focus is valid, and it often means your energy needs support and recovery.",
      },
      {
        value: "progress",
        label: "Making progress",
        vibe: "building",
        vibration: 250,
        scores: { calm: 1, clarity: 2, intensity: 1, grounding: 1 },
        meaning: "Progress orientation often indicates enough capacity for structured forward movement.",
      },
      {
        value: "service",
        label: "Helping / creating value",
        vibe: "contribution",
        vibration: 400,
        scores: { calm: 1, clarity: 2, intensity: 1, grounding: 0 },
        meaning: "Contribution-focused energy often appears when your field is expanding beyond self-protection.",
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
        meaning: "A smaller horizon may be wise right now if it helps rebuild steadiness.",
      },
      {
        value: "clear-next",
        label: "One clear next move",
        vibe: "practical",
        vibration: 250,
        scores: { calm: 1, clarity: 2, intensity: 0, grounding: 1 },
        meaning: "A clear next move is often the strongest bridge between insight and action.",
      },
      {
        value: "expansive-next",
        label: "A bold or expansive step",
        vibe: "ready",
        vibration: 500,
        scores: { calm: 1, clarity: 2, intensity: 1, grounding: 0 },
        meaning: "An expansive horizon suggests trust, capacity, and greater energetic availability.",
      },
    ],
  },
];

const INITIAL_CHOICES = Object.fromEntries(STEP_CONFIG.map((step) => [step.key, null]));

const VIBRATION_LEVELS = [
  { name: "Shame", slug: "shame", score: 20, route: "/levels/shame" },
  { name: "Guilt", slug: "guilt", score: 30, route: "/levels/guilt" },
  { name: "Apathy", slug: "apathy", score: 50, route: "/levels/apathy" },
  { name: "Grief", slug: "grief", score: 75, route: "/levels/grief" },
  { name: "Fear", slug: "fear", score: 100, route: "/levels/fear" },
  { name: "Desire", slug: "desire", score: 125, route: "/levels/desire" },
  { name: "Anger", slug: "anger", score: 150, route: "/levels/anger" },
  { name: "Pride", slug: "pride", score: 175, route: "/levels/pride" },
  { name: "Courage", slug: "courage", score: 200, route: "/levels/courage" },
  { name: "Neutrality", slug: "neutrality", score: 250, route: "/levels/neutrality" },
  { name: "Willingness", slug: "willingness", score: 310, route: "/levels/willingness" },
  { name: "Acceptance", slug: "acceptance", score: 350, route: "/levels/acceptance" },
  { name: "Reason", slug: "reason", score: 400, route: "/levels/reason" },
  { name: "Love", slug: "love", score: 500, route: "/levels/love" },
  { name: "Unconditional Love", slug: "unconditionallove", score: 540, route: "/levels/unconditionallove" },
  { name: "Peace", slug: "peace", score: 600, route: "/levels/peace" },
  { name: "Enlightenment", slug: "enlightenment", score: 700, route: "/levels/enlightenment" },
];

const STEP_VISUALS = {
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

const STEP_WEIGHTS = {
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

function getSelectedMeta(choices) {
  return STEP_CONFIG.reduce((acc, step) => {
    const match = step.options.find((option) => option.value === choices[step.key]) || null;
    acc[step.key] = match ? { ...match, stepKey: step.key } : null;
    return acc;
  }, {});
}

function getFrequencyBand(scores) {
  const topAxis = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0];

  if (topAxis === "grounding") return "Grounding Band";
  if (topAxis === "calm") return "Restorative Band";
  if (topAxis === "clarity") return "Clarity Band";
  return "Activation Band";
}

function getNearestVibrationLevel(score) {
  return VIBRATION_LEVELS.reduce((closest, level) => {
    if (!closest) return level;
    return Math.abs(level.score - score) < Math.abs(closest.score - score) ? level : closest;
  }, null);
}

function calibrateVibrationScore(rawScore, scores) {
  const center = 250;
  let calibrated = center + (rawScore - center) * 0.88;

  if (scores.clarity >= scores.intensity + 3) calibrated += 18;
  if (scores.calm >= scores.intensity + 2) calibrated += 12;
  if (scores.grounding >= scores.intensity + 2 && calibrated < 250) calibrated += 10;
  if (scores.intensity >= scores.calm + 4 && scores.clarity <= scores.intensity) calibrated -= 10;

  return Math.round(Math.min(700, Math.max(20, calibrated)));
}

function getOptionSignalBars(option) {
  const calm = option.scores?.calm ?? 0;
  const clarity = option.scores?.clarity ?? 0;
  const grounding = option.scores?.grounding ?? 0;
  const intensity = option.scores?.intensity ?? 0;

  return [
    Math.min(100, 18 + calm * 18),
    Math.min(100, 18 + clarity * 18),
    Math.min(100, 18 + grounding * 18),
    Math.min(100, 18 + intensity * 18),
  ];
}

function buildInterpretation(choices) {
  const selected = getSelectedMeta(choices);

  const selectedOptions = Object.values(selected).filter(Boolean);

  if (selectedOptions.length !== STEP_CONFIG.length) {
    return null;
  }

  const scores = { calm: 0, clarity: 0, intensity: 0, grounding: 0 };
  let weightedVibrationTotal = 0;
  let weightTotal = 0;

  selectedOptions.forEach((option) => {
    Object.entries(option.scores).forEach(([axis, value]) => {
      scores[axis] += value;
    });
    const weight = STEP_WEIGHTS[option.stepKey] ?? 1;
    weightedVibrationTotal += (option.vibration || 0) * weight;
    weightTotal += weight;
  });

  const dominantAxis = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  const band = getFrequencyBand(scores);
  const title = `${selected.color.label} • ${selected.sound.label} • ${selected.texture.label}`;
  const rawVibrationScore = Math.round(weightedVibrationTotal / Math.max(weightTotal, 1));
  const vibrationScore = calibrateVibrationScore(rawVibrationScore, scores);
  const vibrationLevel = getNearestVibrationLevel(vibrationScore);

  const axisSummary = {
    calm: "Your current signal looks like a recovery cycle. Softer pacing will support better choices.",
    clarity:
      "Your choices point toward mental organization and perspective. This is a strong moment to simplify and prioritize.",
    grounding:
      "Your system is asking for structure and body-level steadiness before you expand outward.",
    intensity:
      "There is active charge in your field. Direction matters more than force right now.",
  };

  const guidanceByAxis = {
    calm: [
      "Reduce input for 10 minutes: one tab, one task, one breath rhythm.",
      "Choose a slower rhythm than you think you need.",
      "Protect recovery before making a big decision.",
    ],
    clarity: [
      "Write the next 3 actions in order, then start only the first.",
      "Name what is signal and what is noise.",
      "Use short focused work intervals to preserve momentum.",
    ],
    grounding: [
      "Do one physical reset first: water, walk, stretch, or food.",
      "Tidy a small area to create visual stability.",
      "Make your next step concrete and measurable.",
    ],
    intensity: [
      "Channel energy into a time-boxed sprint instead of multitasking.",
      "Move your body before responding to messages or making decisions.",
      "Pick one target for your energy and complete it cleanly.",
    ],
  };

  const microPractice = {
    "soft-tone": "Try 4 slow breaths with a longer exhale than inhale.",
    "deep-bass": "Place both feet on the floor and press down for 20 seconds.",
    "bright-chime": "Open posture, lift your gaze, and take one deliberate inhale.",
  }[selected.sound.value];

  const textureAction = {
    liquid: "Choose a flexible next step: draft, sketch, or brainstorm before finalizing.",
    sparkling: "Change the environment slightly: light, music, or location to refresh energy.",
    grounded: "Use a simple checklist and complete one practical task end-to-end.",
  }[selected.texture.value];

  const colorAffirmation = {
    violet: "I can slow down enough to hear what is true.",
    blue: "Clear and steady is enough for this moment.",
    green: "Balance is progress.",
    yellow: "I can move forward with lightness and focus.",
    red: "I can use strong energy with intention.",
  }[selected.color.value];

  return {
    band,
    title,
    selected,
    scores,
    rawVibrationScore,
    vibrationScore,
    vibrationLevel,
    summary: axisSummary[dominantAxis],
    interpretationLines: [
      selected.color.meaning,
      selected.sound.meaning,
      selected.texture.meaning,
    ],
    dominantAxis,
    guidance: guidanceByAxis[dominantAxis],
    microPractice,
    textureAction,
    affirmation: colorAffirmation,
  };
}

const Measure = () => {
  const [phase, setPhase] = useState("entry");
  const [stepIndex, setStepIndex] = useState(0);
  const [choices, setChoices] = useState(INITIAL_CHOICES);
  const [activePreview, setActivePreview] = useState(null);
  const [isPreviewMuted, setIsPreviewMuted] = useState(false);
  const [previewVolume, setPreviewVolume] = useState(0.55);
  const audioContextRef = useRef(null);
  const activePreviewNodesRef = useRef([]);
  const previewTimerRef = useRef(null);

  const currentStep = STEP_CONFIG[stepIndex];
  const result = buildInterpretation(choices);
  const selectedMeta = getSelectedMeta(choices);

  const totalSelectionSteps = STEP_CONFIG.length;
  const completedSelections = STEP_CONFIG.filter((step) => Boolean(choices[step.key])).length;
  const phaseProgress = {
    entry: 0.05,
    selection: (completedSelections + 1) / (totalSelectionSteps + 3),
    interpretation: 0.8,
    guidance: 0.92,
    completion: 1,
  }[phase];

  const canContinueSelection = Boolean(currentStep && choices[currentStep.key]);

  const clearPreviewTimer = () => {
    if (previewTimerRef.current) {
      window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  };

  const stopSoundPreview = () => {
    activePreviewNodesRef.current.forEach((node) => {
      try {
        node.stop?.();
      } catch {
        // Node may already be stopped.
      }
      try {
        node.disconnect?.();
      } catch {
        // Ignore disconnect errors during cleanup.
      }
    });

    activePreviewNodesRef.current = [];
    clearPreviewTimer();
    setActivePreview(null);
  };

  const getAudioContext = async () => {
    if (typeof window === "undefined") return null;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtx();
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  };

  const playSoundPreview = async (soundValue) => {
    if (isPreviewMuted || previewVolume <= 0) {
      stopSoundPreview();
      return;
    }

    const audioContext = await getAudioContext();
    if (!audioContext) return;

    stopSoundPreview();

    const registerNode = (node) => {
      activePreviewNodesRef.current.push(node);
      return node;
    };

    const now = audioContext.currentTime + 0.01;
    const masterGain = registerNode(audioContext.createGain());
    masterGain.connect(audioContext.destination);
    masterGain.gain.setValueAtTime(0.0001, now);

    let duration = 0.9;
    const level = Math.max(0.05, Math.min(previewVolume, 1));

    if (soundValue === "soft-tone") {
      duration = 1.15;
      const toneA = registerNode(audioContext.createOscillator());
      const toneB = registerNode(audioContext.createOscillator());
      toneA.type = "sine";
      toneB.type = "triangle";
      toneA.frequency.setValueAtTime(392, now);
      toneB.frequency.setValueAtTime(523.25, now + 0.05);
      toneA.connect(masterGain);
      toneB.connect(masterGain);
      masterGain.gain.linearRampToValueAtTime(0.06 * level, now + 0.08);
      masterGain.gain.exponentialRampToValueAtTime(0.02 * level, now + 0.5);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      toneA.start(now);
      toneB.start(now + 0.05);
      toneA.stop(now + duration);
      toneB.stop(now + duration - 0.02);
    }

    if (soundValue === "deep-bass") {
      duration = 1.0;
      const bass = registerNode(audioContext.createOscillator());
      bass.type = "sine";
      bass.frequency.setValueAtTime(82.41, now);
      bass.frequency.exponentialRampToValueAtTime(73.42, now + 0.28);
      bass.frequency.exponentialRampToValueAtTime(65.41, now + duration);
      bass.connect(masterGain);
      masterGain.gain.linearRampToValueAtTime(0.12 * level, now + 0.06);
      masterGain.gain.exponentialRampToValueAtTime(0.03 * level, now + 0.42);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      bass.start(now);
      bass.stop(now + duration);
    }

    if (soundValue === "bright-chime") {
      duration = 0.85;
      const chimeA = registerNode(audioContext.createOscillator());
      const chimeB = registerNode(audioContext.createOscillator());
      chimeA.type = "triangle";
      chimeB.type = "sine";
      chimeA.frequency.setValueAtTime(880, now);
      chimeB.frequency.setValueAtTime(1318.51, now + 0.08);
      chimeA.connect(masterGain);
      chimeB.connect(masterGain);
      masterGain.gain.linearRampToValueAtTime(0.07 * level, now + 0.02);
      masterGain.gain.exponentialRampToValueAtTime(0.015 * level, now + 0.25);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      chimeA.start(now);
      chimeA.stop(now + 0.42);
      chimeB.start(now + 0.08);
      chimeB.stop(now + duration);
    }

    setActivePreview(soundValue);
    previewTimerRef.current = window.setTimeout(() => {
      setActivePreview((current) => (current === soundValue ? null : current));
      previewTimerRef.current = null;
    }, Math.ceil(duration * 1000));
  };

  useEffect(() => {
    if (phase !== "selection" || currentStep?.key !== "sound") {
      stopSoundPreview();
    }
  }, [phase, currentStep?.key]);

  useEffect(() => {
    if (isPreviewMuted) {
      stopSoundPreview();
    }
  }, [isPreviewMuted]);

  useEffect(() => {
    return () => {
      stopSoundPreview();
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !result) return;
    if (!["interpretation", "guidance", "completion"].includes(phase)) return;

    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      vibrationScore: result.vibrationScore,
      rawVibrationScore: result.rawVibrationScore,
      band: result.band,
      dominantAxis: result.dominantAxis,
      vibrationLevel: result.vibrationLevel,
      patternTitle: result.title,
      selected: {
        color: result.selected?.color?.label,
        sound: result.selected?.sound?.label,
        texture: result.selected?.texture?.label,
      },
    };

    try {
      window.localStorage.setItem(MEASURE_RESULT_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage failures (private mode / quota) and keep the flow usable.
    }
  }, [result, phase]);

  const handleSelect = (stepKey, value) => {
    setChoices((prev) => ({ ...prev, [stepKey]: value }));

    if (stepKey === "sound") {
      void playSoundPreview(value);
    }
  };

  const handleBegin = () => {
    setPhase("selection");
    setStepIndex(0);
  };

  const handleNext = () => {
    if (phase === "entry") {
      handleBegin();
      return;
    }

    if (phase === "selection") {
      if (!canContinueSelection) return;

      if (stepIndex < totalSelectionSteps - 1) {
        setStepIndex((prev) => prev + 1);
      } else {
        setPhase("interpretation");
      }

      return;
    }

    if (phase === "interpretation") {
      setPhase("guidance");
      return;
    }

    if (phase === "guidance") {
      setPhase("completion");
    }
  };

  const handleBack = () => {
    if (phase === "selection") {
      if (stepIndex > 0) {
        setStepIndex((prev) => prev - 1);
      } else {
        setPhase("entry");
      }

      return;
    }

    if (phase === "interpretation") {
      setPhase("selection");
      setStepIndex(totalSelectionSteps - 1);
      return;
    }

    if (phase === "guidance") {
      setPhase("interpretation");
      return;
    }

    if (phase === "completion") {
      setPhase("guidance");
    }
  };

  const handleRestart = () => {
    setChoices(INITIAL_CHOICES);
    setPhase("entry");
    setStepIndex(0);
  };

  const jumpToStep = (index) => {
    setPhase("selection");
    setStepIndex(index);
  };

  const showWizardNav = phase !== "entry";

  return (
    <div className={`measure-page phase-${phase}`}>
      <div className="measure-bg-orb orb-a" aria-hidden="true" />
      <div className="measure-bg-orb orb-b" aria-hidden="true" />
      <div className="measure-grid" aria-hidden="true" />

      <div className="measure-shell">
        <div className="measure-topbar">
          <Link to="/" className="measure-backButton">
            Back Home
          </Link>

          <div className="measure-progressWrap" aria-label="Progress">
            <div className="measure-progressMeta">
              <span>measure</span>
              <span>{Math.round(phaseProgress * 100)}%</span>
            </div>
            <div className="measure-progressTrack">
              <div
                className="measure-progressFill"
                style={{ width: `${Math.round(phaseProgress * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="measure-journeyNavWrap">
          <JourneyNav
            variant="compact"
            currentKey="measure"
            title="Narrative Flow"
            subtitle="Measure first to read the field, then continue into timing and regulation."
            primaryAction={{
              to: "/luna",
              label: phase === "completion" ? "Continue to Luna" : "Open Luna Context",
            }}
          />
        </div>

        <section className="measure-panel" aria-live="polite">
          {phase === "entry" && (
            <div className="measure-phaseBlock">
              <p className="measure-kicker">Frequency Check-In</p>
              <h1 className="measure-title">Take a quick reading of your current frequency</h1>
              <p className="measure-copy">
                This is a reflection tool, not a diagnosis. Follow instinct first, then use the
                reading to choose one grounded action you can actually do now.
              </p>
              <div className="measure-actionRow">
                <button type="button" className="measure-btn measure-btn-primary" onClick={handleBegin}>
                  Begin
                </button>
              </div>
            </div>
          )}

          {phase === "selection" && currentStep && (
            <div className="measure-phaseBlock">
              <p className="measure-kicker">
                Step {stepIndex + 1} of {totalSelectionSteps}
              </p>
              <h2 className="measure-title">{currentStep.title}</h2>
              <p className="measure-copy">
                {currentStep.helper}
                {currentStep.key === "sound" ? " Tap a card to hear and select a preview." : ""}
              </p>

              {currentStep.key === "sound" && (
                <div className="measure-audioControls" role="group" aria-label="Sound preview controls">
                  <button
                    type="button"
                    className={`measure-audioToggle ${isPreviewMuted ? "is-muted" : ""}`}
                    onClick={() => setIsPreviewMuted((prev) => !prev)}
                  >
                    {isPreviewMuted ? "Unmute previews" : "Mute previews"}
                  </button>

                  <label className="measure-volumeControl">
                    <span>Preview volume</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={Math.round(previewVolume * 100)}
                      onChange={(event) => setPreviewVolume(Number(event.target.value) / 100)}
                    />
                    <span className="measure-volumeValue">{Math.round(previewVolume * 100)}%</span>
                  </label>
                </div>
              )}

              <div className={`measure-options measure-options-${currentStep.key}`}>
                {currentStep.options.map((option) => {
                  const isSelected = choices[currentStep.key] === option.value;
                  const signalBars = getOptionSignalBars(option);
                  const stepVisual = STEP_VISUALS[currentStep.key];

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`measure-optionCard ${isSelected ? "is-selected" : ""} ${
                        currentStep.key === "color" ? "is-color" : ""
                      } ${activePreview === option.value ? "is-previewing" : ""}`}
                      onClick={() => handleSelect(currentStep.key, option.value)}
                      aria-pressed={isSelected}
                    >
                      {currentStep.key === "color" && (
                        <span
                          className="measure-colorSwatch"
                          style={{ backgroundColor: option.swatch }}
                          aria-hidden="true"
                        />
                      )}
                      {currentStep.key === "texture" && (
                        <span
                          className={`measure-textureSwatch measure-texture-${option.value}`}
                          aria-hidden="true"
                        >
                          <span className="measure-textureLayer layer-a" />
                          <span className="measure-textureLayer layer-b" />
                        </span>
                      )}
                      {currentStep.key !== "color" &&
                        currentStep.key !== "texture" &&
                        currentStep.key !== "sound" && (
                          <span className={`measure-optionVisual measure-visual-${currentStep.key}`} aria-hidden="true">
                            {stepVisual && (
                              <span className="measure-optionBadge">
                                <span className="measure-optionBadgeIcon">{stepVisual.icon}</span>
                                <span className="measure-optionBadgeText">{stepVisual.label}</span>
                              </span>
                            )}
                            <span className="measure-signalBars">
                              {signalBars.map((height, index) => (
                                <span
                                  key={`${option.value}-${index}`}
                                  className={`measure-signalBar bar-${index + 1}`}
                                  style={{ height: `${height}%` }}
                                />
                              ))}
                            </span>
                          </span>
                        )}
                      <span className="measure-optionLabel">{option.label}</span>
                      <span className="measure-optionVibe">{option.vibe}</span>
                      {currentStep.key === "sound" && activePreview === option.value && (
                        <span className="measure-optionStatus">previewing</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="measure-stepDots" aria-hidden="true">
                {STEP_CONFIG.map((step, index) => (
                  <span
                    key={step.key}
                    className={`measure-stepDot ${index === stepIndex ? "is-current" : ""} ${
                      choices[step.key] ? "is-done" : ""
                    }`}
                  />
                ))}
              </div>

              <div className="measure-actionRow">
                <button type="button" className="measure-btn" onClick={handleBack}>
                  {stepIndex === 0 ? "Back" : "Previous"}
                </button>
                <button
                  type="button"
                  className="measure-btn measure-btn-primary"
                  onClick={handleNext}
                  disabled={!canContinueSelection}
                >
                  {stepIndex === totalSelectionSteps - 1 ? "Read My Pattern" : "Next"}
                </button>
              </div>
            </div>
          )}

          {phase === "interpretation" && result && (
            <div className="measure-phaseBlock">
              <p className="measure-kicker">
                {result.band} • Level estimate: {result.vibrationLevel.name} ({result.vibrationLevel.score})
              </p>
              <h2 className="measure-title">{result.title}</h2>
              <p className="measure-copy">{result.summary}</p>

              <div className="measure-chipRow">
                {STEP_CONFIG.map((step, index) => (
                  <button
                    key={step.key}
                    type="button"
                    className="measure-chip"
                    onClick={() => jumpToStep(index)}
                  >
                    {step.key}: {selectedMeta[step.key]?.label}
                  </button>
                ))}
              </div>

              <div className="measure-cardStack">
                {result.interpretationLines.map((line) => (
                  <div className="measure-insightCard" key={line}>
                    {line}
                  </div>
                ))}
              </div>

              <div className="measure-actionRow">
                <button type="button" className="measure-btn" onClick={handleBack}>
                  Back
                </button>
                <button type="button" className="measure-btn measure-btn-primary" onClick={handleNext}>
                  Get Guidance
                </button>
              </div>
            </div>
          )}

          {phase === "guidance" && result && (
            <div className="measure-phaseBlock">
              <p className="measure-kicker">Guidance</p>
              <h2 className="measure-title">Work with the signal, not against it</h2>

              <div className="measure-guidanceGrid">
                <div className="measure-guidancePanel">
                  <h3>Next 10 minutes</h3>
                  <ul className="measure-list">
                    {result.guidance.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="measure-guidancePanel">
                  <h3>Micro practice</h3>
                  <p>{result.microPractice}</p>
                  <h3>Action style</h3>
                  <p>{result.textureAction}</p>
                  <h3>Affirmation</h3>
                  <p className="measure-affirmation">“{result.affirmation}”</p>
                </div>
              </div>

              <div className="measure-actionRow">
                <button type="button" className="measure-btn" onClick={handleBack}>
                  Back
                </button>
                <button type="button" className="measure-btn measure-btn-primary" onClick={handleNext}>
                  Finish
                </button>
              </div>
            </div>
          )}

          {phase === "completion" && result && (
            <div className="measure-phaseBlock">
              <p className="measure-kicker">Complete</p>
              <h2 className="measure-title">Your reading is ready to use</h2>
              <p className="measure-copy">
                Return later and compare what changed. The value is not the label itself, but the
                pattern shifts you begin to notice over time.
              </p>

              <div className="measure-levelCard">
                <div className="measure-levelTop">
                  <span className="measure-summaryLabel">Estimated vibration level</span>
                  <span className="measure-levelScore">{result.vibrationLevel.score}</span>
                </div>
                <div className="measure-levelName">{result.vibrationLevel.name}</div>
                <p className="measure-levelCopy">
                  Based on your 10 responses, this is the closest match from your levels list.
                  Use it as a reflective checkpoint, not a fixed identity.
                </p>
                <div className="measure-actionRow measure-levelActions">
                  <Link
                    to={result.vibrationLevel.route}
                    className="measure-btn measure-btn-primary"
                  >
                    Open {result.vibrationLevel.name}
                  </Link>
                </div>
              </div>

              <div className="measure-completionSummary">
                <div>
                  <span className="measure-summaryLabel">Band</span>
                  <strong>{result.band}</strong>
                </div>
                <div>
                  <span className="measure-summaryLabel">Pattern</span>
                  <strong>{result.title}</strong>
                </div>
                <div>
                  <span className="measure-summaryLabel">Dominant axis</span>
                  <strong>{result.dominantAxis}</strong>
                </div>
                <div>
                  <span className="measure-summaryLabel">Average vibration score</span>
                  <strong>{result.vibrationScore}</strong>
                </div>
              </div>

              <div className="measure-actionRow">
                {showWizardNav && (
                  <button type="button" className="measure-btn" onClick={handleBack}>
                    Back
                  </button>
                )}
                <button type="button" className="measure-btn measure-btn-primary" onClick={handleRestart}>
                  Restart
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Measure;
