import { JourneyScreenShell } from '../src/components/journeys/JourneyScreenShell';
import { THE_LOOP_STAGES } from '../src/content/journeys/theLoop';

// The Loop — built on the engine (see docs/journeys-concept.md).
// Structurally identical to The Choice — no custom renderStageInput, no
// authored reveal — every stage is a plain conversational exchange.
export default function TheLoopScreen() {
  return (
    <JourneyScreenShell
      journeyKey="the-loop"
      stages={THE_LOOP_STAGES}
      titleKey="products.theLoopLabel"
    />
  );
}
