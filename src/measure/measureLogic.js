import {
  STEP_CONFIG,
  VIBRATION_LEVELS,
  STEP_WEIGHTS,
  SIGNAL_AXES,
} from "./measureConfig";

export function getSelectedMeta(choices) {
  return STEP_CONFIG.reduce((acc, step) => {
    const match =
      step.options.find((option) => option.value === choices[step.key]) || null;
    acc[step.key] = match ? { ...match, stepKey: step.key } : null;
    return acc;
  }, {});
}

export function getFrequencyBand(scores) {
  const topAxis = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0];

  if (topAxis === "grounding") return "Grounding Band";
  if (topAxis === "calm") return "Restorative Band";
  if (topAxis === "clarity") return "Clarity Band";
  return "Activation Band";
}

export function getNearestVibrationLevel(score) {
  return VIBRATION_LEVELS.reduce((closest, level) => {
    if (!closest) return level;
    return Math.abs(level.score - score) < Math.abs(closest.score - score)
      ? level
      : closest;
  }, null);
}

export function calibrateVibrationScore(rawScore, scores) {
  const center = 250;
  let calibrated = center + (rawScore - center) * 0.88;

  if (scores.clarity >= scores.intensity + 3) calibrated += 18;
  if (scores.calm >= scores.intensity + 2) calibrated += 12;
  if (scores.grounding >= scores.intensity + 2 && calibrated < 250)
    calibrated += 10;
  if (scores.intensity >= scores.calm + 4 && scores.clarity <= scores.intensity)
    calibrated -= 10;

  return Math.round(Math.min(700, Math.max(20, calibrated)));
}

export function getOptionSignalBars(option) {
  return SIGNAL_AXES.map((axis) => {
    const score = option.scores?.[axis.key] ?? 0;
    return {
      ...axis,
      score,
      height: Math.min(100, 18 + score * 18),
    };
  });
}

export function buildInterpretation(choices) {
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
  const rawVibrationScore = Math.round(
    weightedVibrationTotal / Math.max(weightTotal, 1),
  );
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
    "bright-chime":
      "Open posture, lift your gaze, and take one deliberate inhale.",
  }[selected.sound.value];

  const textureAction = {
    liquid:
      "Choose a flexible next step: draft, sketch, or brainstorm before finalizing.",
    sparkling:
      "Change the environment slightly: light, music, or location to refresh energy.",
    grounded:
      "Use a simple checklist and complete one practical task end-to-end.",
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
