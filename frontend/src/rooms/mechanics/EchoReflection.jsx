import { getJourneySummaryText } from "../../hooks/useRoomProgress";

const ROOM_LABELS = {
  persona:    "The Persona",
  shadow:     "The Shadow",
  anima:      "The Anima / Animus",
  innerchild: "The Inner Child",
};

function readSummaryArtefacts() {
  try {
    const raw = localStorage.getItem("sfr_summary");
    return raw ? JSON.parse(raw).artefacts || {} : {};
  } catch {
    return {};
  }
}

export default function EchoReflection({ onComplete }) {
  const artefacts = readSummaryArtefacts();
  const completedRooms = Object.entries(artefacts).filter(
    ([key]) => key !== "self"
  );

  if (completedRooms.length < 2) {
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
          <h3 className="re-echo-locked-title">This room opens after you've worked in at least two others.</h3>
          <p className="re-echo-locked-desc">
            Return here after visiting the Persona, Shadow, Anima, or Inner Child rooms. The Self integrates what came before.
          </p>
          <p className="re-echo-locked-progress">
            {completedRooms.length} of 4 rooms completed
          </p>
        </div>
      </div>
    );
  }

  function handleComplete() {
    onComplete({ artefacts });
  }

  return (
    <div className="re-mechanic re-mechanic--echo">
      <div className="re-mechanic-header">
        <h3 className="re-mechanic-title">What you carry</h3>
        <p className="re-mechanic-desc">
          These are the statements you named in each room. Read them. Let them be together.
        </p>
      </div>

      <div className="re-echo-artefacts">
        {completedRooms.map(([key, data]) => (
          <div key={key} className="re-echo-artefact">
            <span className="re-echo-room-label">{ROOM_LABELS[key] ?? key}</span>
            <blockquote className="re-echo-statement">"{data.unlock}"</blockquote>
          </div>
        ))}
      </div>

      <div className="re-echo-pause">
        <p className="re-echo-pause-text">
          Stay with these for a moment before entering the conversation.
        </p>
      </div>

      <button className="re-btn re-btn--primary" onClick={handleComplete}>
        Begin your conversation with what you notice →
      </button>
    </div>
  );
}
