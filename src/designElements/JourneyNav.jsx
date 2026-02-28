import { Link, useLocation } from "react-router-dom";
import {
  NARRATIVE_FLOW_STEPS,
  getNarrativeStepByKey,
  getNarrativeStepByPath,
  getNextNarrativeStep,
} from "../content/narrativeFlow";

export default function JourneyNav({
  currentKey,
  variant = "inline",
  title = "Recommended Journey",
  subtitle = "Move through the Selfinder flow in sequence for a stronger read.",
  primaryAction,
}) {
  const location = useLocation();
  const currentStep =
    getNarrativeStepByKey(currentKey) || getNarrativeStepByPath(location.pathname) || null;
  const currentIndex = currentStep
    ? NARRATIVE_FLOW_STEPS.findIndex((step) => step.key === currentStep.key)
    : -1;
  const fallbackNext = getNextNarrativeStep(currentStep?.key || "home");

  const resolvedPrimary =
    primaryAction || {
      to: fallbackNext.route,
      label:
        currentStep?.key === fallbackNext.key
          ? `Revisit ${fallbackNext.label}`
          : `Continue to ${fallbackNext.label}`,
    };

  return (
    <section className={`sf-journeyNav sf-journeyNav-${variant}`} aria-label="Selfinder journey">
      <div className="sf-journeyHeader">
        <p className="sf-kicker">{title}</p>
        <p className="sf-journeySubtitle">{subtitle}</p>
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
              className={`sf-journeyStep ${isCurrent ? "is-current" : ""} ${
                isComplete ? "is-complete" : ""
              }`}
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

      <div className="sf-journeyActions">
        <Link to={resolvedPrimary.to} className="sf-btn sf-btn-primary">
          {resolvedPrimary.label}
        </Link>
      </div>
    </section>
  );
}
