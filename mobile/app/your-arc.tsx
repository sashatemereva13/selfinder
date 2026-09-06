import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/theme/useThemeColors';
import { spacing } from '../src/theme/spacing';
import { useAuthStore } from '../src/store/authStore';
import { usePhilosopherStore } from '../src/store/philosopherStore';
import { getArcLine } from '../src/api/arcLine';
import { useAppAccentRgb } from '../src/utils/appAccent';
import { ArcKaleidoscopeLoading } from '../src/components/ArcKaleidoscopeLoading';
import { ProfileIcon } from '../src/components/ProfileIcon';
import { ArcLinePage } from '../src/components/yourArcPages/ArcLinePage';

// Used by the first-paint loading placeholder (scaled down) — see
// YourArcRoute's own comment below for why this thin wrapper exists at
// all.
const KALEIDOSCOPE_SIZE = 300;

// 2026-09-05: Your Arc's hub restructure — this file used to build the
// entire flat pager (Facts, TimeCone, Journeys, wish/Crossing, Closing,
// dynamically-appended Detail), all sharing ONE ArcDial. That's moved out
// into two standalone sub-pagers, `your-arc-past.tsx` (Facts, TimeCone,
// Journeys, Detail) and `your-arc-future.tsx` (ResurfacedWish, WishCrossing,
// Crossing, Closing), each with its own ArcDial and its own scoped data
// fetch. This file now IS ArcLinePage's cone — the quote, the three curved
// zone labels — and nothing else: no wheel, no pager, since it's a
// navigational hub, not one more page in a sequence. Present still routes
// straight to Depths (a reading's one real home, per RULES.md's "one
// reading, one screen" rule); past/future now push real routes instead of
// requesting a same-pager jump, since there's no longer a shared pager to
// jump within.
//
// arcLine is the only piece of Your-Arc-specific data this file still
// needs — everything else that used to live in the old single 6-call fetch
// (getMe/getMeasureHistory/listMySpillEntries/listMyWishes/
// listMyCrossings/listMyJourneySessions) moved into whichever sub-pager
// actually consumes it, since neither one is reachable from here without a
// real navigation anyway.
export default function YourArcRoute() {
  const colors = useThemeColors();
  const accentRgb = useAppAccentRgb();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.base, justifyContent: 'center', alignItems: 'center' }}>
        <ArcKaleidoscopeLoading size={KALEIDOSCOPE_SIZE * 0.6} accentRgb={accentRgb} />
      </View>
    );
  }

  return <YourArcHubScreen />;
}

function YourArcHubScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const session = useAuthStore((s) => s.session);
  const [arcLine, setArcLine] = useState<string | null>(null);

  // Same single endpoint ArcLinePage's quote always used, unchanged by
  // this restructure — cached server-side per calendar day, so there's no
  // cost to calling it every visit. Requires a chosen philosopher (the
  // line is generated in their voice) and at least one reading server-side,
  // or the backend 404s and this stays null — ArcLinePage's own static
  // fallback line covers that case.
  useEffect(() => {
    if (!session || !philosopher) return;
    let cancelled = false;
    (async () => {
      const line = await getArcLine(philosopher, session.token);
      if (!cancelled) setArcLine(line);
    })();
    return () => {
      cancelled = true;
    };
  }, [session, philosopher]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.base, paddingTop: insets.top + spacing[4] }}>
      <ProfileIcon />
      <ArcLinePage
        arcLine={arcLine}
        onJumpToPresent={() => router.push('/(tabs)/depths')}
        onJumpToPast={() => router.push('/your-arc-past')}
        onJumpToFuture={() => router.push('/your-arc-future')}
      />
    </View>
  );
}
