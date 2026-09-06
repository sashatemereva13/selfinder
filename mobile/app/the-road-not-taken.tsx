import { JourneyScreenShell } from '../src/components/journeys/JourneyScreenShell';
import { THE_ROAD_NOT_TAKEN_STAGES } from '../src/content/journeys/theRoadNotTaken';

// The Road Not Taken — built on the engine (see docs/journeys-concept.md).
// No custom renderStageInput, every stage is a plain conversational
// exchange.
export default function TheRoadNotTakenScreen() {
  return (
    <JourneyScreenShell
      journeyKey="the-road-not-taken"
      stages={THE_ROAD_NOT_TAKEN_STAGES}
      titleKey="products.theRoadNotTakenLabel"
    />
  );
}
