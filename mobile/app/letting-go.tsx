import { JourneyScreenShell } from '../src/components/journeys/JourneyScreenShell';
import { LETTING_GO_STAGES } from '../src/content/journeys/lettingGo';

// Letting Go — built on the engine (see docs/journeys-concept.md).
// Structurally identical to the other conversational-only Journeys — no
// custom renderStageInput.
export default function LettingGoScreen() {
  return (
    <JourneyScreenShell
      journeyKey="letting-go"
      stages={LETTING_GO_STAGES}
      titleKey="products.lettingGoLabel"
    />
  );
}
