import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { ReadingLogEntry } from '../../store/measureStore';
import { SavedMeasureResult } from '../../types';
import { ArcFact } from '../../utils/arcFacts';
import { getLocalizedLevelName, VIBRATION_LEVELS, useLevelColors } from '../../content/measureConfig';
import { Locale } from '../../store/localeStore';
import { makeSharedArcPageStyles } from './arcPageShared';

interface FactsPageProps {
  readingLog: ReadingLogEntry[];
  sinceDate: string;
  facts: ArcFact[];
  richHistory: SavedMeasureResult[] | null;
  levelColors: ReturnType<typeof useLevelColors>;
  accentRgb: string;
  locale: Locale;
  onReadingPress: (rich: SavedMeasureResult) => void; // handleFactsReadingPress
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Real, true facts about this person's OWN record — never an
// interpretation of what a pattern means (see arcFacts.ts's own header
// comment). Sits before the past-readings list, so it's the immediate
// answer to "what is this page" rather than something you only get to
// after tapping around.
export function FactsPage({
  readingLog,
  sinceDate,
  facts,
  richHistory,
  levelColors,
  accentRgb,
  locale,
  onReadingPress,
}: FactsPageProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const sharedStyles = useMemo(() => makeSharedArcPageStyles(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={sharedStyles.pageContent}>
      <Text style={styles.kicker}>{t('yourArc.factsKicker')}</Text>
      <Text style={styles.introLine}>
        {t('yourArc.introLine', { count: readingLog.length, sinceDate })}
      </Text>
      <View style={styles.factsSection}>
        {facts.map((fact) => {
          if (fact.key === 'steadiest') {
            const level = VIBRATION_LEVELS.find((l) => l.slug === fact.params.levelSlug);
            const dotColor = level ? levelColors[level.slug] : undefined;
            return (
              <View key={fact.key} style={styles.factRow}>
                <View style={[styles.factDot, dotColor && { backgroundColor: `rgb(${dotColor})` }]} />
                <Text style={styles.factLine}>
                  {t('yourArc.factSteadiest', {
                    level: level ? getLocalizedLevelName(level, locale).toLowerCase() : fact.params.levelSlug,
                  })}
                </Text>
              </View>
            );
          }
          const i18nKey =
            fact.key === 'thisMonth' ? 'yourArc.factThisMonth'
            : fact.key === 'streak' ? 'yourArc.factStreak'
            : 'yourArc.factAllTime';
          return (
            <View key={fact.key} style={styles.factRow}>
              <View style={[styles.factDot, { backgroundColor: `rgb(${accentRgb})` }]} />
              <Text style={styles.factLine}>{t(i18nKey, { count: fact.params.count })}</Text>
            </View>
          );
        })}
      </View>
      {/* Past readings list — same date + level row shape as
          AccountSection's own history list. Tapping a row opens Your
          Arc's existing rich Detail page instead of expanding inline.
          Only shown once richHistory exists (signed-in + consented) — a
          stricter condition than the facts above it, which only need the
          local-only readingLog. */}
      {richHistory && richHistory.length > 0 && (
        <View style={styles.pastReadingsSection}>
          <Text style={styles.pastReadingsKicker}>{t('yourArc.pastReadingsHeading')}</Text>
          {/* The same free-vs-paid signal ("the FULL line, not just the
              last few") stated once, quietly, on the paid screen itself. */}
          <Text style={styles.fullLineNote}>{t('yourArc.fullLineNote')}</Text>
          <Text style={styles.pastReadingsTapHint}>{t('yourArc.pastReadingsTapHint')}</Text>
          {[...richHistory]
            .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
            .map((reading) => (
              <Pressable
                key={reading.id}
                style={styles.pastReadingRow}
                onPress={() => onReadingPress(reading)}
              >
                <Text style={styles.pastReadingDate}>{formatDate(new Date(reading.savedAt).getTime())}</Text>
                <Text style={styles.pastReadingLevel}>
                  {getLocalizedLevelName(reading.vibrationLevel, locale)}
                </Text>
              </Pressable>
            ))}
        </View>
      )}
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    kicker: {
      alignSelf: 'flex-start',
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
    },
    introLine: {
      alignSelf: 'flex-start',
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
      marginTop: spacing[3],
      marginBottom: spacing[8],
    },
    factsSection: {
      alignSelf: 'flex-start',
      width: '100%',
      marginTop: spacing[3],
      marginBottom: spacing[3],
      gap: spacing[3],
    },
    factRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing[2],
    },
    factDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 6,
      backgroundColor: colors.text.faint,
    },
    factLine: {
      flex: 1,
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
    },
    pastReadingsSection: {
      marginTop: spacing[6],
      paddingTop: spacing[4],
      borderTopWidth: 1,
      borderTopColor: colors.bg.border,
      gap: spacing[1],
    },
    pastReadingsKicker: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
      marginBottom: spacing[2],
    },
    pastReadingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing[2],
    },
    pastReadingDate: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs },
    pastReadingLevel: { color: colors.text.primary, fontFamily: fonts.light, fontSize: fontSizes.sm },
    fullLineNote: {
      color: colors.text.muted,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      marginBottom: spacing[3],
    },
    pastReadingsTapHint: {
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      marginBottom: spacing[3],
    },
  });
}
