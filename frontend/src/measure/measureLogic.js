import {
  STEP_CONFIG,
  VIBRATION_LEVELS,
  STEP_WEIGHTS,
  SIGNAL_AXES,
  LINES,
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

function computeResultForOptions(options) {
  const scores = { calm: 0, clarity: 0, intensity: 0, grounding: 0 };
  let weightedVibrationTotal = 0;
  let weightTotal = 0;

  options.forEach((option) => {
    Object.entries(option.scores).forEach(([axis, value]) => {
      scores[axis] += value;
    });
    const weight = STEP_WEIGHTS[option.stepKey] ?? 1;
    weightedVibrationTotal += (option.vibration || 0) * weight;
    weightTotal += weight;
  });

  const dominantAxis = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  const band = getFrequencyBand(scores);
  const rawVibrationScore = Math.round(
    weightedVibrationTotal / Math.max(weightTotal, 1),
  );
  const vibrationScore = calibrateVibrationScore(rawVibrationScore, scores);
  const vibrationLevel = getNearestVibrationLevel(vibrationScore);

  return { scores, dominantAxis, band, rawVibrationScore, vibrationScore, vibrationLevel };
}

export function buildInterpretation(choices) {
  const selected = getSelectedMeta(choices);

  const selectedOptions = Object.values(selected).filter(Boolean);

  if (selectedOptions.length !== STEP_CONFIG.length) {
    return null;
  }

  const { scores, dominantAxis, band, rawVibrationScore, vibrationScore, vibrationLevel } =
    computeResultForOptions(selectedOptions);

  const microPractice = {
    "soft-tone": "Try 4 slow breaths with a longer exhale than inhale.",
    "deep-bass": "Place both feet on the floor and press down for 20 seconds.",
    "bright-chime":
      "Open posture, lift your gaze, and take one deliberate inhale.",
  }[selected.sound.value];

  const colorAffirmation = {
    violet: "I can slow down enough to hear what is true.",
    blue: "Clear and steady is enough for this moment.",
    green: "Balance is progress.",
    yellow: "I can move forward with lightness and focus.",
    red: "I can use strong energy with intention.",
  }[selected.color.value];

  const lines = LINES.map((line) => {
    const lineOptions = line.steps.map((key) => selected[key]).filter(Boolean);
    const lineResult = computeResultForOptions(lineOptions);
    return {
      key: line.key,
      label: line.label,
      helper: line.helper,
      ...lineResult,
    };
  });

  return {
    band,
    selected,
    scores,
    rawVibrationScore,
    vibrationScore,
    vibrationLevel,
    dominantAxis,
    microPractice,
    affirmation: colorAffirmation,
    lines,
  };
}
