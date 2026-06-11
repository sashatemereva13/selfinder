import { useState } from "react";
import { INNER_CHILD_PROMPTS } from "../../content/roomContent";

const MIN_CHARS = 20;

function PromptArea({ promptData, value, onChange }) {
  const isValid = value.trim().length >= MIN_CHARS;
  return (
    <div className={`re-timeline-prompt${isValid ? " re-timeline-prompt--filled" : ""}`}>
      <label className="re-timeline-label" htmlFor={`timeline-${promptData.key}`}>
        {promptData.prompt}
      </label>
      <textarea
        id={`timeline-${promptData.key}`}
        className="re-timeline-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write here…"
        rows={4}
      />
      {value.length > 0 && value.trim().length < MIN_CHARS && (
        <p className="re-timeline-hint">
          Keep going — {MIN_CHARS - value.trim().length} more characters to continue
        </p>
      )}
    </div>
  );
}

export default function TimelineWriter({ onComplete }) {
  const [responses, setResponses] = useState({
    aliveness: "",
    editing: "",
    carrying: "",
    letter: "",
  });

  function setField(key, value) {
    setResponses((prev) => ({ ...prev, [key]: value }));
  }

  const allRequired = INNER_CHILD_PROMPTS.every(
    (p) => responses[p.key].trim().length >= MIN_CHARS
  );

  function handleComplete() {
    onComplete({
      aliveness: responses.aliveness,
      editing: responses.editing,
      carrying: responses.carrying,
      letter: responses.letter,
    });
  }

  return (
    <div className="re-mechanic re-mechanic--timeline">
      <div className="re-mechanic-header">
        <h3 className="re-mechanic-title">Timeline</h3>
        <p className="re-mechanic-desc">
          Three windows into your past. Write without editing yourself — the point is contact, not craft.
        </p>
      </div>

      <div className="re-timeline-prompts">
        {INNER_CHILD_PROMPTS.map((p) => (
          <PromptArea
            key={p.key}
            promptData={p}
            value={responses[p.key]}
            onChange={(val) => setField(p.key, val)}
          />
        ))}

        <div className={`re-timeline-prompt re-timeline-prompt--optional`}>
          <label className="re-timeline-label re-timeline-label--optional" htmlFor="timeline-letter">
            Write a short letter to your younger self{" "}
            <span className="re-timeline-optional-tag">(optional)</span>
          </label>
          <textarea
            id="timeline-letter"
            className="re-timeline-textarea"
            value={responses.letter}
            onChange={(e) => setField("letter", e.target.value)}
            placeholder="Dear younger me…"
            rows={4}
          />
        </div>
      </div>

      <button
        className="re-btn re-btn--primary"
        onClick={handleComplete}
        disabled={!allRequired}
      >
        Begin your conversation →
      </button>
    </div>
  );
}
