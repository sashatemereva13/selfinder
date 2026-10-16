import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../../../src/theme/useThemeColors';
import { useThemeStore } from '../../../../src/store/themeStore';
import type { Colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, lineHeights } from '../../../../src/theme/typography';
import { spacing } from '../../../../src/theme/spacing';
import { ConsciousnessWheel } from '../../../../src/components/depths/ConsciousnessWheel';
import { AmbientGlow } from '../../../../src/components/shared/AmbientGlow';
import { BackLink } from '../../../../src/components/shared/BackLink';
import { useWideColumnWidth } from '../../../../src/theme/responsive';

export default function LevelsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const columnWidth = useWideColumnWidth();

  const goToLevel = (slug: string) => {
    router.push({ pathname: '/(tabs)/explore/level/[id]', params: { id: slug } });
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing[4], width: columnWidth, alignSelf: 'center' },
      ]}
    >
      {theme === 'dark' && <AmbientGlow />}
      <BackLink style={styles.backRow} />

      {/* 2026-10-16 — one title, one line, the wheel. The "LEVELS" label,
          the explaining paragraphs (one ended in reassurance — "…and that's
          not doing it wrong" — answering a judgement nobody made) and the
          list of all seventeen as filled boxes underneath (a second menu of
          the same thing, and cards) are gone: the ring is how the states
          are explored — drag to find one, tap its name to read about it. */}
      <Text style={styles.title}>{t('levels.title')}</Text>
      <Text style={styles.copy}>{t('levels.howToExplore')}</Text>

      <View style={styles.wheel}>
        <ConsciousnessWheel onSelectLevel={goToLevel} />
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { flexGrow: 1, padding: spacing[6], paddingBottom: spacing[12] },
  wheel: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing[8] },
  backRow: { paddingBottom: spacing[8] },
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
    marginBottom: spacing[8],
  },
  });
}
