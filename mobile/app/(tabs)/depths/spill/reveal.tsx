import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../../../src/theme/useThemeColors';
import type { Colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { usePhilosopherStore } from '../../../../src/store/philosopherStore';
import { useSpillStore } from '../../../../src/store/spillStore';
import { useGuideChatStore } from '../../../../src/store/guideChatStore';
import { useAuthStore } from '../../../../src/store/authStore';
import { saveSpillEntryIfConsented } from '../../../../src/api/spill';
import { useAppAccentButtonRgb } from '../../../../src/utils/appAccent';
import { useReadingColumnWidth } from '../../../../src/theme/responsive';
import { track } from '../../../../src/utils/analytics';

type KeepState = 'idle' | 'saving' | 'kept' | 'needsConsent';

export default function SpillRevealScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const text = useSpillStore((s) => s.text);
  const reset = useSpillStore((s) => s.reset);
  const send = useGuideChatStore((s) => s.send);
  const session = useAuthStore((s) => s.session);
  const accentRgb = useAppAccentButtonRgb();
  const accentColor = `rgb(${accentRgb})`;
  const columnWidth = useReadingColumnWidth();
  const [keepState, setKeepState] = useState<KeepState>('idle');

  useEffect(() => {
    if (!text) router.replace('/(tabs)/depths/spill');
  }, [text]);

  if (!text) return null;

  const handleWriteAgain = () => {
    reset();
    router.replace('/(tabs)/depths/spill');
  };

  // "Keep this moment" only requires the same data-saving consent Measure/
  // Guide already use — not a subscription check. What's paid is richer
  // *access* to history (Your Arc), not whether this one entry gets
  // captured at all; the record itself was always the user's to keep.
  const handleKeepThisMoment = async () => {
    setKeepState('saving');
    track('spill_keep_this_moment');
    const kept = await saveSpillEntryIfConsented(text);
    setKeepState(kept ? 'kept' : 'needsConsent');
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
  // (nothing here persists past this screen unless "keep this moment" was
  // used first — see spillStore/api/spill.ts) and returns to Depths, the
  // same "back to home" destination every other finished flow in the app
  // lands on.
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

      {/* Quiet, optional row — not a third button competing with the two
          above, since keeping this specific entry is a separate, smaller
          decision from talking about it or writing again. Only shown to a
          signed-in account, since there's no account to save it under
          otherwise (matches Guide/Measure's own signed-in precondition for
          server-side saving). If consent isn't on yet, tapping explains
          that rather than silently failing — same two-case honesty
          your-arc.tsx already uses for its own locked detail. */}
      {session && keepState !== 'kept' && (
        <Pressable
          style={styles.keepRow}
          onPress={handleKeepThisMoment}
          disabled={keepState === 'saving'}
        >
          <Text style={styles.keepText}>
            {keepState === 'saving'
              ? t('spillReveal.keeping')
              : keepState === 'needsConsent'
                ? t('spillReveal.keepNeedsConsent')
                : t('spillReveal.keepThisMoment')}
          </Text>
        </Pressable>
      )}
      {keepState === 'kept' && <Text style={styles.keptConfirmation}>{t('spillReveal.kept')}</Text>}

      {/* Quiet, not a third button competing with the two above — this is
          the "no, actually, I'm just done" option, and it should read as
          the easiest one, not one more decision. */}
      <Pressable style={styles.doneRow} onPress={handleDone}>
        <Text style={styles.doneText}>{t('spillReveal.done')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
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
    color: colors.onAccent,
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
  keepRow: { alignItems: 'center', paddingTop: spacing[5] },
  keepText: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.sm },
  keptConfirmation: {
    color: colors.text.faint,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    paddingTop: spacing[5],
  },
  });
}
