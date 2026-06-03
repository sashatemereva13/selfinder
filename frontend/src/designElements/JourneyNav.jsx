import { Link, useLocation } from "react-router-dom";
import {
  NARRATIVE_FLOW_STEPS,
  getNarrativeStepByKey,
  getNarrativeStepByPath,
  getNextNarrativeStep,
} from "../content/narrativeFlow";

// ─── Room icons (18×18 stroke SVGs) ─────────────────────────────────────────
const ROOM_ICONS = {
  threshold: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 17V8Q3 2 9 2Q15 2 15 8V17" />
      <line x1="1" y1="17" x2="17" y2="17" />
      <line x1="9" y1="2" x2="9" y2="0.5" />
    </svg>
  ),
  core: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true">
      <circle cx="9" cy="9" r="7" />
      <circle cx="9" cy="9" r="3.5" />
      <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
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
  guide: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 13V4a1 1 0 011-1h10a1 1 0 011 1v6a1 1 0 01-1 1H6l-3 3z" />
      <circle cx="6.5" cy="7" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="9" cy="7" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="11.5" cy="7" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),
};

// ─── Shared helpers ──────────────────────────────────────────────────────────
function useJourneyState(currentKey) {
  const location = useLocation();
  const currentStep =
    getNarrativeStepByKey(currentKey) ||
    getNarrativeStepByPath(location.pathname) ||
    null;
  const currentIndex = currentStep
    ? NARRATIVE_FLOW_STEPS.findIndex((s) => s.key === currentStep.key)
    : -1;
  const progressCount = currentIndex >= 0 ? currentIndex + 1 : 0;
  const progressPercent = Math.round(
    (progressCount / Math.max(NARRATIVE_FLOW_STEPS.length, 1)) * 100,
  );
  return { currentStep, currentIndex, progressCount, progressPercent };
}

// ─── Overlay variant — room directory ────────────────────────────────────────
function OverlayNav({ title, subtitle, showProgress, currentKey }) {
  const { currentStep, currentIndex, progressCount, progressPercent } =
    useJourneyState(currentKey);

  return (
    <section className="sf-journeyNav sf-journeyNav-overlay" aria-label="Selfinder rooms">
      <div className="sf-journeyHeader">
        <p className="sf-kicker">{title}</p>
        <p className="sf-journeySubtitle">{subtitle}</p>
        {showProgress && (
          <div className="sf-journeyProgress" aria-label="Progress">
            <div className="sf-journeyProgressMeta">
              <span>Room {progressCount} of {NARRATIVE_FLOW_STEPS.length}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="sf-journeyProgressTrack" aria-hidden="true">
              <span
                className="sf-journeyProgressFill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="sf-roomList" role="list">
        {NARRATIVE_FLOW_STEPS.map((step, index) => {
          const isCurrent = currentStep?.key === step.key;
          const isComplete = currentIndex >= 0 && index < currentIndex;
          const icon = ROOM_ICONS[step.key];

          return (
            <Link
              key={step.key}
              to={step.route}
              role="listitem"
              className={`sf-roomItem ${isCurrent ? "is-current" : ""} ${isComplete ? "is-complete" : ""}`}
            >
              <span className="sf-roomIcon" aria-hidden="true">{icon}</span>
              <span className="sf-roomBody">
                <span className="sf-roomTop">
                  <span className="sf-roomLabel">{step.label}</span>
                  <span className="sf-roomStage">{step.stage}</span>
                </span>
                <span className="sf-roomDesc">{step.description}</span>
              </span>
              {isCurrent && <span className="sf-roomDot" aria-hidden="true" />}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ─── Compact / inline variants — unchanged ───────────────────────────────────
function StandardNav({ currentKey, variant, title, subtitle, showProgress, primaryAction }) {
  const { currentStep, currentIndex, progressCount, progressPercent } =
    useJourneyState(currentKey);
  const fallbackNext = getNextNarrativeStep(currentStep?.key || "home");

  return (
    <section
      className={`sf-journeyNav sf-journeyNav-${variant}`}
      aria-label="Selfinder journey"
    >
      <div className="sf-journeyHeader">
        <p className="sf-kicker">{title}</p>
        <p className="sf-journeySubtitle">{subtitle}</p>
        {showProgress && (
          <div className="sf-journeyProgress" aria-label="Narrative flow progress">
            <div className="sf-journeyProgressMeta">
              <span>Step {progressCount}/{NARRATIVE_FLOW_STEPS.length}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="sf-journeyProgressTrack" aria-hidden="true">
              <span
                className="sf-journeyProgressFill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="sf-journeyTrack" role="list">
        {NARRATIVE_FLOW_STEPS.map((step, index) => {
          const isCurrent = currentStep?.key === step.key;
          const isComplete = currentIndex >= 0 && index < currentIndex;
          return (
            <Link
              key={step.key}
              to={step.route}
              role="listitem"
              className={`sf-journeyStep ${isCurrent ? "is-current" : ""} ${isComplete ? "is-complete" : ""}`}
            >
              <span className="sf-journeyIndex">{index + 1}</span>
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
          {fallbackNext && primaryAction.to !== fallbackNext.route && (
            <Link to={fallbackNext.route} className="sf-btn">
              {fallbackNext.label} →
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Public export ───────────────────────────────────────────────────────────
export default function JourneyNav({
  currentKey,
  variant = "inline",
  title = "Recommended Journey",
  subtitle = "Move through the Selfinder flow in sequence for a stronger read.",
  primaryAction,
  showProgress = false,
}) {
  if (variant === "overlay") {
    return (
      <OverlayNav
        title={title}
        subtitle={subtitle}
        showProgress={showProgress}
        currentKey={currentKey}
      />
    );
  }

  return (
    <StandardNav
      currentKey={currentKey}
      variant={variant}
      title={title}
      subtitle={subtitle}
      showProgress={showProgress}
      primaryAction={primaryAction}
    />
  );
}
