import { readMeasureResult } from "../../hooks/useRoomProgress";

function formatLifeSpheresLine(measureResult) {
  if (!measureResult?.lines) return null;
  return measureResult.lines
    .map((line) => `${line.label}: ${line.vibrationLevel.name}`)
    .join(" · ");
}

export default function EchoReflection({ onComplete }) {
  const measureResult = readMeasureResult();
  const lifeSpheresLine = formatLifeSpheresLine(measureResult);

  if (!measureResult) {
    return (
      <div className="re-mechanic re-mechanic--echo re-mechanic--locked">
        <div className="re-echo-locked">
          <div className="re-echo-lock-icon" aria-hidden="true">
            <svg viewBox="0 0 40 40" fill="none">
              <rect x="10" y="18" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M14 18v-4a6 6 0 0 1 12 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="20" cy="26" r="2" fill="currentColor" />
            </svg>
          </div>
          <h3 className="re-echo-locked-title">This room opens once you've worked through the Depths.</h3>
          <p className="re-echo-locked-desc">
            Return here after feeling into your Life Spheres in Measure. The Self integrates what came before.
          </p>
        </div>
      </div>
    );
  }

  function handleComplete() {
    const priorArtefacts = lifeSpheresLine
      ? [{ room: "Life Spheres", text: lifeSpheresLine }]
      : [];
    const roomsVisited = lifeSpheresLine ? ["Life Spheres"] : [];
    onComplete({ priorArtefacts, roomsVisited });
  }

  return (
    <div className="re-mechanic re-mechanic--echo">
      <div className="re-mechanic-header">
        <h3 className="re-mechanic-title">What you carry</h3>
        <p className="re-mechanic-desc">
          This is what you named in the Depths. Read it. Let it settle.
        </p>
      </div>

      <div className="re-echo-artefacts">
        {lifeSpheresLine && (
          <div className="re-echo-artefact">
            <span className="re-echo-room-label">Life Spheres</span>
            <blockquote className="re-echo-statement">{lifeSpheresLine}</blockquote>
          </div>
        )}
      </div>

      <div className="re-echo-pause">
        <p className="re-echo-pause-text">
          Stay with this for a moment before entering the conversation.
        </p>
      </div>

      <button className="re-btn re-btn--primary" onClick={handleComplete}>
        Begin your conversation with what you notice →
      </button>
    </div>
  );
}
