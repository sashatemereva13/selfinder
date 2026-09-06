import { useMemo } from 'react';
import { Dimensions, Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../theme/useThemeColors';
import type { Colors } from '../theme/colors';
import { fonts, fontSizes, letterSpacings } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { usePhilosopherStore } from '../store/philosopherStore';
import { useAppAccentRgb } from '../utils/appAccent';
import { PhilosopherEnergy } from './PhilosopherEnergy';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Guide's real entry point now that it's off the bottom tab bar (see
// docs/app-architecture-concept.md, "What Guide's demotion actually
// means") — a persistent, quiet philosopher-presence affordance on Depths.
// Always tappable, always routes to /guide, no reading required. Reuses
// the badge visual language the old Guide tab icon carried
// (empty-string dot, filled with the accent color) for the same
// first-meeting signal, just relocated from the tab bar to here.
export function PhilosopherPresence() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const metPhilosopherIds = usePhilosopherStore((s) => s.metPhilosopherIds);
  const accentRgb = useAppAccentRgb();
  const accentColor = `rgb(${accentRgb})`;

  if (!philosopher) return null;
  const hasUnmetPhilosopher = !metPhilosopherIds.includes(philosopher.id);

  return (
    <Pressable style={styles.row} onPress={() => router.push('/guide')}>
      {/* Top energy spirals — commented out for now (2026-08-30), pending
          further review; keep PhilosopherEnergy/the wiring intact so
          this is a one-line restore, not a rebuild. */}
      {/* <View style={styles.energyWrap} pointerEvents="none">
        <PhilosopherEnergy seed={philosopher.id} width={SCREEN_WIDTH} height={38} color={accentColor} spiralCount={9} />
      </View> */}
      <View style={styles.nameRow}>
        <Text style={[styles.name, { color: accentColor }]}>{philosopher.name}</Text>
        {hasUnmetPhilosopher && <View style={[styles.badge, { backgroundColor: accentColor }]} />}
      </View>
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    row: { alignSelf: 'flex-start', position: 'relative' },
    // The lines' own SVG draws upward/outward from (0,0) via negative-y
    // path starts and overflow:visible (see PhilosopherEnergy) — so this
    // wrap's bottom edge, not its center, is what should land at the
    // name's own top. Spans the FULL screen width (not just the name's
    // own narrow bounds), centered on the screen rather than on the name
    // — the spirals read as an ambient field across the top of the whole
    // page, arriving generally toward the philosopher, not literally
    // funneling into the name's exact x-position. left is offset by
    // negative half the screen width from row's own left edge (row sits
    // at the padded content's left edge, not the screen's), so the field
    // is centered on the DEVICE, independent of row's own position.
    energyWrap: {
      position: 'absolute',
      left: -spacing[6],
      bottom: '100%',
      width: SCREEN_WIDTH,
    },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
    name: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
    },
    badge: { width: 6, height: 6, borderRadius: 3 },
  });
}
