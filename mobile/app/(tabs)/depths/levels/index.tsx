import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { VIBRATION_LEVELS } from '../../../../src/content/measureConfig';

const LEVELS_HIGH_TO_LOW = [...VIBRATION_LEVELS].reverse();

export default function LevelsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
    >
      <Text style={styles.kicker}>Levels</Text>
      <Text style={styles.title}>The map of consciousness</Text>
      <Text style={styles.copy}>
        Seventeen states, from highest to lowest. Tap any one to read what it means and
        what it tends to be asking of you.
      </Text>

      <View style={styles.list}>
        {LEVELS_HIGH_TO_LOW.map((level) => (
          <Pressable
            key={level.slug}
            style={styles.row}
            onPress={() => router.push({ pathname: '/(tabs)/depths/level/[id]', params: { id: level.slug } })}
          >
            <Text style={styles.rowName}>{level.name}</Text>
            <Text style={styles.rowScore}>{level.score}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  kicker: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.tight,
    marginTop: spacing[2],
  },
  copy: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
    marginTop: spacing[3],
    marginBottom: spacing[5],
  },
  list: { gap: spacing[2] },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    backgroundColor: colors.bg.elevated,
  },
  rowName: { color: colors.text.primary, fontFamily: fonts.light, fontSize: fontSizes.base },
  rowScore: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.sm },
});
