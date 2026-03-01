import { useEffect, useRef, useState } from "react";
import "./measure.css";
import {
  MEASURE_RESULT_STORAGE_KEY,
  STEP_CONFIG,
  INITIAL_CHOICES,
  STEP_VISUALS,
  SIGNAL_AXES,
  MEANING_VISUALS,
  HORIZON_VISUALS,
} from "./measureConfig";
import { buildInterpretation, getOptionSignalBars, getSelectedMeta } from "./measureLogic";
import {
  MeasureTopBar,
  MeasureEntryPhase,
  MeasureSelectionPhase,
  MeasureInterpretationPhase,
  MeasureGuidancePhase,
  MeasureCompletionPhase,
} from "./MeasurePhaseViews";

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
  const selectedOptionForCurrentStep =
    currentStep?.options.find((option) => option.value === choices[currentStep.key]) || null;

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
      // Ignore storage failures and keep the flow usable.
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
        <MeasureTopBar phaseProgress={phaseProgress} />

        <section className="measure-panel" aria-live="polite">
          {phase === "entry" && <MeasureEntryPhase onBegin={handleBegin} />}

          {phase === "selection" && currentStep && (
            <MeasureSelectionPhase
              stepIndex={stepIndex}
              totalSelectionSteps={totalSelectionSteps}
              currentStep={currentStep}
              choices={choices}
              activePreview={activePreview}
              isPreviewMuted={isPreviewMuted}
              onTogglePreviewMute={() => setIsPreviewMuted((prev) => !prev)}
              previewVolume={previewVolume}
              onPreviewVolumeChange={(event) =>
                setPreviewVolume(Number(event.target.value) / 100)
              }
              onSelect={handleSelect}
              selectedOptionForCurrentStep={selectedOptionForCurrentStep}
              stepConfig={STEP_CONFIG}
              getOptionSignalBars={getOptionSignalBars}
              stepVisuals={STEP_VISUALS}
              signalAxes={SIGNAL_AXES}
              meaningVisuals={MEANING_VISUALS}
              horizonVisuals={HORIZON_VISUALS}
              canContinueSelection={canContinueSelection}
              onBack={handleBack}
              onNext={handleNext}
            />
          )}

          {phase === "interpretation" && result && (
            <MeasureInterpretationPhase
              result={result}
              stepConfig={STEP_CONFIG}
              selectedMeta={selectedMeta}
              onJumpToStep={jumpToStep}
              onBack={handleBack}
              onNext={handleNext}
            />
          )}

          {phase === "guidance" && result && (
            <MeasureGuidancePhase result={result} onBack={handleBack} onNext={handleNext} />
          )}

          {phase === "completion" && result && (
            <MeasureCompletionPhase
              result={result}
              showBack={showWizardNav}
              onBack={handleBack}
              onRestart={handleRestart}
            />
          )}
        </section>
      </div>
    </div>
  );
};

export default Measure;
