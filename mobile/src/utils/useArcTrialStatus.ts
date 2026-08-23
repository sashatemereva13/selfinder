import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { getMe } from '../api/user';

// Free-trial window for a non-subscribed account (2026-08-23 pivot — see
// RULES.md's Product/positioning section). Mirrors
// backend/controllers/chatController.js's own FREE_TRIAL_READING_LIMIT —
// kept in sync by hand, same pattern the app already uses for other
// server/client-shared constants.
export const FREE_TRIAL_READING_LIMIT = 7;

export interface ArcTrialStatus {
  subscribed: boolean;
  savedReadingCount: number;
  trialLimit: typeof FREE_TRIAL_READING_LIMIT;
  // 0 once subscribed OR once the trial is exhausted — a subscribed
  // account has no trial to compare against, so this is deliberately not
  // "unlimited," just 0 (the caller checks `subscribed` separately for
  // that distinction, same as useArcSubscription's own boolean).
  remaining: number;
}

// The free-trial signal your-arc-preview.tsx (and, later, any other
// screen that wants to show trial progress) needs — kept separate from
// useArcSubscription's plain boolean rather than widening its return type,
// since that hook is already consumed elsewhere expecting a bare boolean.
// Backed by the same getMe call, which now also returns
// savedReadingCount (a cheap count query, not a byproduct of fetching
// full reading history — see userController.js's own comment).
export function useArcTrialStatus(): ArcTrialStatus | null {
  const session = useAuthStore((s) => s.session);
  const [status, setStatus] = useState<ArcTrialStatus | null>(null);

  useEffect(() => {
    if (!session) {
      setStatus(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const profile = await getMe(session.token);
        if (cancelled) return;
        const subscribed = profile.arcSubscription?.active ?? false;
        const savedReadingCount = profile.savedReadingCount ?? 0;
        setStatus({
          subscribed,
          savedReadingCount,
          trialLimit: FREE_TRIAL_READING_LIMIT,
          remaining: subscribed ? 0 : Math.max(0, FREE_TRIAL_READING_LIMIT - savedReadingCount),
        });
      } catch {
        if (!cancelled) setStatus(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  return status;
}
