// Symbolic SVG avatar per philosopher — 24×24 viewBox.
// Shared between PhilosopherBadge (in-app corner badge) and EntryGate
// (first-screen picker cards) so every philosopher reads as one consistent
// "character" across the whole experience.
export const AVATARS = {
  socrates: (color) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="philoAvatarSvg"
    >
      <ellipse
        cx="12"
        cy="12"
        rx="9.5"
        ry="6"
        stroke={color}
        strokeWidth="1.4"
      />
      <circle
        cx="12"
        cy="12"
        r="3.5"
        stroke={color}
        strokeWidth="1"
        fill={color}
        fillOpacity="0.14"
      />
      <circle cx="12" cy="12" r="1.4" fill={color} />
    </svg>
  ),
  stoics: (color) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="philoAvatarSvg"
    >
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.4" />
      <line
        x1="3"
        y1="12"
        x2="21"
        y2="12"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.55"
      />
      <circle cx="12" cy="12" r="2.6" fill={color} fillOpacity="0.85" />
    </svg>
  ),
  kierkegaard: (color) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="philoAvatarSvg"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth="1.4"
        strokeOpacity="0.38"
      />
      <circle
        cx="12"
        cy="12"
        r="5.5"
        stroke={color}
        strokeWidth="1.2"
        strokeOpacity="0.65"
      />
      <circle
        cx="12"
        cy="12"
        r="2.4"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.88"
      />
      <circle cx="12" cy="12" r="0.9" fill={color} />
    </svg>
  ),
  camus: (color) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="philoAvatarSvg"
    >
      <circle cx="12" cy="9" r="4.5" stroke={color} strokeWidth="1.4" />
      <line
        x1="2"
        y1="16"
        x2="22"
        y2="16"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M4 19.5 Q7 18 10 19.5 Q13 21 16 19.5 Q19 18 22 19.5"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeOpacity="0.48"
      />
    </svg>
  ),
  aristotle: (color) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="philoAvatarSvg"
    >
      <line
        x1="12"
        y1="21"
        x2="12"
        y2="7"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <ellipse
        cx="15.5"
        cy="12"
        rx="4"
        ry="2.2"
        stroke={color}
        strokeWidth="1.2"
        transform="rotate(-40 15.5 12)"
        strokeOpacity="0.88"
      />
      <ellipse
        cx="8.5"
        cy="15.5"
        rx="4"
        ry="2.2"
        stroke={color}
        strokeWidth="1.2"
        transform="rotate(40 8.5 15.5)"
        strokeOpacity="0.88"
      />
    </svg>
  ),
};
