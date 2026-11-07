import { Stack } from 'expo-router';
import { useThemeColors } from '../../../src/theme/useThemeColors';
import { SCREEN_TRANSITION } from '../../../src/theme/transitions';

// Your Arc's own stack (2026-10-29): the welcome first, the cone pushed on
// top of it — so a swipe back from the cone returns to the welcome.
export default function YourArcLayout() {
  const colors = useThemeColors();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg.base }, ...SCREEN_TRANSITION }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="cone" options={{ gestureEnabled: true, fullScreenGestureEnabled: true }} />
    </Stack>
  );
}
