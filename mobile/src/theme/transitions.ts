// How one screen gives way to the next, everywhere a stack pushes or pops
// (2026-09-26). Was the platform default — a slide in from the right —
// which is exactly what docs/design/aesthetic.md's motion rule refuses
// ("things gather, condense, and become — never slide or pop"), and it
// jarred against the map, which dissolves as it closes: now the place you
// picked appears where the map was, in one continuous fade. Shared by
// every stack so a screen arrives the same way however it was reached.
export const SCREEN_TRANSITION = {
  animation: 'fade',
  // iOS only (Android uses its own fade timing) — a touch quicker than the
  // 500ms default, which read as a pause rather than a dissolve.
  animationDuration: 350,
} as const;
