import { useEffect, useState, useRef, useCallback } from "react";
import { useChat } from "../guide/ChatContext";
import { PHILOSOPHERS } from "../content/philosophers";
import { AVATARS } from "../content/philosopherAvatars";
import "./EntryGate.css";

const GUIDE_NEEDS = {
  socrates: "clarity",
  stoics: "grounding",
  kierkegaard: "face a hard choice",
  camus: "meaning",
  aristotle: "move forward",
};

function EntryGate({ onEnter }) {
  const { activePhilosopher, selectPhilosopher } = useChat();
  const [nudge, setNudge] = useState(false);
  const gridRef = useRef(null);

  const handleBegin = useCallback(() => {
    if (!activePhilosopher) {
      setNudge(true);
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setNudge(false), 620);
      return;
    }
    onEnter();
  }, [activePhilosopher, onEnter]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Enter") handleBegin();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleBegin]);

  return (
    <section className="entryGate" aria-label="Entry screen">
      <header className="entryGateHero">
        <p className="entryGateKicker">This is how love wins fear</p>
        <h1 className="entryGateTitle">What do you need right now?</h1>
      </header>

      <div
        className={`entryGateHeart ${activePhilosopher ? "is-attuned" : ""}`}
        style={
          activePhilosopher
            ? {
                "--philo-color": activePhilosopher.color,
                "--philo-rgb": activePhilosopher.accentRgb,
              }
            : {}
        }
        aria-hidden="true"
      >
        <span className="entryGateCoreField" />
        <span className="entryGateCoreRing" />
        <span className="entryGateCore" />
      </div>

      <div className="entryGateCompanion">
        <div
          ref={gridRef}
          className={`entryGatePhiloGrid ${nudge ? "is-nudge" : ""}`}
          role="radiogroup"
          aria-label="Choose the kind of guidance you need"
        >
          {PHILOSOPHERS.map((p) => {
            const selected = activePhilosopher?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`entryGatePhiloCard ${selected ? "is-selected" : ""}`}
                style={{ "--philo-color": p.color, "--philo-rgb": p.accentRgb }}
                onClick={() => selectPhilosopher(selected ? null : p.id)}
                aria-pressed={selected}
                role="radio"
                aria-checked={selected}
              >
                <span className="entryGatePhiloGlyph" aria-hidden="true">
                  {AVATARS[p.id]?.(p.color)}
                </span>
                <span className="entryGatePhiloNeed">{GUIDE_NEEDS[p.id]}</span>
                <span className="entryGatePhiloName">{p.name}</span>
                <span className="entryGatePhiloCheck" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>

      <button
        className={`entryGateButton ${!activePhilosopher ? "is-locked" : ""}`}
        style={
          activePhilosopher
            ? {
                "--philo-color": activePhilosopher.color,
                "--philo-rgb": activePhilosopher.accentRgb,
              }
            : {}
        }
        type="button"
        onClick={handleBegin}
        aria-disabled={!activePhilosopher}
      >
        {activePhilosopher
          ? `enter with ${activePhilosopher.name}`
          : "pick a guide above to begin"}
      </button>
    </section>
  );
}

export default EntryGate;
