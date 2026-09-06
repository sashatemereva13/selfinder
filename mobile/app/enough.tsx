import { JourneyScreenShell } from '../src/components/journeys/JourneyScreenShell';
import { ENOUGH_STAGES } from '../src/content/journeys/enough';

// Enough — "what would actually be enough for me?" Twelfth Journey in
// the current catalog (see docs/journeys-concept.md). Structurally
// identical to the other conversational-only Journeys — no custom
// renderStageInput.
export default function EnoughScreen() {
  return (
    <JourneyScreenShell
      journeyKey="enough"
      stages={ENOUGH_STAGES}
      titleKey="products.enoughLabel"
    />
  );
}
