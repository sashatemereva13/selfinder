import { JourneyScreenShell } from '../src/components/journeys/JourneyScreenShell';
import { BECOMING_STAGES } from '../src/content/journeys/becoming';

// Becoming — "who am I becoming?" Ninth Journey built on the engine (see
// docs/journeys-concept.md). Structurally identical to the other
// conversational-only Journeys — no custom renderStageInput — so it's
// just stages + title handed to the shared JourneyScreenShell.
export default function BecomingScreen() {
  return (
    <JourneyScreenShell
      journeyKey="becoming"
      stages={BECOMING_STAGES}
      titleKey="products.becomingLabel"
    />
  );
}
