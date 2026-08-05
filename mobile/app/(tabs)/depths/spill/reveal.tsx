import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { usePhilosopherStore } from '../../../../src/store/philosopherStore';
import { useSpillStore } from '../../../../src/store/spillStore';
import { useGuideChatStore } from '../../../../src/store/guideChatStore';
import { useAppAccentRgb } from '../../../../src/utils/appAccent';
import { useReadingColumnWidth } from '../../../../src/theme/responsive';

export default function SpillRevealScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const text = useSpillStore((s) => s.text);
  const reset = useSpillStore((s) => s.reset);
  const send = useGuideChatStore((s) => s.send);
  const accentRgb = useAppAccentRgb();
  const accentColor = `rgb(${accentRgb})`;
  const columnWidth = useReadingColumnWidth();

  useEffect(() => {
    if (!text) router.replace('/(tabs)/depths/spill');
  }, [text]);

  if (!text) return null;

  const handleWriteAgain = () => {
    reset();
    router.replace('/(tabs)/depths/spill');
  };

  const handleTalkToPhilosopher = () => {
    if (!philosopher) return;
    send(
      philosopher,
      `Here's something I just wrote without thinking about it, without looking back at what I'd already written:\n\n"${text}"\n\nWhat do you notice?`
    );
    router.push('/(tabs)/guide');
  };

  // Spill's whole premise is "never judged" — a screen that only offers
  // "talk about it" or "write again" quietly pressures a follow-up action
  // just to leave, which contradicts that. Writing it out and being done can
  // be the whole point; this is the neutral third way out. Clears the text
  // (nothing here persists past this screen by design — see spillStore) and
  // returns to Depths, the same "back to home" destination every other
  // finished flow in the app lands on.
  const handleDone = () => {
    reset();
    router.replace('/(tabs)/depths');
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing[6], width: columnWidth, alignSelf: 'center' },
      ]}
    >
      <Text style={styles.kicker}>{t('spillReveal.whatCameOut')}</Text>
      <Text style={styles.text}>{text}</Text>

      <View style={styles.actions}>
        {philosopher && (
          <Pressable
            style={[styles.button, { backgroundColor: accentColor }]}
            onPress={handleTalkToPhilosopher}
          >
            <Text style={styles.buttonText}>{t('spillReveal.talkToAboutThis', { name: philosopher.name })}</Text>
          </Pressable>
        )}
        <Pressable style={styles.secondaryButton} onPress={handleWriteAgain}>
          <Text style={styles.secondaryButtonText}>{t('spillReveal.writeAgain')}</Text>
        </Pressable>
      </View>

      {/* Quiet, not a third button competing with the two above — this is
          the "no, actually, I'm just done" option, and it should read as
          the easiest one, not one more decision. */}
      <Pressable style={styles.doneRow} onPress={handleDone}>
        <Text style={styles.doneText}>{t('spillReveal.done')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  kicker: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  text: {
    color: colors.text.primary,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.loose,
    marginTop: spacing[4],
  },
  actions: { gap: spacing[3], marginTop: spacing[8] },
  button: {
    paddingVertical: spacing[4],
    borderRadius: radius.full,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.bg.base,
    fontFamily: fonts.medium,
    fontSize: fontSizes.base,
  },
  secondaryButton: {
    paddingVertical: spacing[4],
    borderRadius: radius.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  secondaryButtonText: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
  },
  doneRow: { alignItems: 'center', paddingTop: spacing[5] },
  doneText: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.sm },
});
