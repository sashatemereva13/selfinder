import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../../../src/theme/useThemeColors';
import type { Colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, lineHeights } from '../../../../src/theme/typography';
import { spacing } from '../../../../src/theme/spacing';
import feelingLuckyListEn from '../../../../src/content/feelingLuckyList.json';
import feelingLuckyListRu from '../../../../src/content/feelingLuckyList.ru.json';
import { LongPressToSave } from '../../../../src/components/LongPressToSave';
import { track } from '../../../../src/utils/analytics';
import { usePhilosopherStore } from '../../../../src/store/philosopherStore';
import { useGuideChatStore } from '../../../../src/store/guideChatStore';
import { useEngagementStore } from '../../../../src/store/engagementStore';
import { useLocaleStore } from '../../../../src/store/localeStore';

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
    router.push('/(tabs)/guide');
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
    >
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Text style={styles.backLink}>{t('common.back')}</Text>
      </Pressable>

      {/* Long-press the message itself to save it (2026-08-20 — replaces
          the old visible Save/Share buttons app-wide, see
          LongPressToSave's own header comment). */}
      <LongPressToSave message={message} accentRgb={colors.accent.ivoryRgb}>
        <View style={styles.messageWrap}>
          <Text style={styles.message}>{message}</Text>
        </View>
      </LongPressToSave>

      {philosopher && (
        <Pressable style={styles.talkLinkWrap} onPress={handleTalkAboutIt}>
          <Text style={styles.talkLink}>{t('feelingLucky.talkAboutIt', { name: philosopher.name })}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { flexGrow: 1, padding: spacing[6], paddingBottom: spacing[12] },
  backRow: { paddingBottom: spacing[8] },
  backLink: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
  messageWrap: { flex: 1, justifyContent: 'center', paddingVertical: spacing[8] },
  talkLinkWrap: { alignItems: 'center', marginTop: spacing[6] },
  talkLink: {
    color: colors.text.secondary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    textAlign: 'center',
  },
  message: {
    color: colors.text.primary,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.loose,
    textAlign: 'center',
  },
  });
}
