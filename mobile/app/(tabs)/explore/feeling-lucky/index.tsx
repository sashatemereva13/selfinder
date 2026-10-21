import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../../../src/theme/useThemeColors';
import type { Colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, lineHeights } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import feelingLuckyListEn from '../../../../src/content/feelingLuckyList.json';
import feelingLuckyListRu from '../../../../src/content/feelingLuckyList.ru.json';
import { LongPressToSave } from '../../../../src/components/shared/LongPressToSave';
import { track } from '../../../../src/utils/analytics';
import { usePhilosopherStore } from '../../../../src/store/philosopherStore';
import { useGuideChatStore } from '../../../../src/store/guideChatStore';
import { useEngagementStore } from '../../../../src/store/engagementStore';
import { useLocaleStore } from '../../../../src/store/localeStore';
import { BackLink } from '../../../../src/components/shared/BackLink';

// Drawn once per visit, deliberately — no reroll button. The whole idea is
// that whichever message shows up is the one meant to find you right now;
// letting people fish for a better one would undo that. Picked by index
// (not independently randomized per list) so the same random draw lands on
// the same underlying message in either language, in case that ever
// matters (e.g. analytics correlating which message id was shown).
function pickMessage(locale: 'en' | 'ru'): string {
  const list = locale === 'ru' ? feelingLuckyListRu : feelingLuckyListEn;
  const entry = list[Math.floor(Math.random() * list.length)];
  return entry.message;
}

export default function FeelingLuckyScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [message] = useState(() => pickMessage(locale));
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const sendGuideMessage = useGuideChatStore((s) => s.send);
  const recordTalkAboutIt = useEngagementStore((s) => s.recordTalkAboutIt);

  useEffect(() => {
    track('feeling_lucky_viewed');
  }, []);

  const handleTalkAboutIt = () => {
    if (!philosopher) return;
    track('feeling_lucky_talk_about_it');
    recordTalkAboutIt();
    sendGuideMessage(philosopher, t('feelingLucky.talkAboutItMessage', { message }));
    router.push('/guide');
  };

  // The message sits in the middle of the screen and scrolls if it's
  // long; the way to talk about it stays just above the minimap
  // (2026-10-08 — the message used to sit high with the link right under
  // it, leaving the rest of the screen empty).
  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[4] }]}>
      <BackLink style={styles.backRow} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <LongPressToSave message={message} accentRgb={colors.accent.ivoryRgb}>
          <Text style={styles.message}>{message}</Text>
        </LongPressToSave>
        <Text style={styles.saveHint}>{t('feelingLucky.saveHint')}</Text>
      </ScrollView>

      {philosopher && (
        <Pressable
          style={({ pressed }) => [styles.talkButton, pressed && styles.pressed]}
          onPress={handleTalkAboutIt}
          accessibilityRole="button"
        >
          <Text style={styles.talkText}>{t('feelingLucky.talkAboutIt', { name: philosopher.name })}</Text>
        </Pressable>
      )}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base, paddingHorizontal: spacing[6], paddingBottom: spacing[4] },
  backRow: { alignSelf: 'flex-start' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing[8] },
  message: {
    color: colors.text.primary,
    fontFamily: fonts.voice,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.loose,
    textAlign: 'center',
  },
  saveHint: {
    color: colors.text.faint,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginTop: spacing[6],
  },
  talkButton: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  pressed: { opacity: 0.6 },
  talkText: { color: colors.text.primary, fontFamily: fonts.medium, fontSize: fontSizes.sm },
  });
}
