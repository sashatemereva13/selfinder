import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useLocaleStore } from '../../store/localeStore';
import type { ShiftSession } from '../../store/shiftStore';
import type { JourneyKey, JourneySessionDTO } from '../../types';
import { VIBRATION_LEVELS, getLocalizedLevelName, useLevelTextColors } from '../../content/measureConfig';
import { formatDate } from '../../utils/relativeTime';

// The name each Journey shows on its own catalog row — reused rather than
// inventing separate copy, since it's the name the person already knows.
export const JOURNEY_LABEL_KEYS: Record<JourneyKey, string> = {
  center: 'center.title',
  control: 'products.controlLabel',
  'the-choice': 'products.theChoiceLabel',
  'the-loop': 'products.theLoopLabel',
  'whose-voice': 'products.whoseVoiceLabel',
  'the-road-not-taken': 'products.theRoadNotTakenLabel',
  'letting-go': 'products.lettingGoLabel',
  'the-mirror': 'products.theMirrorLabel',
  'the-unsaid': 'products.theUnsaidLabel',
  becoming: 'products.becomingLabel',
  'the-threshold': 'products.theThresholdLabel',
  'possible-selves': 'products.possibleSelvesLabel',
  enough: 'products.enoughLabel',
};

// Moments on the Past page (2026-10-21) — a reading is DetailPage; these
// are the other two kinds of stop. A record, never an interpretation: where
// it started and ended, and the person's own words.

export function ShiftMoment({ session }: { session: ShiftSession }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = useLocaleStore((s) => s.locale);
  const levelTextColors = useLevelTextColors();

  const nameOf = (slug: string) => {
    const level = VIBRATION_LEVELS.find((l) => l.slug === slug);
    const name = level ? getLocalizedLevelName(level, locale) : slug;
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  const words: { label: string; text?: string }[] = [
    { label: t('yourArc.momentGratitude'), text: session.words.gratitude },
    { label: t('yourArc.momentAct'), text: session.words.act },
    { label: t('yourArc.momentWhere'), text: session.words.where },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.when}>{formatDate(session.at, locale)}</Text>
      <Text style={styles.door}>{session.door === 'love' ? t('yourArc.momentShifted') : t('yourArc.momentUsed')}</Text>
      <View style={styles.fromTo}>
        <Text style={[styles.level, { color: `rgb(${levelTextColors[session.fromSlug]})` }]}>{nameOf(session.fromSlug)}</Text>
        <Text style={styles.arrow}>→</Text>
        <Text style={[styles.level, { color: `rgb(${levelTextColors[session.toSlug]})` }]}>{nameOf(session.toSlug)}</Text>
      </View>
      {words
        .filter((w) => w.text)
        .map((w) => (
          <View key={w.label} style={styles.section}>
            <Text style={styles.sectionLabel}>{w.label}</Text>
            <Text style={styles.sectionText}>{w.text}</Text>
          </View>
        ))}
    </ScrollView>
  );
}

export function JourneyMoment({ session }: { session: JourneySessionDTO }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = useLocaleStore((s) => s.locale);
  const began = session.stages[0];
  const arrived = session.stages[session.stages.length - 1];
  const found = session.stages.find((s) => s.revealText);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.when}>{formatDate(session.completedAt ?? session.startedAt, locale)}</Text>
      <Text style={styles.level}>{t(JOURNEY_LABEL_KEYS[session.journey] ?? session.journey)}</Text>
      {began?.finalAnswer && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('journey.reflectionBegan')}</Text>
          <Text style={styles.sectionText}>{`"${began.finalAnswer}"`}</Text>
        </View>
      )}
      {found?.revealText && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('journey.reflectionShift')}</Text>
          <Text style={styles.sectionText}>{found.revealText}</Text>
        </View>
      )}
      {arrived?.finalAnswer && arrived !== began && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('journey.reflectionArrived')}</Text>
          <Text style={styles.sectionText}>{`"${arrived.finalAnswer}"`}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    content: { padding: spacing[6], gap: spacing[2] },
    when: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs },
    door: { color: colors.text.secondary, fontFamily: fonts.voice, fontSize: fontSizes.base },
    fromTo: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginTop: spacing[2] },
    level: { color: colors.text.primary, fontFamily: fonts.medium, fontSize: fontSizes.xl },
    arrow: { color: colors.text.muted, fontFamily: fonts.medium, fontSize: fontSizes.lg },
    section: { marginTop: spacing[6], gap: spacing[1] },
    sectionLabel: {
      color: colors.text.faint,
      fontFamily: fonts.medium,
      fontSize: 10,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    sectionText: { color: colors.text.primary, fontFamily: fonts.medium, fontSize: fontSizes.base, lineHeight: fontSizes.base * 1.5 },
  });
}
