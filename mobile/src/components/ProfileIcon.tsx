import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme/spacing';
import { useAppAccentRgb } from '../utils/appAccent';
import { YouTabIcon } from './TabIcons';

// You's replacement now that it's off the bottom tab bar — reachable from
// all three tabs (Depths/Journeys/Your Arc), not just one, since settings
// should be reachable from wherever someone is (see
// docs/app-architecture-concept.md, "You becomes a profile page, not a
// tab"). A consistently-positioned top-right icon, absolutely positioned
// above each screen's own scroll content — same position on every tab so
// it reads as one persistent affordance, not three different buttons that
// happen to look alike.
//
// Colored via useAppAccentRgb — the same app-wide accent rule everywhere
// else uses (ivory before a first reading, that reading's own level color
// after, see appAccent.ts). Originally rendered in colors.text.muted
// (2026-08-27), which read as too faint to notice as a real tap target —
// switched to the full accent color (2026-08-28) for real visibility,
// not just theme-correctness.
export function ProfileIcon() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accentRgb = useAppAccentRgb();

  return (
    <Pressable
      style={[styles.wrap, { top: insets.top + spacing[4], right: spacing[6] }]}
      onPress={() => router.push('/profile')}
      hitSlop={8}
    >
      <YouTabIcon color={`rgb(${accentRgb})`} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    zIndex: 10,
  },
});
