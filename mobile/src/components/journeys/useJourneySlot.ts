import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useJourneyPurchases } from '../../utils/useJourneyPurchases';
import { purchaseJourney } from '../../api/journeys';
import { JourneyKey, JourneyPurchase, JourneySessionDTO } from '../../types';

// Every conversational Journey screen (Control, Becoming, Enough, ...)
// used to paste this exact grant/restart logic into its own route file
// (see RULES.md's engineering-conventions discipline against duplicated
// logic) — one signed-in user gets a Journey self-granted the first time
// they open it, and can freely "do it again" afterward, each time
// producing a fresh, independently-browsable result (see RULES.md's
// Product/positioning section, "Opened again, not owned once").
// useJourneyPurchases only fetches once per session, so a freshly
// self-granted or restarted purchase is tracked locally in
// extraPurchases and merged in immediately rather than waiting on a
// refetch — see control.tsx's own history for why this became an array
// rather than a single slot (a single slot got shadowed once any real
// purchase existed).
export function useJourneySlot(journey: JourneyKey) {
  const session = useAuthStore((s) => s.session);
  const hookPurchases = useJourneyPurchases(journey);
  const [extraPurchases, setExtraPurchases] = useState<JourneyPurchase[]>([]);
  const [completedSession, setCompletedSession] = useState<JourneySessionDTO | null>(null);
  const [restarting, setRestarting] = useState(false);
  const grantRequestedRef = useRef(false);

  const purchases = hookPurchases === null ? null : [...hookPurchases, ...extraPurchases];
  const mostRecentPurchase = purchases && purchases.length > 0
    ? [...purchases].sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())[0]
    : null;

  useEffect(() => {
    if (!session || purchases === null || mostRecentPurchase || grantRequestedRef.current) return;
    grantRequestedRef.current = true;
    purchaseJourney(journey, session.token)
      .then((purchase) => setExtraPurchases((prev) => [...prev, purchase]))
      .catch(() => {
        grantRequestedRef.current = false; // allow a retry on the next render if this failed
      });
  }, [session, purchases, mostRecentPurchase, journey]);

  const handleDoItAgain = async () => {
    if (!session || restarting) return;
    setRestarting(true);
    try {
      const purchase = await purchaseJourney(journey, session.token);
      setExtraPurchases((prev) => [...prev, purchase]);
      setCompletedSession(null);
    } catch {
      // Best-effort — the person can just tap again; no destructive state
      // to roll back since completedSession/extraPurchases are only
      // touched on success.
    } finally {
      setRestarting(false);
    }
  };

  return {
    session,
    purchases,
    mostRecentPurchase,
    completedSession,
    setCompletedSession,
    restarting,
    handleDoItAgain,
    // Exposed for a screen with its own custom grant flow (e.g. center.tsx's
    // handleGetCenter, which has its own "get"/"repeat" copy rather than a
    // generic "do it again") — appends a freshly self-granted purchase the
    // same way handleDoItAgain does internally, so it's picked up immediately
    // without waiting on a useJourneyPurchases refetch.
    addPurchase: (purchase: JourneyPurchase) => setExtraPurchases((prev) => [...prev, purchase]),
  };
}
