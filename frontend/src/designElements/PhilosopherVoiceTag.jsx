import { AVATARS } from "../content/philosopherAvatars";
import "./PhilosopherVoiceTag.css";

// Small avatar + name attribution shown above journey-line text, so it's
// clear the line is spoken by the chosen philosopher rather than by
// whatever object happens to be on screen (the magic ball, a portal ring…).
export default function PhilosopherVoiceTag({ philosopher, className = "" }) {
  if (!philosopher) return null;

  const avatar = AVATARS[philosopher.id]?.(philosopher.color);

  return (
    <div
      className={`philoVoiceTag ${className}`}
      style={{ "--philo-color": philosopher.color }}
    >
      {avatar && (
        <span className="philoVoiceTagAvatar" aria-hidden="true">
          {avatar}
        </span>
      )}
      <span className="philoVoiceTagName">{philosopher.name}</span>
    </div>
  );
}
