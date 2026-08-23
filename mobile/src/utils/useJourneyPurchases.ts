import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { getMe } from '../api/user';
import { JourneyPurchase, JourneyKey } from '../types';

// Every past Journey purchase for the signed-in account — server-side
// User.journeyPurchases (set today by an admin grant via
// backend/scripts/grantJourney.js, run once per purchase; a real StoreKit/
// Play Billing consumable-IAP receipt sync once that's built). Renamed and
// generalized from useCenterPurchases.ts (2026-08-23 pivot) once Center
// became the first of an open-ended Journey family — see RULES.md's
// Product/positioning section. Returns the full list, not a boolean —
// every Journey is browsable history (each past purchase produced its own
// generated result), not a single on/off flag. null means "still loading,
// or signed out" — distinct from [] ("signed in, never purchased") so a
// screen like app/center.tsx can tell a genuine empty state from a
// not-yet-resolved one.
//
// Pass a specific `journey` to get only that Journey's purchases (what
// app/center.tsx does — `useJourneyPurchases('center')`); omit it to get
// every purchase across every Journey. A future Journey's own screen
// calls this same hook with its own key, no new hook needed.
export function useJourneyPurchases(journey?: JourneyKey): JourneyPurchase[] | null {
  const session = useAuthStore((s) => s.session);
  const [purchases, setPurchases] = useState<JourneyPurchase[] | null>(null);

  useEffect(() => {
    if (!session) {
      setPurchases(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const profile = await getMe(session.token);
        if (!cancelled) setPurchases(profile.journeyPurchases ?? []);
      } catch {
        if (!cancelled) setPurchases([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (purchases === null) return null;
  return journey ? purchases.filter((p) => p.journey === journey) : purchases;
}
