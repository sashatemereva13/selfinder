import { Stack } from 'expo-router';
import { useThemeColors } from '../../../src/theme/useThemeColors';
import { SCREEN_TRANSITION } from '../../../src/theme/transitions';

export default function JourneysLayout() {
  // Dark behind every screen and every transition, never the default white.
  const colors = useThemeColors();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg.base }, ...SCREEN_TRANSITION }} />
  );
}
