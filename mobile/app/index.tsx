import { View, StyleSheet } from 'react-native';
import { colors } from '../src/theme/colors';

// Never actually seen — the root layout's redirect effect sends every visit
// here straight to /onboarding or /(tabs)/depths. This just gives that effect
// a real matched route to run for on a fresh "/" launch.
export default function Index() {
  return <View style={styles.root} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
});
