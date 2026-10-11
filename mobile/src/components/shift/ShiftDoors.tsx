import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useThemeColors } from '../../theme/useThemeColors';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { useMeasureStore } from '../../store/measureStore';
import { usePhilosopherStore } from '../../store/philosopherStore';
import { useEngagementStore } from '../../store/engagementStore';
import { useLocaleStore } from '../../store/localeStore';
import { getLocalizedLevelName, useLevelColors } from '../../content/measureConfig';
import { getOfferLine, OPEN_STATES, ShiftDoor } from '../../content/shiftContent';
import { getRelativeTimeBucket } from '../../utils/relativeTime';
import { useAppAccentTextRgb } from '../../utils/appAccent';
import { track } from '../../utils/analytics';
import { PhilosopherObject } from '../shared/PhilosopherObject';

// The Shift offer (docs/shift-concept.md, §3), at the top of Practice: the
// philosopher asks what the person wants to do with today's state, and
// there are two equal answers — Use it, or Shift toward love. Same size,
// same style, neither marked as the right one; each carries only a small
// dot of its own destination's colour. Seeing the offer counts as
// answering it for the philosopher's step — leaving is an answer too.
export function ShiftDoors() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const levelColors = useLevelColors();
  const accentTextRgb = useAppAccentTextRgb();
  const currentResult = useMeasureStore((s) => s.currentResult);
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const locale = useLocaleStore((s) => s.locale);
  const markOfferSeen = useEngagementStore((s) => s.markOfferSeen);

  const isToday = !!currentResult && getRelativeTimeBucket(currentResult.savedAt) === 'today';

  useFocusEffect(
    useCallback(() => {
      if (currentResult && isToday) markOfferSeen(currentResult.savedAt);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentResult?.savedAt, isToday])
  );

  // Shift starts from today's reading — there is no other way in.
  if (!currentResult || !philosopher || !isToday) {
    return <Text style={styles.plain}>{t('shift.needsReading')}</Text>;
  }

  const slug = currentResult.vibrationLevel.slug;
  const atLove = slug === 'love';
  const levelName = getLocalizedLevelName(currentResult.vibrationLevel, locale);
  const line = getOfferLine(philosopher.id, locale, levelName, atLove);

  const doors: { door: ShiftDoor; label: string; caption: string; rgb: string }[] = [
    {
      door: 'use',
      label: t('shift.useLabel'),
      caption: atLove ? t('shift.useCaptionAtLove') : t('shift.useCaption'),
      rgb: levelColors[slug],
    },
    // At love there's nowhere to shift toward — using it is the deepening.
    ...(atLove
      ? []
      : [
          {
            door: 'love' as const,
            label: t('shift.loveLabel'),
            caption: OPEN_STATES.includes(slug) ? t('shift.loveCaptionFromOpen') : t('shift.loveCaption'),
            rgb: levelColors.love,
          },
        ]),
  ];

  const choose = (door: ShiftDoor) => {
    track('shift_door_chosen', { door, level: slug });
    router.push({ pathname: '/(tabs)/depths/session' as never, params: { door } as never });
  };

  return (
    <View style={styles.root}>
      <View style={styles.byline}>
        <PhilosopherObject id={philosopher.id} rgb={accentTextRgb} size={24} />
        <Text style={styles.name}>{philosopher.name}</Text>
      </View>
      <Text style={styles.line}>{line}</Text>
      <View style={styles.doors}>
        {doors.map(({ door, label, caption, rgb }) => (
          <Pressable
            key={door}
            onPress={() => choose(door)}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint={caption}
            style={({ pressed }) => [styles.door, pressed && styles.doorPressed]}
          >
            <View style={styles.doorRow}>
              <View style={[styles.dot, { backgroundColor: `rgb(${rgb})` }]} />
              <Text style={styles.doorLabel}>{label}</Text>
            </View>
            <Text style={styles.doorCaption}>{caption}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { gap: spacing[4] },
    plain: { color: colors.text.secondary, fontFamily: fonts.light, fontSize: fontSizes.sm, lineHeight: fontSizes.sm * 1.5 },
    byline: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
    name: { color: colors.text.muted, fontFamily: fonts.medium, fontSize: fontSizes.xs },
    line: {
      color: colors.text.primary,
      fontFamily: fonts.voice,
      fontSize: fontSizes.lg,
      lineHeight: fontSizes.lg * 1.35,
    },
    doors: { gap: spacing[3], marginTop: spacing[2] },
    door: {
      borderWidth: 1,
      borderColor: colors.bg.border,
      borderRadius: radius.full,
      paddingVertical: spacing[4],
      paddingHorizontal: spacing[6],
      alignItems: 'center',
      gap: spacing[1],
    },
    doorPressed: { opacity: 0.6 },
    doorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
    dot: { width: 7, height: 7, borderRadius: 3.5 },
    doorLabel: { color: colors.text.primary, fontFamily: fonts.medium, fontSize: fontSizes.base },
    doorCaption: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs },
  });
}
