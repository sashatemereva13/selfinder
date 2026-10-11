import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InteractionManager, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/theme/useThemeColors';
import type { Colors } from '../src/theme/colors';
import { fonts, fontSizes } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { useMeasureStore } from '../src/store/measureStore';
import { useShiftStore } from '../src/store/shiftStore';
import { useAuthStore } from '../src/store/authStore';
import { useLocaleStore } from '../src/store/localeStore';
import { getMe, getMeasureHistory } from '../src/api/user';
import { getConversationForMeasureResult, SavedConversation } from '../src/api/conversation';
import { listMySpillEntries, SavedSpillEntry } from '../src/api/spill';
import type { SavedMeasureResult } from '../src/types';
import { VIBRATION_LEVELS, getLocalizedLevelName, useLevelTextColors } from '../src/content/measureConfig';
import { formatDate } from '../src/utils/relativeTime';
import { AmbientGlow } from '../src/components/shared/AmbientGlow';
import { BackLink } from '../src/components/shared/BackLink';
import { DetailPage } from '../src/components/yourArc/pages/DetailPage';

// One moment from Your Arc, opened from the cone (2026-10-09 —
// docs/your-arc-concept.md §3). A reading opens the same detail the old
// past pages showed — what was said, the reflection, the conversation and
// any writing kept close to it (DetailPage); a Shift session shows where
// it started, where the person placed themselves after, and what they
// chose to write. A record, never an interpretation.

// Spill has no reading link — kept writing counts as "from this moment"
// only if it's close in time (same window as the old past pages).
const SPILL_MATCH_WINDOW_MS = 30 * 60 * 1000;

export default function YourArcMomentScreen() {
  const { ts, shift } = useLocalSearchParams<{ ts?: string; shift?: string }>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[4] }]}>
      <AmbientGlow />
      <BackLink style={styles.backRow} />
      {shift ? <ShiftMoment at={Number(shift)} /> : <ReadingMoment ts={Number(ts)} />}
    </View>
  );
}

function ReadingMoment({ ts }: { ts: number }) {
  const readingLog = useMeasureStore((s) => s.readingLog);
  const session = useAuthStore((s) => s.session);
  const locale = useLocaleStore((s) => s.locale);
  const selected = readingLog.find((e) => e.ts === ts);
  const [richHistory, setRichHistory] = useState<SavedMeasureResult[] | null>(null);
  const [spillEntries, setSpillEntries] = useState<SavedSpillEntry[] | null>(null);
  const [conversation, setConversation] = useState<SavedConversation | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        const [profile, history, entries] = await Promise.all([
          getMe(session.token),
          getMeasureHistory(session.token),
          listMySpillEntries(session.token),
        ]);
        if (cancelled || !profile.consent?.psychologicalData?.given) return;
        setRichHistory(history);
        setSpillEntries(entries);
      } catch {
        // Best-effort — the date and level still show without it.
      }
    });
    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [session]);

  const selectedRich = richHistory?.find((r) => Math.abs(new Date(r.savedAt).getTime() - ts) < 60_000);

  useEffect(() => {
    if (!selectedRich?.id || !session) return;
    let cancelled = false;
    setLoadingConversation(true);
    getConversationForMeasureResult(selectedRich.id, session.token).then((c) => {
      if (!cancelled) {
        setConversation(c);
        setLoadingConversation(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedRich?.id, session]);

  if (!selected) return null;
  const linkedSpillEntry = spillEntries?.find(
    (e) => Math.abs(new Date(e.savedAt).getTime() - ts) < SPILL_MATCH_WINDOW_MS,
  );

  return (
    <DetailPage
      selected={selected}
      selectedRich={selectedRich}
      linkedConversation={conversation}
      loadingConversation={loadingConversation}
      linkedSpillEntry={linkedSpillEntry}
      hasSession={!!session}
      hasRichHistory={!!richHistory}
      locale={locale}
    />
  );
}

function ShiftMoment({ at }: { at: number }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = useLocaleStore((s) => s.locale);
  const levelTextColors = useLevelTextColors();
  const sessions = useShiftStore((s) => s.sessions);
  const hydrate = useShiftStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const found = sessions.find((s) => new Date(s.at).getTime() === at);
  if (!found) return null;

  const nameOf = (slug: string) => {
    const level = VIBRATION_LEVELS.find((l) => l.slug === slug);
    const name = level ? getLocalizedLevelName(level, locale) : slug;
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  const words: { label: string; text?: string }[] = [
    { label: t('yourArc.momentGratitude'), text: found.words.gratitude },
    { label: t('yourArc.momentAct'), text: found.words.act },
    { label: t('yourArc.momentWhere'), text: found.words.where },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.when}>{formatDate(found.at, locale)}</Text>
      <Text style={styles.door}>{found.door === 'love' ? t('yourArc.momentShifted') : t('yourArc.momentUsed')}</Text>
      <View style={styles.fromTo}>
        <Text style={[styles.level, { color: `rgb(${levelTextColors[found.fromSlug]})` }]}>{nameOf(found.fromSlug)}</Text>
        <Text style={styles.arrow}>→</Text>
        <Text style={[styles.level, { color: `rgb(${levelTextColors[found.toSlug]})` }]}>{nameOf(found.toSlug)}</Text>
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

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg.base },
    backRow: { alignSelf: 'flex-start', paddingHorizontal: spacing[6] },
    content: { padding: spacing[6], gap: spacing[2] },
    when: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs },
    door: { color: colors.text.secondary, fontFamily: fonts.voice, fontSize: fontSizes.base },
    fromTo: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginTop: spacing[2] },
    level: { fontFamily: fonts.medium, fontSize: fontSizes.xl },
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
