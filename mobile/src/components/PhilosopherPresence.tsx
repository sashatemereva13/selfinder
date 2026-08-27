import { useMemo } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../theme/useThemeColors';
import type { Colors } from '../theme/colors';
import { fonts, fontSizes, letterSpacings } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { usePhilosopherStore } from '../store/philosopherStore';
import { useAppAccentRgb } from '../utils/appAccent';

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
      <View style={styles.nameRow}>
        <Text style={[styles.name, { color: accentColor }]}>{philosopher.name}</Text>
        {hasUnmetPhilosopher && <View style={[styles.badge, { backgroundColor: accentColor }]} />}
      </View>
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    row: { alignSelf: 'flex-start' },
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
