import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../../src/theme/useThemeColors';
import type { Colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { AmbientGlow } from '../../../src/components/shared/AmbientGlow';
import { BackLink } from '../../../src/components/shared/BackLink';
import { ShiftDoors } from '../../../src/components/shift/ShiftDoors';

// Choose — the third step of Today's chain (RULES.md, "Three places, one
// chain"): see where you are → understand it → choose what to do with it.
// One job: the philosopher's question and the two equal doors, Use it or
// Shift toward love (docs/shift-concept.md, §3). Reached from the end of
// your state's page, or the minimap handle.
export default function ChooseScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[4], paddingBottom: spacing[6] }]}>
      <AmbientGlow />
      <BackLink style={styles.backRow} />
      <View style={styles.body}>
        <ShiftDoors />
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg.base, paddingHorizontal: spacing[6] },
    backRow: { alignSelf: 'flex-start' },
    body: { flex: 1, justifyContent: 'center' },
  });
}
