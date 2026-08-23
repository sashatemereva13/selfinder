import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { getMe } from '../api/user';

// The real entitlement check for Your Arc — a signed-in account's
// server-side User.arcSubscription.active (set today by an admin grant via
// backend/scripts/grantArcSubscription.js, a real StoreKit/Play Billing
// receipt sync once that's built) is the only source of truth. Renamed
// from useIsSubscribed.ts (2026-08-22) once Selfinder+ split into two
// products — see useJourneyPurchases.ts for Journey entitlement, and
// useArcTrialStatus.ts for the free-trial signal layered on top of this
// same boolean (2026-08-23 pivot). No local override exists anywhere, for
// anyone, on any device. Defaults to false (the your-arc-preview
// experience) for a signed-out session or a signed-in account with no
// grant — the same as everyone else until they actually have one.
export function useArcSubscription(): boolean {
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
        if (!cancelled) setActive(profile.arcSubscription?.active ?? false);
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
