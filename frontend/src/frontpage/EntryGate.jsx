import { useState, useRef, useCallback, lazy, Suspense } from "react";
import { useChat } from "../guide/ChatContext";
import { PHILOSOPHERS } from "../content/philosophers";
import { AVATARS } from "../content/philosopherAvatars";
import { useAdaptiveQuality } from "../utils/useAdaptiveQuality";
import "./EntryGate.css";

// Lazy-loaded: EntryGate is imported eagerly (it's the very first screen), so
// the 3D crystal cards must not block its first paint. Falls back to the flat
// SVG orb below on low-tier devices / reduced motion instead of mounting these.
const PhiloCrystalCard = lazy(() =>
  import("./PhiloCrystal").then((m) => ({ default: m.PhiloCrystalCard })),
);
const PhiloCrystalStage = lazy(() =>
  import("./PhiloCrystal").then((m) => ({ default: m.PhiloCrystalStage })),
);

const GUIDE_NEEDS = {
  socrates: "for clarity",
  stoics: "for grounding",
  kierkegaard: "when choice feels impossible",
  camus: "for meaning",
  aristotle: "to move forward",
};

// One silhouette per philosopher for the card orb — shape echoes the
// guide's character rather than a generic circle.
const ORB_SHAPES = {
  // sparkle/star — clarity, a spark of insight
  socrates:
    "polygon(50% 0%, 57% 43%, 100% 50%, 57% 57%, 50% 100%, 43% 57%, 0% 50%, 43% 43%)",
  // hexagon — solid, balanced, grounded
  stoics: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)",
  // five-point star — the sharp branching points of a hard choice
  kierkegaard:
    "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
  // irregular, asymmetric polygon — the absurd resists clean symmetry
  camus:
    "polygon(46% 2%, 78% 12%, 98% 42%, 88% 78%, 56% 98%, 18% 86%, 2% 52%, 14% 18%)",
  // forward-pointing arrow — move forward
  aristotle:
    "polygon(0% 15%, 60% 15%, 60% 0%, 100% 50%, 60% 100%, 60% 85%, 0% 85%)",
};

function EntryGate({ onEnter }) {
  const { activePhilosopher, selectPhilosopher } = useChat();
  const [nudge, setNudge] = useState(false);
  const gridRef = useRef(null);
  const cardRefs = useRef([]);
  const quality = useAdaptiveQuality();
  const use3DCrystals = quality.tier !== "low" && !quality.reduceMotion;

  const selectedIndex = PHILOSOPHERS.findIndex(
    (p) => p.id === activePhilosopher?.id,
  );
  // Roving tabindex: the selected card is the group's one tab stop (or the
  // first card if nothing's picked yet) — Tab enters/exits the group once,
  // arrow keys move focus between cards from there.
  const activeIndex = selectedIndex === -1 ? 0 : selectedIndex;

  const handleBegin = useCallback(() => {
    if (!activePhilosopher) {
      setNudge(true);
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setNudge(false), 620);
      return;
    }
    onEnter();
  }, [activePhilosopher, onEnter]);

  // Arrow keys move focus only — they don't select. Selection here is an
  // explicit toggle (click/Enter/Space), not the native exclusive-radio
  // behavior, so auto-selecting on arrow move would fight that model.
  const handleGridKeyDown = (e) => {
    const count = PHILOSOPHERS.length;
    // Navigate from wherever focus actually is, not from the selected card —
    // those diverge as soon as you arrow away from the selection, which
    // previously left every arrow press recomputing from the same stale
    // index and getting stuck one step in.
    const focusedIndex = cardRefs.current.indexOf(e.target);
    const fromIndex = focusedIndex === -1 ? activeIndex : focusedIndex;
    let nextIndex = null;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIndex = (fromIndex + 1) % count;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIndex = (fromIndex - 1 + count) % count;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = count - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      cardRefs.current[nextIndex]?.focus();
    }
  };

  const ctaLabel = !activePhilosopher
    ? "pick a guide above to begin"
    : `enter with ${activePhilosopher.name}`;

  return (
    <section className="entryGate" aria-label="Entry screen">
      <header className="entryGateIntro">
        <p className="entryGateKicker">Selfinder</p>
        <h1 className="entryGateHeadline">choose who walks beside you</h1>
      </header>

      <div
        ref={gridRef}
        className={`entryGatePhiloGrid ${nudge ? "is-nudge" : ""}`}
        role="radiogroup"
        aria-label="Choose the kind of guidance you need"
        onKeyDown={handleGridKeyDown}
      >
        {PHILOSOPHERS.map((p, i) => {
          const selected = activePhilosopher?.id === p.id;
          return (
            <button
              key={p.id}
              ref={(el) => (cardRefs.current[i] = el)}
              type="button"
              className={`entryGatePhiloCard ${selected ? "is-selected" : ""}`}
              style={{
                "--philo-color": p.color,
                "--philo-rgb": p.accentRgb,
                "--philo-delay": `${i * 0.45}s`,
                "--orb-clip": ORB_SHAPES[p.id],
              }}
              onClick={() => selectPhilosopher(selected ? null : p.id)}
              aria-pressed={selected}
              role="radio"
              aria-checked={selected}
              tabIndex={i === activeIndex ? 0 : -1}
            >
              {use3DCrystals ? (
                <Suspense fallback={<span className="entryGatePhiloOrbWrap" aria-hidden="true" />}>
                  <PhiloCrystalCard
                    as="span"
                    className="entryGatePhiloOrbWrap"
                    color={p.color}
                    accentRgb={p.accentRgb}
                    selected={selected}
                    aria-hidden="true"
                  />
                </Suspense>
              ) : (
                <span className="entryGatePhiloOrbWrap" aria-hidden="true">
                  <span className="entryGatePhiloOrbField" />
                  <span className="entryGatePhiloOrbRing" />
                  <span className="entryGatePhiloOrbCore">
                    {AVATARS[p.id]?.(p.color)}
                  </span>
                </span>
              )}
              <span className="entryGatePhiloCaption">
                <span className="entryGatePhiloName">{p.name}</span>
                <span className="entryGatePhiloNeed">{GUIDE_NEEDS[p.id]}</span>
              </span>
            </button>
          );
        })}
      </div>

      {use3DCrystals && (
        <Suspense fallback={null}>
          <PhiloCrystalStage />
        </Suspense>
      )}

      <span aria-live="polite" className="entryGateSrOnly">
        {nudge ? "Pick a guide above to begin" : ""}
      </span>

      <button
        className={`entryGateButton ${activePhilosopher ? "is-ready" : "is-locked"}`}
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
      >
        <span
          className={`paintMark paintMark--behind ${activePhilosopher ? "paintMark--solid" : ""}`}
          aria-hidden="true"
          style={{
            width: "4rem",
            height: "4rem",
            top: "-30%",
            left: "-6%",
            "--mark-angle": "70deg",
            "--mark-opacity": 0.4,
            "--mark-dx": "40px",
            "--mark-dy": "10px",
            "--mark-duration": "16s",
            "--mark-rgb": activePhilosopher?.accentRgb,
          }}
        />
        {ctaLabel}
      </button>
    </section>
  );
}

export default EntryGate;
