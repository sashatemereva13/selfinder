import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/theme/useThemeColors';
import { spacing } from '../src/theme/spacing';
import { useAppAccentRgb } from '../src/utils/appAccent';
import { ArcKaleidoscopeLoading } from '../src/components/shared/ArcKaleidoscopeLoading';
import { ProfileIcon } from '../src/components/shared/ProfileIcon';
import { ArcLinePage } from '../src/components/yourArc/pages/ArcLinePage';

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
// fetch. This file now IS ArcLinePage's cone — the three curved zone
// labels — and nothing else: no wheel, no pager, since it's a
// navigational hub, not one more page in a sequence. Past/future push
// real routes instead of requesting a same-pager jump, since there's no
// longer a shared pager to jump within.
//
// 2026-09-12 — the arcLine fetch (a philosopher's live reflection quote,
// once rendered over the cone's own present zone) is gone along with the
// quote itself: see ArcLinePage's own header comment for why that text
// moved off this page entirely. This file now needs no Your-Arc-specific
// data fetch at all — it's a pure navigational hub over static geometry.
//
// 2026-09-13, at the user's own request — Present now routes to Center
// (the kaleidoscope) instead of Depths. Reasoning: Center was hard to
// find (buried one swipe deep inside the Past pager, on FactsPage's own
// row) despite being, in the user's own words, "really beautiful," and
// "the eternal now" — this vertex, the single point where past and
// future meet — is a genuinely better conceptual match for Center's own
// nature (a fresh, generated reflection of THIS present moment, real but
// deliberately NOT part of the historical record, see RULES.md) than it
// ever was for Depths (a reading is part of the record, the opposite
// kind of thing). Depths loses its one-tap hub shortcut, but keeps its
// own dedicated bottom tab — this hub screen doesn't need to duplicate
// that entry point. FactsPage's own Center row is untouched; this is a
// second entry point to the same route, not a replacement for the first.
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.base, paddingTop: insets.top + spacing[4] }}>
      <ProfileIcon />
      <ArcLinePage
        onJumpToPresent={() => router.push('/center')}
        onJumpToPast={() => router.push('/your-arc-past')}
        onJumpToFuture={() => router.push('/your-arc-future')}
      />
    </View>
  );
}
