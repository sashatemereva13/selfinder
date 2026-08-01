import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, Pressable, LayoutAnimation, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { getLevelBySlug } from '../../../../src/content/levelsContent';
import { LEVEL_COLORS } from '../../../../src/content/measureConfig';
import { track } from '../../../../src/utils/analytics';
import { useEngagementStore } from '../../../../src/store/engagementStore';

// The source material has exactly one inline "**bold**" emphasis across all
// seventeen levels — this splits on it so that spot renders as real emphasis
// instead of showing literal asterisks (RN Text has no markdown support).
function renderRich(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) => {
    const match = part.match(/^\*\*([^*]+)\*\*$/);
    return match ? (
      <Text key={i} style={styles.bold}>{match[1]}</Text>
    ) : (
      <Text key={i}>{part}</Text>
    );
  });
}

export default function LevelScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const level = id ? getLevelBySlug(id) : undefined;
  const [deepDiveOpen, setDeepDiveOpen] = useState(false);
  const markDiscovered = useEngagementStore((s) => s.markDiscovered);

  useEffect(() => {
    if (level) {
      track('level_detail_viewed', { slug: level.slug });
      markDiscovered('levels');
    }
  }, [level?.slug]);

  const toggleDeepDive = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDeepDiveOpen((open) => !open);
  };

  if (!level) {
    return (
      <View style={[styles.root, styles.notFoundRoot]}>
        <Text style={styles.notFoundText}>{t('level.notFound')}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>{t('common.back')}</Text>
        </Pressable>
      </View>
    );
  }

  const accentColor = `rgb(${LEVEL_COLORS[level.slug] ?? colors.accent.ivoryRgb})`;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
    >
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Text style={styles.backLink}>{t('common.back')}</Text>
      </Pressable>

      <Text style={[styles.kicker, { color: accentColor }]}>{t('level.levelScore', { score: level.score })}</Text>
      <Text style={styles.title}>{level.title}</Text>
      <Text style={[styles.frame, { borderLeftColor: accentColor }]}>{level.frame}</Text>

      {level.signals && (
        <View style={styles.signals}>
          {level.signals.map((signal) => (
            <View key={signal.label} style={styles.signalRow}>
              <Text style={styles.signalLabel}>{signal.label.toUpperCase()}</Text>
              <Text style={styles.signalValue}>{signal.value}</Text>
            </View>
          ))}
        </View>
      )}

      {level.paragraphs && (
        <View style={styles.sectionBlock}>
          {level.paragraphs.map((paragraph, i) => (
            <Text key={i} style={styles.paragraph}>{renderRich(paragraph)}</Text>
          ))}
        </View>
      )}

      {level.sections?.map((section) => (
        <View key={section.heading} style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>{section.heading}</Text>
          {section.paragraphs.map((paragraph, i) => (
            <Text key={i} style={styles.paragraph}>{renderRich(paragraph)}</Text>
          ))}
        </View>
      ))}

      {level.deepDive && (
        <View style={styles.deepDiveBlock}>
          <Pressable onPress={toggleDeepDive}>
            <Text style={[styles.deepDiveToggle, { color: accentColor }]}>
              {deepDiveOpen ? t('level.hideDeeperRead') : t('level.goDeeper')}
            </Text>
          </Pressable>

          {deepDiveOpen && (
            <View style={styles.deepDiveBody}>
              {level.deepDive.map((section) => (
                <View key={section.heading} style={styles.sectionBlock}>
                  <Text style={styles.sectionHeading}>{section.heading}</Text>
                  {section.paragraphs.map((paragraph, i) => (
                    <Text key={i} style={styles.paragraph}>{renderRich(paragraph)}</Text>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  notFoundRoot: { alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  notFoundText: { color: colors.text.secondary, fontFamily: fonts.light, fontSize: fontSizes.base },
  backRow: { paddingBottom: spacing[8] },
  backLink: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
  kicker: {
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
    marginBottom: spacing[4],
  },
  frame: {
    color: colors.text.primary,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    paddingLeft: spacing[4],
    borderLeftWidth: 2,
    marginBottom: spacing[5],
  },
  signals: {
    gap: spacing[3],
    marginBottom: spacing[5],
    padding: spacing[4],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    backgroundColor: colors.bg.elevated,
  },
  signalRow: { gap: spacing[1] },
  signalLabel: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.wide,
  },
  signalValue: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  sectionBlock: { marginBottom: spacing[5] },
  sectionHeading: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    marginBottom: spacing[3],
  },
  paragraph: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.loose,
    marginBottom: spacing[3],
  },
  bold: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
  },
  deepDiveBlock: { marginTop: spacing[2] },
  deepDiveToggle: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    letterSpacing: letterSpacings.wide,
    textTransform: 'uppercase',
  },
  deepDiveBody: {
    marginTop: spacing[5],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.bg.border,
  },
});
