import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { getMe } from '../api/user';

// The real entitlement check — a signed-in account's server-side
// User.subscription.active (set today by an admin grant via
// backend/scripts/grantSubscription.js, a real StoreKit/Play Billing
// receipt sync once that's built) is the only source of truth. No local
// override exists anywhere, for anyone, on any device — the dev toggle
// this replaced was removed for good, not hidden, once this real check
// existed to replace it. Defaults to false (the your-arc-preview
// experience) for a signed-out session or a signed-in account with no
// grant — the same as everyone else until they actually have one.
export function useIsSubscribed(): boolean {
  const session = useAuthStore((s) => s.session);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!session) {
      setActive(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const profile = await getMe(session.token);
        if (!cancelled) setActive(profile.subscription?.active ?? false);
      } catch {
        if (!cancelled) setActive(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  return active;
}
