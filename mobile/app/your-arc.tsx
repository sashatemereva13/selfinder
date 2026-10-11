import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/theme/useThemeColors';
import type { Colors } from '../src/theme/colors';
import { fonts, fontSizes } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { GatherIn } from '../src/components/shared/GatherIn';
import { ArcLinePage } from '../src/components/yourArc/pages/ArcLinePage';
import { ArcDial } from '../src/components/yourArc/ArcDial';
import type { TimeConePoint } from '../src/components/yourArc/TimeCone';
import { useMeasureStore } from '../src/store/measureStore';
import { useShiftStore } from '../src/store/shiftStore';
import { useAuthStore } from '../src/store/authStore';
import { useEngagementStore } from '../src/store/engagementStore';
import { useLocaleStore } from '../src/store/localeStore';
import { VIBRATION_LEVELS, getLocalizedLevelName, useLevelColors, useLevelTextColors } from '../src/content/measureConfig';
import { formatDate } from '../src/utils/relativeTime';
import { useAppAccentRgb } from '../src/utils/appAccent';
import { track } from '../src/utils/analytics';

// Your Arc (2026-10-09 — docs/your-arc-concept.md). The light cone stays
// as the way in — now is shaped by how you understand your past and what
// you're reaching toward — but it holds the person's own record on
// arrival: every reading, and every Shift session, as a point in its
// state's colour, nearer the vertex the more recent. The dial below moves
// through time on this one screen: down into the past, through now (and,
// once intentions are built, up into the future). Whatever it's on is
// named under the cone and opens on tap.
//
// Until the rest of the concept is built, the future ellipse still opens
// the old future pages, and the old past pages stay one quiet link away
// (so nothing that was reachable — Journey results among them — is lost
// meanwhile).

type Stop = {
  id: string;
  ts: number;
  kind: 'reading' | 'shift' | 'now';
  slug?: string;
  toSlug?: string;
};

const hashAngle = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 1000;
  return hash / 1000;
};
// Nothing sits right on the vertex — that's now.
const MIN_DEPTH = 0.12;

export default function YourArcRoute() {
  const colors = useThemeColors();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // One frame of plain dark ground while the heavy page mounts, then the
  // page gathers in (see YourArcScreen).
  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.bg.base }} />;
  }
  return <YourArcScreen />;
}

function YourArcScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locale = useLocaleStore((s) => s.locale);
  const levelColors = useLevelColors();
  const levelTextColors = useLevelTextColors();
  const accentRgb = useAppAccentRgb();
  const readingLog = useMeasureStore((s) => s.readingLog);
  const currentResult = useMeasureStore((s) => s.currentResult);
  const sessions = useShiftStore((s) => s.sessions);
  const hydrateShifts = useShiftStore((s) => s.hydrate);
  const session = useAuthStore((s) => s.session);
  const coneSeen = useEngagementStore((s) => s.discovered.arcCone);
  const markDiscovered = useEngagementStore((s) => s.markDiscovered);
  // Snapshotted so the first-visit line doesn't vanish the moment it's
  // marked seen.
  const showIntro = useRef(!coneSeen).current;
  // The cone fits the space left above the moment's name and the dial.
  const [coneAreaHeight, setConeAreaHeight] = useState(0);

  useEffect(() => {
    hydrateShifts();
    if (!coneSeen) markDiscovered('arcCone');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Oldest first, then now — the order the dial turns through.
  const stops: Stop[] = useMemo(() => {
    const past: Stop[] = [
      ...readingLog.map((e) => ({ id: `reading-${e.ts}`, ts: e.ts, kind: 'reading' as const, slug: e.levelSlug })),
      ...sessions.map((s) => ({
        id: `shift-${s.at}`,
        ts: new Date(s.at).getTime(),
        kind: 'shift' as const,
        slug: s.fromSlug,
        toSlug: s.toSlug,
      })),
    ].sort((a, b) => a.ts - b.ts);
    return [...past, { id: 'now', ts: Date.now(), kind: 'now' }];
  }, [readingLog, sessions]);

  const [index, setIndex] = useState(stops.length - 1);
  // Lands on now whenever the record changes (a new reading or session).
  useEffect(() => setIndex(stops.length - 1), [stops.length]);
  const focused = stops[Math.min(index, stops.length - 1)];

  const pastPoints: TimeConePoint[] = useMemo(() => {
    const now = Date.now();
    const pastStops = stops.filter((s) => s.kind !== 'now');
    const oldest = pastStops.length ? pastStops[0].ts : now;
    const span = Math.max(now - oldest, 1);
    return pastStops.map((s) => ({
      id: s.id,
      depth: MIN_DEPTH + (1 - MIN_DEPTH) * Math.min(1, (now - s.ts) / span),
      angle: hashAngle(s.id),
      colorRgb: levelColors[s.kind === 'shift' ? s.toSlug! : s.slug!],
    }));
  }, [stops, levelColors]);

  const nameOf = (slug?: string) => {
    const level = VIBRATION_LEVELS.find((l) => l.slug === slug);
    if (!level) return slug ?? '';
    const name = getLocalizedLevelName(level, locale);
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  const shortDate = (ts: number) => formatDate(new Date(ts).toISOString(), locale);

  const nowSlug = currentResult?.vibrationLevel.slug;
  const focusSlug = focused.kind === 'now' ? nowSlug : focused.kind === 'shift' ? focused.toSlug : focused.slug;
  const focusTextColor = focusSlug ? `rgb(${levelTextColors[focusSlug]})` : colors.text.primary;

  const openFocused = () => {
    track('your_arc_moment_opened', { kind: focused.kind });
    if (focused.kind === 'now') {
      router.navigate('/(tabs)/depths');
    } else if (focused.kind === 'shift') {
      router.push({ pathname: '/your-arc-moment', params: { shift: String(focused.ts) } });
    } else {
      router.push({ pathname: '/your-arc-moment', params: { ts: String(focused.ts) } });
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[4] }]}>
      <View style={styles.coneArea} onLayout={(e) => setConeAreaHeight(e.nativeEvent.layout.height)}>
      {coneAreaHeight > 0 && (
      <GatherIn style={styles.coneArea} delay={60}>
        <ArcLinePage
          availableHeight={coneAreaHeight}
          onJumpToPresent={() => router.navigate('/(tabs)/depths')}
          onJumpToPast={() => router.push('/your-arc-past')}
          onJumpToFuture={() => router.push('/your-arc-future')}
          pastPoints={pastPoints}
          focusedId={focused.id}
          focusRgb={nowSlug ? levelColors[nowSlug] : accentRgb}
          pastAndPresentTappable={false}
        />
      </GatherIn>
      )}
      </View>

      <View style={styles.below}>
        {showIntro && <Text style={styles.intro}>{t('yourArc.coneIntro')}</Text>}

        {/* What the dial is on — named, and opened on tap. */}
        <Pressable onPress={openFocused} accessibilityRole="button" style={styles.focus}>
          <Text style={styles.focusWhen}>
            {focused.kind === 'now' ? t('yourArc.now') : shortDate(focused.ts)}
          </Text>
          <Text style={[styles.focusName, { color: focusTextColor }]}>
            {focused.kind === 'shift'
              ? `${nameOf(focused.slug)} → ${nameOf(focused.toSlug)}`
              : focused.kind === 'now'
                ? nowSlug
                  ? nameOf(nowSlug)
                  : t('yourArc.nowNoReading')
                : nameOf(focused.slug)}
          </Text>
          <Text style={styles.focusAction}>
            {focused.kind === 'now' ? t('yourArc.openToday') : t('yourArc.openMoment')} →
          </Text>
        </Pressable>

        {stops.length > 1 && (
          // Only the top of the wheel shows (2026-10-09 — the whole wheel
          // took more room than the cone could spare): the pointer and
          // the moments either side of it, the rest turning out of view
          // below, like the Camera app's zoom wheel.
          <View style={styles.dialWindow}>
          <ArcDial
            total={stops.length}
            activeIndex={Math.min(index, stops.length - 1)}
            // The moment is named above the dial, larger — the dial's own
            // label line would repeat it.
            pageLabels={stops.map(() => undefined)}
            onRequestIndex={setIndex}
          />
          </View>
        )}

        {!session && (
          <Pressable onPress={() => router.push('/profile')} accessibilityRole="link">
            <Text style={styles.quiet}>{t('yourArc.signInToKeep')}</Text>
          </Pressable>
        )}
        {/* Temporary, until the past is rebuilt (docs/your-arc-concept.md
            §8, steps 5–6) — keeps the old past pages, Journey results
            among them, reachable. */}
        {session && (
          <Pressable onPress={() => router.push('/your-arc-past')} accessibilityRole="link">
            <Text style={styles.quiet}>{t('yourArc.pageByPage')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg.base },
    coneArea: { flex: 1 },
    below: { alignItems: 'center', paddingHorizontal: spacing[6], paddingBottom: spacing[4], gap: spacing[3] },
    intro: {
      color: colors.text.secondary,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      lineHeight: fontSizes.xs * 1.5,
      textAlign: 'center',
    },
    focus: { alignItems: 'center', gap: 2 },
    focusWhen: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs },
    focusName: { fontFamily: fonts.medium, fontSize: fontSizes.lg },
    focusAction: { color: colors.text.secondary, fontFamily: fonts.medium, fontSize: fontSizes.xs, marginTop: spacing[1] },
    dialWindow: { height: 58, overflow: 'hidden', alignSelf: 'stretch', alignItems: 'center' },
    quiet: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
  });
}
