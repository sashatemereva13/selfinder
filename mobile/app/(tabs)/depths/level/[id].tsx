import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../../src/theme/colors';

export default function LevelScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.text}>Level detail — coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.text.secondary, fontFamily: 'Panchang-Light', fontSize: 14 },
});
