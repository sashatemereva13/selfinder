import PhilosopherVoiceTag from "../designElements/PhilosopherVoiceTag";
import "./PhilosopherMessage.css";

// Replaces the old FeelingLucky-styled card (Message.jsx) for this specific
// moment: the user's first contact with their chosen philosopher's voice.
// That card's random decorative label and "save as PNG, signed sasha"
// footer were built for personal FeelingLucky reflections, not in-character
// guidance from a specific philosopher — keeping them here misattributed
// the message and broke immersion. This one reuses the same avatar + name
// + accent-color pattern already used for philosopher lines everywhere else
// (Measure, Levels, TuneIn) instead of inventing a one-off look.
export default function PhilosopherMessage({
  selectedMessage,
  setSelectedMessage,
  philosopher,
}) {
  if (!selectedMessage) return null;

  return (
    <div
      className="philoMessageOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="philo-message-text"
      style={
        philosopher
          ? { "--philo-color": philosopher.color, "--philo-rgb": philosopher.accentRgb }
          : {}
      }
    >
      <div className="philoMessageCard">
        <PhilosopherVoiceTag philosopher={philosopher} className="philoMessageTag" />
        <p id="philo-message-text" className="philoMessageText">
          {selectedMessage.message}
        </p>
        <button
          type="button"
          className="sf-btn sf-btn-primary philoMessageContinue"
          onClick={() => setSelectedMessage(null)}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
