import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { HOUSE_ROOMS, INSTRUMENTS, getStepByPath } from "../content/narrativeFlow";

// ─── Icons ────────────────────────────────────────────────────────────────────
const HOUSE_ICONS = {
  threshold: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 17V8Q3 2 9 2Q15 2 15 8V17" />
      <line x1="1" y1="17" x2="17" y2="17" />
      <line x1="9" y1="2" x2="9" y2="0.5" />
    </svg>
  ),
  persona: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true">
      <ellipse cx="9" cy="9" rx="6.5" ry="7.5" />
      <ellipse cx="6.2" cy="7.5" rx="1.2" ry="1.6" />
      <ellipse cx="11.8" cy="7.5" rx="1.2" ry="1.6" />
      <path d="M6.5 12.5 Q9 14 11.5 12.5" />
    </svg>
  ),
  shadow: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true">
      <circle cx="9" cy="9" r="7" />
      <path d="M9 2a7 7 0 010 14" fill="rgba(255,255,255,0.12)" stroke="none" />
      <path d="M9 2a7 7 0 010 14" />
    </svg>
  ),
  anima: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true">
      <circle cx="6.5" cy="9" r="5" />
      <circle cx="11.5" cy="9" r="5" />
    </svg>
  ),
  innerchild: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="9,1.5 10.8,6.5 16,6.5 11.8,9.8 13.4,15 9,11.8 4.6,15 6.2,9.8 2,6.5 7.2,6.5" />
    </svg>
  ),
  self: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true">
      <circle cx="9" cy="9" r="7" />
      <circle cx="9" cy="9" r="3.5" />
      <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" />
      <line x1="9" y1="1" x2="9" y2="3" />
      <line x1="9" y1="15" x2="9" y2="17" />
      <line x1="1" y1="9" x2="3" y2="9" />
      <line x1="15" y1="9" x2="17" y2="9" />
    </svg>
  ),
};

const INSTRUMENT_ICONS = {
  measure: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true">
      <line x1="2" y1="14" x2="2" y2="10" />
      <line x1="6" y1="14" x2="6" y2="6" />
      <line x1="10" y1="14" x2="10" y2="4" />
      <line x1="14" y1="14" x2="14" y2="8" />
      <line x1="2" y1="15.5" x2="16" y2="15.5" />
    </svg>
  ),
  luna: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true">
      <path d="M13.5 10A6 6 0 016 4.5a6 6 0 000 9 6 6 0 007.5-3.5z" />
    </svg>
  ),
  tunein: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1,9 3.5,4 6,14 8.5,6 11,12 13.5,7 16,9 17,9" />
    </svg>
  ),
  levels: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1,17 1,13 6,13 6,9 11,9 11,5 16,5 16,1" />
      <line x1="1" y1="17" x2="17" y2="17" />
    </svg>
  ),
};

const CHEVRON = (
  <svg className="sf-navChevron" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="2,4 6,8 10,4" />
  </svg>
);

// ─── Collapsible nav section ──────────────────────────────────────────────────
function NavSection({ title, items, icons, currentStepKey, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="sf-navSection">
      <button
        type="button"
        className={`sf-navSectionHeader ${open ? "is-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="sf-navSectionTitle">{title}</span>
        {CHEVRON}
      </button>

      {open && (
        <div className="sf-navSectionBody" role="list">
          {items.map((item) => {
            const isCurrent = currentStepKey === item.key;
            const icon = (icons[item.key]) ?? null;

            return (
              <Link
                key={item.key}
                to={item.route}
                role="listitem"
                className={`sf-roomItem ${isCurrent ? "is-current" : ""}`}
              >
                {icon && <span className="sf-roomIcon" aria-hidden="true">{icon}</span>}
                <span className="sf-roomBody">
                  <span className="sf-roomTop">
                    <span className="sf-roomLabel">{item.label}</span>
                    {item.stage && <span className="sf-roomStage">{item.stage}</span>}
                  </span>
                  <span className="sf-roomDesc">{item.description}</span>
                </span>
                {isCurrent && <span className="sf-roomDot" aria-hidden="true" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const threshold = HOUSE_ROOMS[0];
const houseRooms = HOUSE_ROOMS.slice(1);

// ─── Overlay nav — Threshold + The House + Instruments ───────────────────────
function OverlayNav({ title, subtitle }) {
  const location = useLocation();
  const currentStep = getStepByPath(location.pathname);
  const isAtThreshold = currentStep?.key === "threshold";

  return (
    <section className="sf-journeyNav sf-journeyNav-overlay" aria-label="Selfinder navigation">
      <div className="sf-journeyHeader">
        <p className="sf-kicker">{title}</p>
        <p className="sf-journeySubtitle">{subtitle}</p>
      </div>

      {/* Location strip — visible when not at Threshold */}
      {currentStep && !isAtThreshold && (
        <div className="sf-navContext">
          <div className="sf-navLocation">
            <span className="sf-navLocationLabel">now in</span>
            <span className="sf-navLocationName">{currentStep.label}</span>
            {currentStep.stage && (
              <span className="sf-navLocationStage">{currentStep.stage}</span>
            )}
          </div>
        </div>
      )}

      {/* Threshold — entry point, above the house */}
      <Link
        to={threshold.route}
        className={`sf-navThreshold ${isAtThreshold ? "is-current" : ""}`}
      >
        <span className="sf-roomIcon" aria-hidden="true">{HOUSE_ICONS.threshold}</span>
        <span className="sf-navThresholdBody">
          <span className="sf-navThresholdLabel">{threshold.label}</span>
          <span className="sf-navThresholdDesc">{threshold.description}</span>
        </span>
        {isAtThreshold && <span className="sf-roomDot" aria-hidden="true" />}
      </Link>

      <div className="sf-navRule" aria-hidden="true" />

      <NavSection
        title="The House"
        items={houseRooms}
        icons={HOUSE_ICONS}
        currentStepKey={currentStep?.key}
      />
      <NavSection
        title="Instruments"
        items={INSTRUMENTS}
        icons={INSTRUMENT_ICONS}
        currentStepKey={currentStep?.key}
      />
    </section>
  );
}

// ─── Compact / inline variant — sequential list ───────────────────────────────
function StandardNav({ currentKey, variant, title, subtitle, primaryAction }) {
  const location = useLocation();
  const currentStep = getStepByPath(location.pathname) ??
    HOUSE_ROOMS.find((r) => r.key === currentKey) ?? null;
  const currentIndex = HOUSE_ROOMS.findIndex((r) => r.key === currentStep?.key);

  return (
    <section className={`sf-journeyNav sf-journeyNav-${variant}`} aria-label="Selfinder journey">
      <div className="sf-journeyHeader">
        <p className="sf-kicker">{title}</p>
        <p className="sf-journeySubtitle">{subtitle}</p>
      </div>

      <div className="sf-journeyTrack" role="list">
        {HOUSE_ROOMS.map((step, index) => {
          const isCurrent = currentStep?.key === step.key;
          const isComplete = currentIndex >= 0 && index < currentIndex;
          return (
            <Link
              key={step.key}
              to={step.route}
              role="listitem"
              className={`sf-journeyStep ${isCurrent ? "is-current" : ""} ${isComplete ? "is-complete" : ""}`}
            >
              <span className="sf-journeyIndex">{index}</span>
              <span className="sf-journeyCopy">
                <span className="sf-journeyLabel">{step.label}</span>
                <span className="sf-journeyStage">{step.stage}</span>
              </span>
            </Link>
          );
        })}
      </div>

      {primaryAction && (
        <div className="sf-journeyActions">
          <Link to={primaryAction.to} className="sf-btn sf-btn-primary">
            {primaryAction.label}
          </Link>
        </div>
      )}
    </section>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────
export default function JourneyNav({
  currentKey,
  variant = "inline",
  title = "The House of the Psyche",
  subtitle = "Move through the rooms at your own pace.",
  primaryAction,
}) {
  if (variant === "overlay") {
    return <OverlayNav title={title} subtitle={subtitle} />;
  }

  return (
    <StandardNav
      currentKey={currentKey}
      variant={variant}
      title={title}
      subtitle={subtitle}
      primaryAction={primaryAction}
    />
  );
}
