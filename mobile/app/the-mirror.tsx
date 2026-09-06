import { JourneyScreenShell } from '../src/components/journeys/JourneyScreenShell';
import { THE_MIRROR_STAGES } from '../src/content/journeys/theMirror';

// The Mirror — built on the engine (see docs/journeys-concept.md).
// Structurally identical to the other conversational-only Journeys — no
// custom renderStageInput.
export default function TheMirrorScreen() {
  return (
    <JourneyScreenShell
      journeyKey="the-mirror"
      stages={THE_MIRROR_STAGES}
      titleKey="products.theMirrorLabel"
    />
  );
}
