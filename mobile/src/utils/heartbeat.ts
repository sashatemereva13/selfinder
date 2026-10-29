import { Easing, makeMutable, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

// Today's heartbeat (2026-10-28) — one clock shared by everything that
// pulses with it, so they stay in step however often they remount. Each
// cycle runs 0 → 1 over HEARTBEAT_MS: a wave of light leaves the figure's
// chest and travels out through its joints (EnergyBody, phases 0 to
// HEARTBEAT_BODY_END), then carries on up Depths' spiral from the figure's
// feet to the ring (DepthsSpiralCore, HEARTBEAT_SPIRAL_START to
// HEARTBEAT_SPIRAL_END), and the rest of the cycle is stillness. It's the
// only thing on Today that moves on its own. Starts past the end of a cycle,
// so nothing is lit until it begins.

export const HEARTBEAT_MS = 5200;
export const HEARTBEAT_BODY_END = 0.35;
export const HEARTBEAT_SPIRAL_START = 0.4;
export const HEARTBEAT_SPIRAL_END = 0.85;

export const heartbeat = makeMutable(2);
let started = false;

// Starts the clock once, after `delay` (the figure's first draw-in).
export function startHeartbeat(delay: number) {
  if (started) return;
  started = true;
  heartbeat.value = withDelay(
    delay,
    withRepeat(
      withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: HEARTBEAT_MS, easing: Easing.linear })),
      -1,
      false,
    ),
  );
}
