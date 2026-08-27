import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme/spacing';
import { useThemeColors } from '../theme/useThemeColors';
import { YouTabIcon } from './TabIcons';

// You's replacement now that it's off the bottom tab bar — reachable from
// all three tabs (Depths/Journeys/Your Arc), not just one, since settings
// should be reachable from wherever someone is (see
// docs/app-architecture-concept.md, "You becomes a profile page, not a
// tab"). A quiet, consistently-positioned top-right icon, absolutely
// positioned above each screen's own scroll content — same position on
// every tab so it reads as one persistent affordance, not three different
// buttons that happen to look alike.
export function ProfileIcon() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  return (
    <Pressable
      style={[styles.wrap, { top: insets.top + spacing[4], right: spacing[6] }]}
      onPress={() => router.push('/profile')}
      hitSlop={8}
    >
      <YouTabIcon color={colors.text.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    zIndex: 10,
  },
});
