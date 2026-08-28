import YourArcRoute from '../../your-arc';

// Renders Your Arc's full content directly inside the tab (see
// app/your-arc.tsx). No branch on subscription status — Selfinder is
// fully free for now (no legal entity yet to receive real payment, see
// RULES.md's Product/positioning section), so everyone signed in and
// consented sees the same full history. The old redirect to
// your-arc-preview.tsx (the not-subscribed teaser) was removed
// 2026-08-28 along with that screen entirely, once there was nothing
// left to preview toward.
export default function YourArcTabEntry() {
  return <YourArcRoute />;
}
