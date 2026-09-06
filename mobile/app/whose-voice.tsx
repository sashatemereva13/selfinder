import { JourneyScreenShell } from '../src/components/journeys/JourneyScreenShell';
import { WHOSE_VOICE_STAGES } from '../src/content/journeys/whoseVoice';

// Whose Voice? — built on the engine (see docs/journeys-concept.md).
// Structurally identical to The Choice/The Loop — no custom
// renderStageInput.
export default function WhoseVoiceScreen() {
  return (
    <JourneyScreenShell
      journeyKey="whose-voice"
      stages={WHOSE_VOICE_STAGES}
      titleKey="products.whoseVoiceLabel"
    />
  );
}
