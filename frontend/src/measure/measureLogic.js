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
  const title = `${selected.color.label} • ${selected.sound.label} • ${selected.texture.label}`;

  const axisSummary = {
    calm: "Your signal is a recovery cycle, not a problem to fix. Nothing here needs forcing — just less to push against.",
    clarity:
      "Your signal is already organizing itself toward perspective. There's nothing wrong with where you are — this clarity is doing its own sorting.",
    grounding:
      "Your system is asking for structure and body-level steadiness before anything else moves. That's not a delay — it's the order this naturally happens in.",
    intensity:
      "There is real charge in your field right now. It isn't a flaw to suppress — it's energy that hasn't found its direction yet.",
  };

  const guidanceByAxis = {
    calm: [
      "Notice what's actually asking for your attention right now — everything else is allowed to wait.",
      "A slower rhythm than you think you need is allowed here, not a sign of falling behind.",
      "If a big decision is pulling at you, it can rest until the recovery has had its turn.",
    ],
    clarity: [
      "Notice what's signal and what's noise — that noticing is most of the work already done.",
      "If it helps, let one action go first and leave the rest for later.",
      "Short, unhurried intervals tend to suit this clarity better than one long push.",
    ],
    grounding: [
      "Your body is part of the signal too — water, a walk, or food can be the whole next step.",
      "If it helps, tidy one small thing — not for productivity, just for visual steadiness.",
      "Let the next step be small and concrete rather than ambitious.",
    ],
    intensity: [
      "This charge isn't a problem to manage — it's energy looking for a direction. Notice where it wants to go.",
      "Moving your body before responding to anything tends to give it somewhere to land.",
      "If it helps, give it one place to go rather than several.",
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

  const lines = LINES.map((line) => {
    const lineOptions = line.steps.map((key) => selected[key]).filter(Boolean);
    const lineResult = computeResultForOptions(lineOptions);
    return {
      key: line.key,
      label: line.label,
      helper: line.helper,
      ...lineResult,
      summary: axisSummary[lineResult.dominantAxis],
      guidance: guidanceByAxis[lineResult.dominantAxis],
    };
  });

  const focusLine = lines.reduce(
    (lowest, line) => (line.vibrationScore < lowest.vibrationScore ? line : lowest),
    lines[0],
  );

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
    lines,
    focusLine,
  };
}
