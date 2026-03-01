import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import JourneyNav from "./designElements/JourneyNav";
import "./css/threshold.css";

const VIBRATION_OPTIONS = [
  {
    key: "dense",
    label: "Dense",
    cue: "Low battery / high noise",
    note: "Start gently. Reduce input before asking for clarity.",
  },
  {
    key: "neutral",
    label: "Neutral",
    cue: "Steady / readable",
    note: "A good moment to map your signal before momentum builds.",
  },
  {
    key: "elevated",
    label: "Elevated",
    cue: "Open / charged",
    note: "Use the core to direct energy, not just amplify it.",
  },
];

export default function ThresholdPage() {
  const shellRef = useRef(null);
  const [selectedVibration, setSelectedVibration] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      const vh = window.innerHeight || 1;
      const progress = Math.max(0, Math.min(1, y / (vh * 0.9)));
      setScrollProgress(progress);
      if (progress > 0.22) {
        setIsUnlocked(true);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const unlockByVibration = (key) => {
    setSelectedVibration(key);
    setIsUnlocked(true);
  };

  const selectedMeta = useMemo(
    () =>
      VIBRATION_OPTIONS.find((option) => option.key === selectedVibration) ||
      null,
    [selectedVibration],
  );

  const hintText = selectedMeta
    ? selectedMeta.note
    : "Scroll to open the threshold, or choose the vibration that feels closest to your current state.";

  return (
    <div ref={shellRef} className="thresholdPage">
      <div className="thresholdGlow thresholdGlowA" aria-hidden="true" />
      <div className="thresholdGlow thresholdGlowB" aria-hidden="true" />

      <section className="thresholdHero">
        <div className="thresholdTopRow">
          <JourneyNav
            variant="overlay"
            currentKey="threshold"
            title="Primary Journey"
            subtitle="Move from threshold to core, then continue into signal mapping."
            primaryAction={{
              to: isUnlocked ? "/core" : "#threshold-calibration",
              label: isUnlocked ? "Enter Neural Core" : "Open Threshold",
            }}
          />
        </div>

        <div className="thresholdGrid">
          <div id="threshold-calibration" className="thresholdCalibrationPanel">
            <div className="thresholdPanelHeader">
              <p className="sf-kicker">Vibration Calibration</p>
              <p className="thresholdProgressLabel">
                {Math.round(scrollProgress * 100)}% scroll signal
              </p>
            </div>

            <div className="thresholdProgressTrack" aria-hidden="true">
              <span style={{ width: `${Math.round(scrollProgress * 100)}%` }} />
            </div>

            <div className="thresholdVibeOptions">
              {VIBRATION_OPTIONS.map((option) => {
                const isSelected = selectedVibration === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`thresholdVibeCard ${isSelected ? "is-selected" : ""}`}
                    onClick={() => unlockByVibration(option.key)}
                    aria-pressed={isSelected}
                  >
                    <span className="thresholdVibeLabel">{option.label}</span>
                    <span className="thresholdVibeCue">{option.cue}</span>
                  </button>
                );
              })}
            </div>

            <div className="thresholdGuidanceBox">
              <p>{hintText}</p>
            </div>

            <div className="thresholdActions">
              <Link
                to={isUnlocked ? "/core" : "/measure"}
                className={`sf-btn sf-btn-primary ${isUnlocked ? "" : "is-dimmed"}`}
              >
                {isUnlocked
                  ? "Enter Neural Core"
                  : "Start with Measure Instead"}
              </Link>
              <Link to="/measure" className="sf-btn">
                Go straight to Measure
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
