import { useState } from "react";
import { SHADOW_QUALITIES } from "../../content/roomContent";

const BUCKETS = [
  { key: "self",      label: "I recognise this in myself" },
  { key: "others",    label: "I see this in others, not me" },
  { key: "difficult", label: "Difficult to be around" },
];

function QualityCard({ quality, assignment, onAssign }) {
  return (
    <div className={`re-wanted-card${assignment ? ` re-wanted-card--assigned re-wanted-card--${assignment}` : ""}`}>
      <span className="re-wanted-quality">{quality}</span>
      <div className="re-wanted-buckets">
        {BUCKETS.map((b) => (
          <button
            key={b.key}
            type="button"
            className={`re-wanted-bucket-btn${assignment === b.key ? " re-wanted-bucket-btn--active" : ""}`}
            onClick={() => onAssign(quality, b.key)}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WantedList({ onComplete }) {
  const [assignments, setAssignments] = useState({});

  function assign(quality, bucket) {
    setAssignments((prev) => ({ ...prev, [quality]: bucket }));
  }

  const assignedCount = Object.keys(assignments).length;
  const allAssigned = assignedCount === SHADOW_QUALITIES.length;

  function handleComplete() {
    const self = SHADOW_QUALITIES.filter((q) => assignments[q] === "self");
    const others = SHADOW_QUALITIES.filter((q) => assignments[q] === "others");
    const difficult = SHADOW_QUALITIES.filter((q) => assignments[q] === "difficult");
    const crossReference = others.filter((q) => difficult.includes(q));
    onComplete({ self, others, difficult, crossReference });
  }

  return (
    <div className="re-mechanic re-mechanic--wanted">
      <div className="re-mechanic-header">
        <h3 className="re-mechanic-title">The Wanted List</h3>
        <p className="re-mechanic-desc">
          For each quality, choose the category that feels most true. There are no wrong answers — only honest ones.
        </p>
        <div className="re-progress-bar">
          <div
            className="re-progress-fill"
            style={{ width: `${(assignedCount / SHADOW_QUALITIES.length) * 100}%` }}
          />
        </div>
        <p className="re-progress-label">
          {assignedCount} / {SHADOW_QUALITIES.length} assigned
        </p>
      </div>

      <div className="re-wanted-list">
        {SHADOW_QUALITIES.map((quality) => (
          <QualityCard
            key={quality}
            quality={quality}
            assignment={assignments[quality] ?? null}
            onAssign={assign}
          />
        ))}
      </div>

      {allAssigned && (
        <div className="re-wanted-reveal">
          <div className="re-wanted-crossref">
            <h4 className="re-wanted-crossref-title">Shadow crossfire</h4>
            <p className="re-wanted-crossref-desc">
              These qualities appeared both in "others" and in "difficult to be around" — the shadow tends to live here.
            </p>
            {(() => {
              const others = SHADOW_QUALITIES.filter((q) => assignments[q] === "others");
              const difficult = SHADOW_QUALITIES.filter((q) => assignments[q] === "difficult");
              const cross = others.filter((q) => difficult.includes(q));
              return cross.length > 0 ? (
                <div className="re-chip-grid">
                  {cross.map((q) => (
                    <span key={q} className="re-chip re-chip--shadow">{q}</span>
                  ))}
                </div>
              ) : (
                <p className="re-wanted-crossref-empty">No direct crossfire — worth exploring why.</p>
              );
            })()}
          </div>
          <button className="re-btn re-btn--primary" onClick={handleComplete}>
            Begin your conversation →
          </button>
        </div>
      )}
    </div>
  );
}
