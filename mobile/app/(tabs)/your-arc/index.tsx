import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useArcSubscription } from '../../../src/utils/useArcSubscription';

// Thin router — Your Arc's real content still lives at the top-level
// your-arc.tsx / your-arc-preview.tsx routes (unchanged this phase; see
// docs/app-architecture-concept.md Phase 1). This tab just reproduces the
// branch depths/index.tsx's old spiral slot used to make at click time,
// so landing on the tab behaves identically to tapping that slot did.
export default function YourArcTabEntry() {
  const router = useRouter();
  const isSubscribed = useArcSubscription();

  useEffect(() => {
    router.replace(isSubscribed ? '/your-arc' : '/your-arc-preview');
  }, [isSubscribed]);

  return null;
}
