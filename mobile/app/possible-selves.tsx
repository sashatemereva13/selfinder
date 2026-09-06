import { JourneyScreenShell } from '../src/components/journeys/JourneyScreenShell';
import { POSSIBLE_SELVES_STAGES } from '../src/content/journeys/possibleSelves';

// Possible Selves — built on the engine (see docs/journeys-concept.md).
// Structurally identical to the other conversational-only Journeys — no
// custom renderStageInput.
export default function PossibleSelvesScreen() {
  return (
    <JourneyScreenShell
      journeyKey="possible-selves"
      stages={POSSIBLE_SELVES_STAGES}
      titleKey="products.possibleSelvesLabel"
    />
  );
}
