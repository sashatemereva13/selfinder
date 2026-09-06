import { JourneyScreenShell } from '../src/components/journeys/JourneyScreenShell';
import { AgencySortPrimitive } from '../src/components/AgencySortPrimitive';
import { CONTROL_STAGES } from '../src/content/journeys/control';

// Control — "what am I really trying to control?" The reference
// implementation for the Journey architecture (see
// docs/journeys-concept.md for the full worked example this screen
// implements). The one Journey so far with a non-text stage (the
// agency/influence/authorship sort) and its own authored reflection
// copy (a "shift" line drawn from the separate stage's reveal text,
// between the began/arrived quotes every other Journey's reflection
// uses unchanged) — everything else runs through the same
// JourneyScreenShell as the other Journeys.
export default function ControlScreen() {
  return (
    <JourneyScreenShell
      journeyKey="control"
      stages={CONTROL_STAGES}
      titleKey="products.controlLabel"
      reflection={{
        beganLabelKey: 'control.reflectionBegan',
        beganAnswer: (session) =>
          session.stages.find((s) => s.stageId === 'wish')?.finalAnswer ??
          session.stages[0]?.finalAnswer ??
          '',
        shiftLabelKey: 'control.reflectionShift',
        shiftText: (session) =>
          session.stages.find((s) => s.stageId === 'separate')?.revealText ?? undefined,
        arrivedLabelKey: 'control.reflectionArrived',
        arrivedAnswer: (session) => session.stages[session.stages.length - 1]?.finalAnswer ?? '',
      }}
      renderStageInput={(stage, onSubmit, priorFinalAnswers, extractedPropositions) => {
        if (stage.primitive !== 'agency-sort') return null;
        return <AgencySortPrimitive items={extractedPropositions ?? priorFinalAnswers} onSubmit={onSubmit} />;
      }}
    />
  );
}
