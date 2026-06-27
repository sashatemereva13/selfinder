import { Link } from "react-router-dom";
import { useChat } from "../guide/ChatContext";
import { JOURNEY_STEPS, getJourneyStepIndex } from "../content/journeySteps";
import "./JourneyProgress.css";

// A quiet "you are here" strip for the four core beats — Threshold, Measure,
// Levels, Tune In. Separate from Measure's own internal phase bar, which
// tracks progress *within* the Measure beat, not across the whole journey.
export default function JourneyProgress({ currentKey }) {
  const { activePhilosopher } = useChat();
  const currentIndex = getJourneyStepIndex(currentKey);
  if (currentIndex === -1) return null;

  return (
    <nav
      className="jp-root"
      aria-label="Your place in the Selfinder journey"
      style={
        activePhilosopher
          ? { "--philo-color": activePhilosopher.color, "--philo-rgb": activePhilosopher.accentRgb }
          : {}
      }
    >
      <p className="jp-meta">
        Step {currentIndex + 1} of {JOURNEY_STEPS.length} · {JOURNEY_STEPS[currentIndex].label}
      </p>
      <ol className="jp-track">
        {JOURNEY_STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          const content = (
            <>
              <span className="jp-dot" aria-hidden="true" />
              <span className="jp-label">{step.label}</span>
            </>
          );

          return (
            <li
              key={step.key}
              className={`jp-step ${isCurrent ? "is-current" : ""} ${isDone ? "is-done" : ""}`}
              aria-current={isCurrent ? "step" : undefined}
            >
              {isDone ? (
                <Link to={step.route} className="jp-stepLink" aria-label={`Back to ${step.label}`}>
                  {content}
                </Link>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
