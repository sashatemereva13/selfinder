import { View } from 'react-native';
import { useThemeColors } from '../src/theme/useThemeColors';

// Never actually seen — the root layout's redirect effect sends every visit
// here straight to /onboarding or /(tabs)/depths. This just gives that effect
// a real matched route to run for on a fresh "/" launch.
export default function Index() {
  const colors = useThemeColors();
  return <View style={{ flex: 1, backgroundColor: colors.bg.base }} />;
}
