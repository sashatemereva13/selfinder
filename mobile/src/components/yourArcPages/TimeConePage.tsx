import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { ReadingLogEntry } from '../../store/measureStore';
import { SavedWish } from '../../api/wish';
import { TimeCone } from '../TimeCone';
import { TimeConeRing } from '../TimeConeRing';
import { CrossfadeSwitcher } from '../CrossfadeSwitcher';
import { useTimeConeGeometry } from '../../utils/useTimeConeGeometry';
import { getLocalizedLevelName, VIBRATION_LEVELS } from '../../content/measureConfig';
import { Locale } from '../../store/localeStore';
import { makeSharedArcPageStyles } from './arcPageShared';

interface TimeConePageProps {
  readingLog: ReadingLogEntry[];
  allWishes: SavedWish[];
  activeWish: SavedWish | null;
  locale: Locale;
}

const CONE_SIZE = 260;

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// The light cone — split out of Center 2026-08-29 (it used to live only
// there, alongside the kaleidoscope) and given a real home of its own on
// Your Arc, matching what useTimeConeGeometry.ts's own header comment
// already anticipated ("so both Your Arc... and Center... can compute it
// without duplicating the geometry logic"). Center keeps the
// kaleidoscope, generated fresh each time, never part of the record; the
// cone is the opposite kind of thing — a shape drawn from the same real
// history Your Arc's other pages already hold — so it belongs here, not
// bundled with a bought-again experience. Every reading, unranked, as a
// shape (the past cone), plus the one real, stated active wish reaching
// forward (the future cone, never a forecast — see RULES.md's "no
// fabricated trajectory" rule).
export function TimeConePage({ readingLog, allWishes, activeWish, locale }: TimeConePageProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const sharedStyles = useMemo(() => makeSharedArcPageStyles(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const timeConeGeometry = useTimeConeGeometry(readingLog, allWishes, activeWish);

  const [conePreview, setConePreview] = useState<{ date: string; label: string } | null>(null);
  const [coneFacing, setConeFacing] = useState<'past' | 'future' | null>(null);
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
        <CrossfadeSwitcher
          showSecond={coneFacing !== null}
          first={
            <TimeCone
              width={CONE_SIZE}
              height={CONE_SIZE * 1.3}
              pastPoints={timeConeGeometry.pastPoints}
              futurePoints={timeConeGeometry.futurePoints}
            />
          }
          second={
            <TimeConeRing
              size={CONE_SIZE}
              points={coneFacing === 'future' ? timeConeGeometry.futurePoints : timeConeGeometry.pastPoints}
              onPointPress={coneFacing === 'past' ? handleConePointPress : undefined}
              onPointLongPress={coneFacing === 'past' ? handleConePointLongPress : undefined}
            />
          }
        />
        <View style={styles.coneArrowLayer} pointerEvents="box-none">
          {timeConeGeometry.futurePoints.length > 0 && (
            <Pressable
              hitSlop={16}
              style={styles.coneArrowUp}
              onPress={() => setConeFacing(coneFacing === 'future' ? null : 'future')}
            >
              <Text style={[styles.coneArrow, coneFacing === 'future' && styles.coneArrowActive]}>↑</Text>
            </Pressable>
          )}
          {timeConeGeometry.pastPoints.length > 0 && (
            <Pressable
              hitSlop={16}
              style={styles.coneArrowDown}
              onPress={() => setConeFacing(coneFacing === 'past' ? null : 'past')}
            >
              <Text style={[styles.coneArrow, coneFacing === 'past' && styles.coneArrowActive]}>↓</Text>
            </Pressable>
          )}
        </View>
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
    timeConeWrap: {
      alignSelf: 'center',
      width: CONE_SIZE,
      marginTop: spacing[4],
      marginBottom: spacing[3],
      height: CONE_SIZE * 1.3,
      justifyContent: 'center',
      position: 'relative',
    },
    coneArrowLayer: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center' },
    coneArrowUp: { position: 'absolute', top: CONE_SIZE * 0.65 - 18 },
    coneArrowDown: { position: 'absolute', top: CONE_SIZE * 0.65 + 18 },
    coneArrow: { color: colors.text.muted, fontSize: fontSizes.lg },
    coneArrowActive: { color: colors.text.primary },
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
