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
  showProgress = false,
}) {
  const location = useLocation();
  const currentStep =
    getNarrativeStepByKey(currentKey) ||
    getNarrativeStepByPath(location.pathname) ||
    null;
  const currentIndex = currentStep
    ? NARRATIVE_FLOW_STEPS.findIndex((step) => step.key === currentStep.key)
    : -1;
  const progressCount = currentIndex >= 0 ? currentIndex + 1 : 0;
  const progressPercent = Math.round(
    (progressCount / Math.max(NARRATIVE_FLOW_STEPS.length, 1)) * 100,
  );
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
              <span>
                Step {progressCount}/{NARRATIVE_FLOW_STEPS.length}
              </span>
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
    </section>
  );
}
