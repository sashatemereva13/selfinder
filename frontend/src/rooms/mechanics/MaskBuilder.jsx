import { useState } from "react";
import { PERSONA_WORD_POOL } from "../../content/roomContent";

function WordChip({ word, selected, onClick }) {
  return (
    <button
      type="button"
      className={`re-chip${selected ? " re-chip--selected" : ""}`}
      onClick={() => onClick(word)}
    >
      {word}
    </button>
  );
}

function WordPool({ label, description, selected, onToggle, phase }) {
  return (
    <div className="re-wordpool">
      <div className="re-wordpool-header">
        <p className="re-wordpool-phase">Phase {phase}</p>
        <h3 className="re-wordpool-label">{label}</h3>
        <p className="re-wordpool-desc">{description}</p>
      </div>
      <div className="re-chip-grid">
        {PERSONA_WORD_POOL.map((word) => (
          <WordChip
            key={word}
            word={word}
            selected={selected.includes(word)}
            onClick={onToggle}
          />
        ))}
      </div>
      <p className="re-chip-count">{selected.length} selected</p>
    </div>
  );
}

function GapAnalysis({ publicFace, privateFace }) {
  const onlyPublic = publicFace.filter((w) => !privateFace.includes(w));
  const onlyPrivate = privateFace.filter((w) => !publicFace.includes(w));
  const inBoth = publicFace.filter((w) => privateFace.includes(w));

  return (
    <div className="re-gap-analysis">
      <h3 className="re-gap-title">The gap</h3>
      <p className="re-gap-intro">
        What you show that you don't fully feel. What you feel that you don't show. Where they meet.
      </p>

      <div className="re-gap-sections">
        {onlyPublic.length > 0 && (
          <div className="re-gap-section">
            <p className="re-gap-section-label">You show, but don't fully claim</p>
            <div className="re-chip-grid re-chip-grid--small">
              {onlyPublic.map((w) => (
                <span key={w} className="re-chip re-chip--public">{w}</span>
              ))}
            </div>
          </div>
        )}
        {onlyPrivate.length > 0 && (
          <div className="re-gap-section">
            <p className="re-gap-section-label">You feel, but don't show</p>
            <div className="re-chip-grid re-chip-grid--small">
              {onlyPrivate.map((w) => (
                <span key={w} className="re-chip re-chip--private">{w}</span>
              ))}
            </div>
          </div>
        )}
        {inBoth.length > 0 && (
          <div className="re-gap-section">
            <p className="re-gap-section-label">Present in both — already integrated</p>
            <div className="re-chip-grid re-chip-grid--small">
              {inBoth.map((w) => (
                <span key={w} className="re-chip re-chip--both">{w}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MaskBuilder({ onComplete }) {
  const [phase, setPhase] = useState(1);
  const [publicFace, setPublicFace] = useState([]);
  const [privateFace, setPrivateFace] = useState([]);

  function togglePublic(word) {
    setPublicFace((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
    );
  }

  function togglePrivate(word) {
    setPrivateFace((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
    );
  }

  function handleComplete() {
    const onlyPublic = publicFace.filter((w) => !privateFace.includes(w));
    const onlyPrivate = privateFace.filter((w) => !publicFace.includes(w));
    const inBoth = publicFace.filter((w) => privateFace.includes(w));
    onComplete({ publicFace, privateFace, onlyPublic, onlyPrivate, inBoth });
  }

  return (
    <div className="re-mechanic re-mechanic--mask">
      {phase === 1 && (
        <>
          <WordPool
            phase={1}
            label="The face you show the world"
            description="Choose the qualities you present — consciously or not — when others are watching."
            selected={publicFace}
            onToggle={togglePublic}
          />
          <button
            className="re-btn re-btn--primary"
            onClick={() => setPhase(2)}
            disabled={publicFace.length === 0}
          >
            Continue →
          </button>
        </>
      )}

      {phase === 2 && (
        <>
          <WordPool
            phase={2}
            label="The face only you know"
            description="Choose the qualities you experience privately — the ones rarely seen by others."
            selected={privateFace}
            onToggle={togglePrivate}
          />
          <div className="re-mechanic-actions">
            <button className="re-btn re-btn--ghost" onClick={() => setPhase(1)}>
              ← Back
            </button>
            <button
              className="re-btn re-btn--primary"
              onClick={() => setPhase(3)}
              disabled={privateFace.length === 0}
            >
              See the gap →
            </button>
          </div>
        </>
      )}

      {phase === 3 && (
        <>
          <GapAnalysis publicFace={publicFace} privateFace={privateFace} />
          <div className="re-mechanic-actions">
            <button className="re-btn re-btn--ghost" onClick={() => setPhase(2)}>
              ← Back
            </button>
            <button className="re-btn re-btn--primary" onClick={handleComplete}>
              Begin your conversation →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
