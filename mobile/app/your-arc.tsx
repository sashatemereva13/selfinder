import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/theme/useThemeColors';
import type { Colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';
import { GatherIn } from '../src/components/shared/GatherIn';
import { ArcLinePage } from '../src/components/yourArc/pages/ArcLinePage';
import type { TimeConePoint } from '../src/components/yourArc/TimeCone';
import { useMeasureStore } from '../src/store/measureStore';
import { useShiftStore } from '../src/store/shiftStore';
import { VIBRATION_LEVELS, useLevelColors } from '../src/content/measureConfig';
import { useAppAccentRgb } from '../src/utils/appAccent';
import { track } from '../src/utils/analytics';

// Your Arc's entry (2026-10-21 — docs/your-arc-concept.md §3): only the
// cone, about time itself — the past narrows into now, the future opens
// out of it. Her own points are drawn in it, not tappable: distance from
// now is time, the angle around the cone is the state (each rim is the
// seventeen-state ring seen in perspective), so a state she keeps
// returning to draws a trail. The three parts are the doors: the past
// opens every moment (your-arc-past), now opens Today, the future opens
// what she's reaching toward (your-arc-future).

const hash = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000;
  return h / 1000;
};
// The state's own place on the ring, nudged a little either side so two
// moments of the same state don't sit exactly on top of each other.
const angleFor = (slug: string, id: string) => {
  const index = Math.max(0, VIBRATION_LEVELS.findIndex((l) => l.slug === slug));
  return (index + (hash(id) - 0.5) * 0.5) / VIBRATION_LEVELS.length;
};
// Nothing sits right on the vertex — that's now.
const MIN_DEPTH = 0.12;
// Distance from now is real time on one fixed scale (2026-10-12): today
// sits close to the vertex, a point reaches the rim at about three months,
// and the scale is logarithmic so recent weeks keep their room.
const RIM_DAYS = 90;
const depthFor = (ts: number, now: number) => {
  const days = Math.max(0, (now - ts) / 86_400_000);
  return MIN_DEPTH + (1 - MIN_DEPTH) * Math.min(1, Math.log1p(days) / Math.log1p(RIM_DAYS));
};

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
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const levelColors = useLevelColors();
  const accentRgb = useAppAccentRgb();
  const readingLog = useMeasureStore((s) => s.readingLog);
  const currentResult = useMeasureStore((s) => s.currentResult);
  const sessions = useShiftStore((s) => s.sessions);
  const hydrateShifts = useShiftStore((s) => s.hydrate);
  // The cone fits the space it has.
  const [coneAreaHeight, setConeAreaHeight] = useState(0);

  useEffect(() => {
    hydrateShifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pastPoints: TimeConePoint[] = useMemo(() => {
    const now = Date.now();
    return [
      ...readingLog.map((e) => ({ id: `reading-${e.ts}`, ts: e.ts, slug: e.levelSlug })),
      // A Shift session sits where it arrived.
      ...sessions.map((s) => ({ id: `shift-${s.at}`, ts: new Date(s.at).getTime(), slug: s.toSlug })),
    ].map((p) => ({
      id: p.id,
      depth: depthFor(p.ts, now),
      angle: angleFor(p.slug, p.id),
      colorRgb: levelColors[p.slug],
    }));
  }, [readingLog, sessions, levelColors]);

  const nowSlug = currentResult?.vibrationLevel.slug;
  const open = (part: 'past' | 'now' | 'future') => {
    track('your_arc_part_opened', { part });
    if (part === 'now') router.navigate('/(tabs)/depths');
    else router.push(part === 'past' ? '/your-arc-past' : '/your-arc-future');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[4], paddingBottom: spacing[4] }]}>
      <View style={styles.coneArea} onLayout={(e) => setConeAreaHeight(e.nativeEvent.layout.height)}>
        {coneAreaHeight > 0 && (
          <GatherIn style={styles.coneArea} delay={60}>
            <ArcLinePage
              availableHeight={coneAreaHeight}
              onJumpToPresent={() => open('now')}
              onJumpToPast={() => open('past')}
              onJumpToFuture={() => open('future')}
              pastPoints={pastPoints}
              focusRgb={nowSlug ? levelColors[nowSlug] : accentRgb}
            />
          </GatherIn>
        )}
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg.base },
    coneArea: { flex: 1 },
  });
}
