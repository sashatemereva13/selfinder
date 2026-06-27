import { Stars } from "@react-three/drei";

// Fills the void around the ball — distant, neutral, slow-drifting points,
// separate from MagicBall's own close-in Sparkles (which carry the chosen
// philosopher's accent color). Stars are the room's ambient cosmos, not
// part of anyone's personalization, so they stay colorless on purpose —
// same reasoning CosmicNebula already documents for its own palette.
export default function Starfield({ quality }) {
  const tier = quality?.tier || "medium";
  const isLowQuality = tier === "low";
  const isMediumQuality = tier === "medium";

  return (
    <Stars
      radius={140}
      depth={70}
      count={isLowQuality ? 900 : isMediumQuality ? 1700 : 2600}
      factor={3.2}
      saturation={0}
      fade
      speed={isLowQuality ? 0.15 : 0.3}
    />
  );
}
