import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../../../theme/useThemeColors';
import type { Colors } from '../../../theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { ReadingLogEntry } from '../../../store/measureStore';
import { SavedWish } from '../../../api/wish';
import { TimeConeRing } from '../TimeConeRing';
import { useTimeConeGeometry } from '../useTimeConeGeometry';
import { getLocalizedLevelName, VIBRATION_LEVELS } from '../../../content/measureConfig';
import { Locale } from '../../../store/localeStore';
import { formatDate } from '../../../utils/relativeTime';
import { makeSharedArcPageStyles } from './arcPageShared';

interface TimeConePageProps {
  readingLog: ReadingLogEntry[];
  allWishes: SavedWish[];
  activeWish: SavedWish | null;
  locale: Locale;
}

const CONE_SIZE = 260;

// The light cone — split out of Center 2026-08-29 (it used to live only
// there, alongside the kaleidoscope) and given a real home of its own on
// Your Arc, matching what useTimeConeGeometry.ts's own header comment
// already anticipated ("so both Your Arc... and Center... can compute it
// without duplicating the geometry logic"). Center keeps the
// kaleidoscope, generated fresh each time, never part of the record; the
// cone is the opposite kind of thing — a shape drawn from the same real
// history Your Arc's other pages already hold — so it belongs here, not
// bundled with a bought-again experience.
//
// 2026-09-12, at the user's own request — this used to crossfade between
// the full double-cone (TimeCone, an hourglass showing past+future
// together) and a flat ring (TimeConeRing, one side at a time), toggled
// by up/down arrows. The double-cone view is gone: ArcLinePage (Your
// Arc's very first/hub page) already shows the whole two-cone shape as
// its own ambient background, so repeating it here was the exact kind of
// redundancy RULES.md's "one reading, one screen" reasoning warns
// against elsewhere, just applied to a shape instead of a reading. This
// page now shows ONLY the past ring, permanently — no arrows, no
// facing-toggle, since there's nothing left to toggle between: the
// future ring's own points (usually just the one active wish) never had
// real per-point interaction anyway (handleConePointPress/
// handleConePointLongPress below were always past-only), so keeping past
// loses the least. Every reading, unranked, as a shape — tap or hold a
// point for what it was.
export function TimeConePage({ readingLog, allWishes, activeWish, locale }: TimeConePageProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const sharedStyles = useMemo(() => makeSharedArcPageStyles(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const timeConeGeometry = useTimeConeGeometry(readingLog, allWishes, activeWish);

  const [conePreview, setConePreview] = useState<{ date: string; label: string } | null>(null);
  const [selected, setSelected] = useState<ReadingLogEntry | null>(null);

  const handleConePointPress = (pointId: string) => {
    if (!pointId.startsWith('reading-')) return;
    const ts = Number(pointId.slice('reading-'.length));
    const entry = readingLog.find((e) => e.ts === ts);
    if (entry) setSelected(entry);
  };

  const handleConePointLongPress = (pointId: string) => {
    if (pointId.startsWith('reading-')) {
      const ts = Number(pointId.slice('reading-'.length));
      const entry = readingLog.find((e) => e.ts === ts);
      if (!entry) return;
      const level = VIBRATION_LEVELS.find((l) => l.slug === entry.levelSlug);
      setConePreview({
        date: formatDate(entry.ts),
        label: level ? getLocalizedLevelName(level, locale) : entry.levelSlug,
      });
      setTimeout(() => setConePreview(null), 4000);
    } else if (pointId.startsWith('wish-')) {
      const id = pointId.slice('wish-'.length);
      const wish = allWishes.find((w) => w.id === id);
      if (!wish) return;
      setConePreview({ date: formatDate(new Date(wish.savedAt).getTime()), label: t('yourArc.coneLegendWishLabel') });
      setTimeout(() => setConePreview(null), 4000);
    }
  };

  return (
    <ScrollView contentContainerStyle={sharedStyles.pageContent}>
      <Text style={styles.kicker}>{t('yourArc.coneKicker')}</Text>
      <Text style={styles.introLine}>{t('yourArc.coneIntroLine')}</Text>

      <View style={styles.timeConeWrap}>
        <TimeConeRing
          size={CONE_SIZE}
          points={timeConeGeometry.pastPoints}
          onPointPress={handleConePointPress}
          onPointLongPress={handleConePointLongPress}
        />
      </View>
      {conePreview && (
        <Text style={styles.conePreviewText}>
          {conePreview.date} — {conePreview.label}
        </Text>
      )}
      {selected && (
        <View style={styles.conePointSummary}>
          <Text style={sharedStyles.dateLabel}>{formatDate(selected.ts)}</Text>
          <Text style={[sharedStyles.headline, styles.conePointSummaryLevel]}>
            {VIBRATION_LEVELS.find((l) => l.slug === selected.levelSlug)
              ? getLocalizedLevelName(VIBRATION_LEVELS.find((l) => l.slug === selected.levelSlug)!, locale)
              : selected.levelSlug}
          </Text>
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
    // 2026-09-12 — height was CONE_SIZE*1.3 (sized for the old double-cone,
    // taller than it is wide); TimeConeRing is a plain size×size square, so
    // that extra height is now unclaimed dead space, not a real container
    // constraint — removed rather than centering a square inside a
    // rectangle that no longer describes anything on screen.
    timeConeWrap: {
      alignSelf: 'center',
      width: CONE_SIZE,
      marginTop: spacing[4],
      marginBottom: spacing[3],
    },
    conePreviewText: {
      color: colors.text.primary,
      fontFamily: fonts.medium,
      fontSize: fontSizes.sm,
      textAlign: 'center',
      marginTop: spacing[3],
    },
    conePointSummary: { alignItems: 'center', marginTop: spacing[4] },
    // Size/color come from sharedStyles.headline/dateLabel; this just adds
    // the page-specific capitalize transform + spacing.
    conePointSummaryLevel: {
      textTransform: 'capitalize',
      marginTop: spacing[1],
    },
  });
}
