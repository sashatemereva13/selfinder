import { JourneyScreenShell } from '../src/components/journeys/JourneyScreenShell';
import { THE_UNSAID_STAGES } from '../src/content/journeys/theUnsaid';

// The Unsaid — built on the engine (see docs/journeys-concept.md).
// Structurally identical to the other conversational-only Journeys — no
// custom renderStageInput.
export default function TheUnsaidScreen() {
  return (
    <JourneyScreenShell
      journeyKey="the-unsaid"
      stages={THE_UNSAID_STAGES}
      titleKey="products.theUnsaidLabel"
    />
  );
}
