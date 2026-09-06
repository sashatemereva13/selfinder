import { Pressable, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme/spacing';
import { useThemeStore } from '../store/themeStore';
import { AURA_NEUTRAL_IMAGE, AURA_NEUTRAL_IMAGE_LIGHT } from '../content/auraLevelImages';

// You's replacement now that it's off the bottom tab bar — reachable from
// all three tabs (Depths/Journeys/Your Arc), not just one, since settings
// should be reachable from wherever someone is (see
// docs/app-architecture-concept.md, "You becomes a profile page, not a
// tab"). A consistently-positioned top-right icon, absolutely positioned
// above each screen's own scroll content — same position on every tab so
// it reads as one persistent affordance, not three different buttons that
// happen to look alike.
//
// 2026-09-03 — replaced the generic YouTabIcon (a plain head-and-
// shoulders outline, colored via the app-wide accent) with a small,
// always-NEUTRAL rendering of the real aura figure. Two problems this
// solves at once: (1) the outline icon was the one symbol in the whole
// app unrelated to Selfinder's own visual language (aura, rings,
// spirals) — now there is exactly ONE symbol for "yourself," used at two
// sizes, not two different symbols; (2) the old icon's color switched to
// the current reading's own level color after a first Measure, which on
// a non-reading-scoped screen (Journeys, Your Arc) would make this icon a
// SECOND competing accent color on a screen meant to have exactly one —
// always using the NEUTRAL aura (never a level color) keeps it a stable,
// always-recognizable glyph regardless of reading state, deliberately
// never personalized the way the big aura on Depths is.
//
// AURA_NEUTRAL_IMAGE (a pre-baked PNG), not the live AuraFigure SVG
// component — a first attempt used AuraFigure directly at icon scale
// (even with its rim-glow/dot filters disabled) and it rendered as a soft
// blur rather than a legible figure: AuraFigure's goo/blur filter
// stdDeviations are tuned in absolute pixels for a much larger canvas,
// so they don't scale down cleanly. auraLevelImages.ts's own pre-baked
// assets exist for exactly this reason (see that file's header comment —
// react-native-svg's filter engine doesn't reproduce correctly live on
// native at all, not just at small sizes), so reusing the neutral one
// here is the same fix Depths itself already relies on, not a new
// workaround.
const ICON_WIDTH = 22;
// The source PNG's own aspect ratio (480x840) — Image needs an explicit
// height since these assets have no intrinsic-size lookup wired up the
// way a local require() would for e.g. web <img>.
const ICON_HEIGHT = ICON_WIDTH * (840 / 480);

export function ProfileIcon() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useThemeStore((s) => s.theme);

  return (
    <Pressable
      style={[styles.wrap, { top: insets.top + spacing[4], right: spacing[6] }]}
      onPress={() => router.push('/profile')}
      hitSlop={12}
    >
      <Image
        source={theme === 'light' ? AURA_NEUTRAL_IMAGE_LIGHT : AURA_NEUTRAL_IMAGE}
        style={{ width: ICON_WIDTH, height: ICON_HEIGHT }}
        resizeMode="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    zIndex: 10,
  },
});
