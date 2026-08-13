import { router } from 'expo-router';

// Shared trigger, callable from anywhere — not scoped to any one feature.
// First caller is the wish flow's own moderation gate (see interview.tsx),
// but nothing about this function or the screen it routes to
// (app/crisis-support.tsx) is wish-specific.
export function routeToCrisisSupport() {
  router.push('/crisis-support');
}
