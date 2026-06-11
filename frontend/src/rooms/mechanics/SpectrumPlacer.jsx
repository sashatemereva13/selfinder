import { useState } from "react";
import { ANIMA_SPECTRUMS } from "../../content/roomContent";

function SpectrumSlider({ spectrum, value, onChange }) {
  const deviation = Math.abs(value - 50);
  const sideLabel =
    value < 50 ? spectrum.leftLabel : value > 50 ? spectrum.rightLabel : "balanced";

  return (
    <div className="re-spectrum-row">
      <div className="re-spectrum-labels">
        <span className={`re-spectrum-left-label${value < 50 ? " re-spectrum-label--active" : ""}`}>
          {spectrum.leftLabel}
        </span>
        <span className="re-spectrum-dimension">{spectrum.dimension}</span>
        <span className={`re-spectrum-right-label${value > 50 ? " re-spectrum-label--active" : ""}`}>
          {spectrum.rightLabel}
        </span>
      </div>
      <input
        type="range"
        className="re-spectrum-slider"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <p className="re-spectrum-reading">
        {value === 50 ? "Balanced" : `Leans ${sideLabel} (${deviation} away from centre)`}
      </p>
    </div>
  );
}

export default function SpectrumPlacer({ onComplete }) {
  const [values, setValues] = useState(
    Object.fromEntries(ANIMA_SPECTRUMS.map((s) => [s.dimension, s.default]))
  );

  function setValue(dimension, value) {
    setValues((prev) => ({ ...prev, [dimension]: value }));
  }

  function handleComplete() {
    const placements = ANIMA_SPECTRUMS.map((s) => ({
      dimension: s.dimension,
      leftLabel: s.leftLabel,
      rightLabel: s.rightLabel,
      value: values[s.dimension],
    }));

    // Sort by deviation from 50 descending, take top 2
    const sorted = [...placements].sort(
      (a, b) => Math.abs(b.value - 50) - Math.abs(a.value - 50)
    );
    const extremes = sorted.slice(0, 2).filter((p) => Math.abs(p.value - 50) > 5);

    onComplete({ placements, extremes });
  }

  // Calculate extremes for live preview
  const placements = ANIMA_SPECTRUMS.map((s) => ({
    dimension: s.dimension,
    leftLabel: s.leftLabel,
    rightLabel: s.rightLabel,
    value: values[s.dimension],
  }));
  const sortedForPreview = [...placements].sort(
    (a, b) => Math.abs(b.value - 50) - Math.abs(a.value - 50)
  );
  const extremeDimensions = sortedForPreview
    .slice(0, 2)
    .filter((p) => Math.abs(p.value - 50) > 5)
    .map((p) => p.dimension);

  return (
    <div className="re-mechanic re-mechanic--spectrum">
      <div className="re-mechanic-header">
        <h3 className="re-mechanic-title">The Spectrums</h3>
        <p className="re-mechanic-desc">
          Place yourself on each axis. There is no correct position — only your honest one.
        </p>
      </div>

      <div className="re-spectrum-list">
        {ANIMA_SPECTRUMS.map((s) => (
          <div
            key={s.dimension}
            className={`re-spectrum-item${extremeDimensions.includes(s.dimension) ? " re-spectrum-item--extreme" : ""}`}
          >
            {extremeDimensions.includes(s.dimension) && (
              <span className="re-spectrum-extreme-tag">Most charged</span>
            )}
            <SpectrumSlider
              spectrum={s}
              value={values[s.dimension]}
              onChange={(v) => setValue(s.dimension, v)}
            />
          </div>
        ))}
      </div>

      {extremeDimensions.length > 0 && (
        <p className="re-spectrum-insight">
          The most material for your conversation lives in:{" "}
          <strong>{extremeDimensions.join(" and ")}</strong>.
        </p>
      )}

      <button className="re-btn re-btn--primary" onClick={handleComplete}>
        Begin your conversation →
      </button>
    </div>
  );
}
