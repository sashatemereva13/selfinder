import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useThemeColors } from '../../../src/theme/useThemeColors';
import { useThemeStore } from '../../../src/store/themeStore';
import type { Colors } from '../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { GatherIn } from '../../../src/components/shared/GatherIn';
import { AmbientGlow } from '../../../src/components/shared/AmbientGlow';
import { usePhilosopherStep } from '../../../src/utils/usePhilosopherStep';
import { useAuthStore } from '../../../src/store/authStore';
import { useAppAccentTextRgb } from '../../../src/utils/appAccent';

// Explore (2026-10-09 — RULES.md, "Three places, one chain"): every
// experience someone visits on their own, outside Today's chain. Grouped
// by what they need right now, each group named with a verb — choosing a
// need first, then one of two or three places, is easier than one choice
// among eleven. The three small "signs" share one line: each is a moment,
// not a place to stay. The Journeys are one row here, with their own
// screen (journeys.tsx).
type Room = { key: string; route: string };
const GROUPS: { key: string; rooms: Room[] }[] = [
  {
    key: 'settle',
    rooms: [
      { key: 'breathe', route: '/(tabs)/explore/breathing' },
      { key: 'tunein', route: '/(tabs)/explore/tunein' },
    ],
  },
  {
    key: 'say',
    rooms: [
      // Opened through the step's openConversation, so today's reading
      // joins the conversation the same way as anywhere else.
      { key: 'talk', route: '/guide' },
      { key: 'spill', route: '/(tabs)/explore/spill' },
    ],
  },
  {
    key: 'understand',
    rooms: [
      { key: 'levels', route: '/(tabs)/explore/levels' },
      { key: 'journeys', route: '/(tabs)/explore/journeys' },
    ],
  },
];
const SIGNS: Room[] = [
  { key: 'message', route: '/(tabs)/explore/feeling-lucky' },
  { key: 'symbol', route: '/(tabs)/explore/cards' },
  { key: 'moon', route: '/(tabs)/explore/moon' },
  // Center, the kaleidoscope — a new pattern from your history each time
  // (moved from Your Arc 2026-10-09, docs/your-arc-concept.md §6).
  { key: 'pattern', route: '/center' },
];

export default function ExploreScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const step = usePhilosopherStep();
  const session = useAuthStore((s) => s.session);
  const accentTextRgb = useAppAccentTextRgb();
  const accent = `rgb(${accentTextRgb})`;
  const philosopherName = step.philosopher?.nameInstrumental ?? step.philosopher?.name ?? '';

  const open = (room: Room) => (room.key === 'talk' ? step.openConversation() : router.push(room.route as never));

  return (
    <View style={styles.root}>
      {theme === 'dark' && <AmbientGlow />}
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}>
        <GatherIn>
          <Text style={styles.title} accessibilityRole="header">{t('explore.title')}</Text>

          {/* You — the account and settings, first and unmistakable, the
              way iOS Settings opens with your own account. A different
              kind of thing from the experiences below, so it looks
              different: a ring with your initial, your name. Signed out,
              it says what signing in is for. */}
          <Pressable
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel={session ? session.username : t('explore.signIn')}
            style={({ pressed }) => [styles.you, pressed && styles.pressed]}
          >
            <View style={styles.youRing}>
              <Svg width={44} height={44} style={StyleSheet.absoluteFill}>
                <Circle
                  cx={22}
                  cy={22}
                  r={21}
                  fill="none"
                  stroke={accent}
                  strokeWidth={1.2}
                  strokeDasharray={session ? undefined : '2 4'}
                />
              </Svg>
              {session ? (
                <Text style={[styles.youInitial, { color: accent }]}>{session.username.charAt(0).toUpperCase()}</Text>
              ) : (
                <View style={[styles.youDot, { backgroundColor: accent }]} />
              )}
            </View>
            <View style={styles.youText}>
              <Text style={styles.label} numberOfLines={1}>{session ? session.username : t('explore.signIn')}</Text>
              <Text style={styles.description}>
                {session ? t('explore.youDescription') : t('explore.signInDescription')}
              </Text>
            </View>
            <Text style={[styles.label, { color: accent }]}>→</Text>
          </Pressable>
        </GatherIn>

        {GROUPS.map((group, i) => (
          <GatherIn key={group.key} delay={120 + i * 120}>
            <View style={styles.group}>
              <Text style={styles.groupLabel}>{t(`explore.group_${group.key}`)}</Text>
              {group.rooms.map((room) => (
                <Pressable
                  key={room.key}
                  onPress={() => open(room)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.room, pressed && styles.pressed]}
                >
                  <Text style={styles.label}>{t(`explore.${room.key}Label`, { name: philosopherName })}</Text>
                  <Text style={styles.description}>{t(`explore.${room.key}Description`)}</Text>
                </Pressable>
              ))}
            </View>
          </GatherIn>
        ))}

        <GatherIn delay={120 + GROUPS.length * 120}>
          <View style={styles.group}>
            <Text style={styles.groupLabel}>{t('explore.group_receive')}</Text>
            {/* Two rows of two (2026-10-12) — one wrapping line put a
                separator dot at the start of its second line. */}
            {[SIGNS.slice(0, 2), SIGNS.slice(2, 4)].map((row, r) => (
              <View key={r} style={styles.signs}>
                {row.map((room, i) => (
                  <View key={room.key} style={styles.signWrap}>
                    {i > 0 && <Text style={styles.signDot}>·</Text>}
                    <Pressable onPress={() => open(room)} accessibilityRole="button" hitSlop={spacing[2]}>
                      {({ pressed }) => (
                        <Text style={[styles.label, pressed && styles.pressed]}>{t(`explore.${room.key}Label`)}</Text>
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </GatherIn>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg.base },
    content: { paddingHorizontal: spacing[6], paddingBottom: spacing[12] },
    title: {
      color: colors.text.primary,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xl,
      lineHeight: fontSizes.xl * lineHeights.tight,
    },
    you: { flexDirection: 'row', alignItems: 'center', gap: spacing[4], marginTop: spacing[6] },
    youRing: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    youInitial: { fontFamily: fonts.medium, fontSize: fontSizes.base },
    youDot: { width: 5, height: 5, borderRadius: 2.5 },
    youText: { flex: 1, gap: 2 },
    group: { marginTop: spacing[10], gap: spacing[4] },
    groupLabel: {
      color: colors.text.faint,
      fontFamily: fonts.medium,
      fontSize: 10,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
    },
    room: { gap: 2 },
    pressed: { opacity: 0.6 },
    label: { color: colors.text.primary, fontFamily: fonts.medium, fontSize: fontSizes.base },
    description: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs },
    signs: { flexDirection: 'row', alignItems: 'center' },
    signWrap: { flexDirection: 'row', alignItems: 'center' },
    signDot: { color: colors.text.faint, fontFamily: fonts.medium, fontSize: fontSizes.base, marginHorizontal: spacing[3] },
  });
}
