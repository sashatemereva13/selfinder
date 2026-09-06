import { JourneyScreenShell } from '../src/components/journeys/JourneyScreenShell';
import { THE_THRESHOLD_STAGES } from '../src/content/journeys/theThreshold';

// The Threshold — built on the engine (see docs/journeys-concept.md).
// Structurally identical to the other conversational-only Journeys — no
// custom renderStageInput.
export default function TheThresholdScreen() {
  return (
    <JourneyScreenShell
      journeyKey="the-threshold"
      stages={THE_THRESHOLD_STAGES}
      titleKey="products.theThresholdLabel"
    />
  );
}
