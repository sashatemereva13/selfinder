import { JourneyScreenShell } from '../src/components/journeys/JourneyScreenShell';
import { THE_CHOICE_STAGES } from '../src/content/journeys/theChoice';

// The Choice — built on the engine (see docs/journeys-concept.md). No
// custom renderStageInput here: The Choice has no non-text stage.
export default function TheChoiceScreen() {
  return (
    <JourneyScreenShell
      journeyKey="the-choice"
      stages={THE_CHOICE_STAGES}
      titleKey="products.theChoiceLabel"
    />
  );
}
