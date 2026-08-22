import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { getMe } from '../api/user';
import { CenterPurchase } from '../types';

// Every past Center purchase for the signed-in account — server-side
// User.centerPurchases (set today by an admin grant via
// backend/scripts/grantCenter.js, run once per purchase; a real StoreKit/
// Play Billing consumable-IAP receipt sync once that's built). Unlike
// useArcSubscription's plain boolean, this returns the full list — Center
// is browsable history (every past purchase produced its own generated
// result), not a single on/off flag. null means "still loading, or signed
// out" — distinct from [] ("signed in, never purchased") so
// app/center.tsx can tell a genuine empty state from a not-yet-resolved
// one.
export function useCenterPurchases(): CenterPurchase[] | null {
  const session = useAuthStore((s) => s.session);
  const [purchases, setPurchases] = useState<CenterPurchase[] | null>(null);

  useEffect(() => {
    if (!session) {
      setPurchases(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const profile = await getMe(session.token);
        if (!cancelled) setPurchases(profile.centerPurchases ?? []);
      } catch {
        if (!cancelled) setPurchases([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  return purchases;
}
