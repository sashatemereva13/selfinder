import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useThemeColors } from '../../../src/theme/useThemeColors';
import { useThemeStore, ThemePreference } from '../../../src/store/themeStore';
import type { Colors } from '../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../src/theme/typography';
import { spacing, radius } from '../../../src/theme/spacing';
import { useReadingColumnWidth } from '../../../src/theme/responsive';
import { usePhilosopherStore } from '../../../src/store/philosopherStore';
import { useLocaleStore, Locale } from '../../../src/store/localeStore';
import { useReminderStore } from '../../../src/store/reminderStore';
import { useGuideChatStore } from '../../../src/store/guideChatStore';
import { useMeasureStore } from '../../../src/store/measureStore';
import { useEngagementStore } from '../../../src/store/engagementStore';
import { useAppAccentRgb } from '../../../src/utils/appAccent';
import { PhilosopherPicker } from '../../../src/components/PhilosopherPicker';
import { AccountSection } from '../../../src/components/AccountSection';
import { DailyReminderSection } from '../../../src/components/DailyReminderSection';
import { AmbientGlow } from '../../../src/components/AmbientGlow';

// Both directions ride the same crossfade duration/ease as PhilosopherPicker's
// own ring fade-in (see ownRingOpacity in PhilosopherPicker.tsx) — opening
// "Change who walks beside you" and confirming a new choice are the same
// kind of handoff (one block dissolving as the other resolves), so they
// should feel like the same motion, not two different speeds.
const CROSSFADE_DURATION = 450;

export default function YouScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const themePreference = useThemeStore((s) => s.preference);
  const setThemePreference = useThemeStore((s) => s.setPreference);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [changing, setChanging] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  // Drives which block is actually mounted (see the setTimeout unmounts
  // below) — kept separate from `changing` itself so the outgoing block can
  // finish fading out before it's removed, instead of `changing` flipping
  // and cutting it away mid-fade the way the old plain conditional mount did.
  const currentOpacity = useSharedValue(1);
  const pickerOpacity = useSharedValue(0);
  const [showCurrent, setShowCurrent] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const currentFadeStyle = useAnimatedStyle(() => ({ opacity: currentOpacity.value }));
  const pickerFadeStyle = useAnimatedStyle(() => ({ opacity: pickerOpacity.value }));
  const insets = useSafeAreaInsets();
  const columnWidth = useReadingColumnWidth();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const select = usePhilosopherStore((s) => s.select);
  const resetMet = usePhilosopherStore((s) => s.resetMet);
  const resetSelection = usePhilosopherStore((s) => s.resetSelection);
  const resetGuideChats = useGuideChatStore((s) => s.resetAll);
  const resetSavedResults = useMeasureStore((s) => s.resetSavedResults);
  const resetEngagement = useEngagementStore((s) => s.resetAll);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const rescheduleReminderWindow = useReminderStore((s) => s.rescheduleWindow);
  const accentRgb = useAppAccentRgb();
  const accentColor = `rgb(${accentRgb})`;

  const handleResetOnboarding = () => {
    resetMet();
    resetGuideChats();
    resetSavedResults();
    resetSelection();
    // Also resets totalMeasureCount/hasShownSecondVisit/
    // hasShownFirstRunCarry — without this, both the second-visit special
    // copy and the first-run Understand bloom stayed permanently
    // disqualified after a reset, since they gate on totalMeasureCount
    // === 1 and their own once-only flags, none of which this button
    // used to touch.
    resetEngagement();
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2000);
  };

  // Both directions are the same crossfade, just swapping which block is
  // "coming in" vs "going out" — the picker's ring dissolves as the restored
  // "Walking with [name]" text resolves in, rather than one instantly
  // replacing the other (the gap the onboarding ring-morph fix was based on:
  // this screen has the exact same picker/ring component, but nothing here
  // carried its fade-in into a real handoff).
  const crossfadeTo = (target: 'current' | 'picker') => {
    setChanging(target === 'picker');
    if (target === 'picker') {
      setShowPicker(true);
      pickerOpacity.value = withTiming(1, { duration: CROSSFADE_DURATION, easing: Easing.out(Easing.cubic) });
      currentOpacity.value = withTiming(0, { duration: CROSSFADE_DURATION, easing: Easing.inOut(Easing.cubic) });
      setTimeout(() => setShowCurrent(false), CROSSFADE_DURATION);
    } else {
      setShowCurrent(true);
      currentOpacity.value = withTiming(1, { duration: CROSSFADE_DURATION, easing: Easing.out(Easing.cubic) });
      pickerOpacity.value = withTiming(0, { duration: CROSSFADE_DURATION, easing: Easing.inOut(Easing.cubic) });
      setTimeout(() => setShowPicker(false), CROSSFADE_DURATION);
    }
  };

  const handleSelect = async (id: string) => {
    await select(id);
    crossfadeTo('current');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      // Same fix/reasoning as Guide's own KeyboardAvoidingView: 'height' on
      // Android (not 'undefined', the RN default when no behavior is set,
      // which runs no keyboard avoidance at all) — without this, the
      // login/create-account TextInputs further down this screen were
      // covered by the keyboard on Android with no way to scroll them into
      // view. No keyboardVerticalOffset — no fixed header here either.
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {theme === 'dark' && <AmbientGlow />}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing[4], width: columnWidth, alignSelf: 'center' },
        ]}
        // Without this, ScrollView's default ('never') means a tap on any
        // Pressable below a focused TextInput (e.g. "Confirm delete" right
        // under the delete-confirmation input) only dismisses the keyboard
        // on its first tap instead of firing onPress — the button LOOKS
        // unresponsive since nothing visible happens, and it takes a
        // second tap to actually register. Confirmed via device logs
        // 2026-08-14: repeated keyboard-focus churn (stealKeyboard/
        // focusApplication cycling) right as the user tried to tap
        // Confirm delete, with no corresponding app-level event ever
        // firing — consistent with taps being eaten by keyboard dismissal.
        keyboardShouldPersistTaps="handled"
      >
        {/* "Walking with", not "Your guide" — the walk is the app's one
            recurring metaphor (walk it through → who walks beside you →
            Walk with Socrates), and this label keeps it going. */}
        <Text style={styles.kicker}>{t('you.walkingWith')}</Text>

        {showCurrent && philosopher && (
          <Animated.View style={[styles.currentSection, currentFadeStyle]}>
            <Text style={[styles.currentName, { color: accentColor }]}>{philosopher.name}</Text>
            <Text style={styles.currentMode}>{philosopher.mode}</Text>
            <Text style={styles.currentDescription}>{philosopher.description}</Text>
            <Pressable
              onPress={() => {
                crossfadeTo('picker');
                scrollRef.current?.scrollTo({ y: 0, animated: false });
              }}
            >
              <Text style={styles.changeLink}>{t('you.changeWhoWalksBesideYou')}</Text>
            </Pressable>
          </Animated.View>
        )}

        {showPicker && (
          <Animated.View style={pickerFadeStyle}>
            <Text style={styles.chooseTitle}>{t('you.chooseWhoWalksBesideYou')}</Text>
            <PhilosopherPicker selectedId={philosopher?.id} onSelect={handleSelect} />
            <Pressable style={styles.cancelButton} onPress={() => crossfadeTo('current')}>
              <Text style={styles.cancelLink}>{t('you.cancel')}</Text>
            </Pressable>
          </Animated.View>
        )}

        {!changing && (
          <>
            <View style={styles.divider} />
            {/* Not nested inside AccountSection, and not gated on being
                signed in — most usage doesn't require an account, and a
                language preference is meaningful before someone ever
                creates one. Placed as its own top-level section so it's
                never hidden behind login. */}
            <View style={styles.languageSection}>
              <Text style={styles.languageKicker}>{t('you.language')}</Text>
              <View style={styles.languageRow}>
                {(['en', 'ru'] as Locale[]).map((option) => (
                  <Pressable
                    key={option}
                    style={[
                      styles.languageOption,
                      locale === option && { backgroundColor: colors.accent.buttonFill },
                    ]}
                    onPress={() => {
                      setLocale(option);
                      // Already-scheduled reminder notifications bake their
                      // body text in at schedule time (see dailyReminder.ts),
                      // so a language switch needs a real reschedule, not
                      // just the next cold-start top-up, or pending
                      // notifications keep firing in the old language.
                      if (philosopher) rescheduleReminderWindow(philosopher);
                    }}
                  >
                    <Text
                      style={[
                        styles.languageOptionText,
                        locale === option && { color: colors.onAccent },
                      ]}
                    >
                      {option === 'en' ? t('you.languageEnglish') : t('you.languageRussian')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.divider} />
            <View style={styles.themeSection}>
              <Text style={styles.themeKicker}>{t('you.theme')}</Text>
              <View style={styles.themeRow}>
                {(['system', 'light', 'dark'] as ThemePreference[]).map((option) => (
                  <Pressable
                    key={option}
                    style={[
                      styles.themeOption,
                      themePreference === option && { backgroundColor: colors.accent.buttonFill },
                    ]}
                    onPress={() => setThemePreference(option)}
                  >
                    <Text
                      style={[
                        styles.themeOptionText,
                        themePreference === option && { color: colors.onAccent },
                      ]}
                    >
                      {option === 'system'
                        ? t('you.themeSystem')
                        : option === 'light'
                          ? t('you.themeLight')
                          : t('you.themeDark')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.divider} />
            <DailyReminderSection />
          </>
        )}

        <View style={styles.divider} />
        <Pressable onPress={() => router.push('/how-to-use')}>
          <Text style={styles.sourcesLink}>{t('you.howToUseLink')}</Text>
        </Pressable>

        {/* Center's entry point (2026-08-22, the Your Arc + Center split
            — see RULES.md's Product/positioning section) — a catalog of
            one-time-purchase experiences, distinct from Your Arc's
            ongoing subscription, same row weight as the links around it. */}
        <View style={styles.divider} />
        <Pressable onPress={() => router.push('/products')}>
          <Text style={styles.sourcesLink}>{t('you.productsLink')}</Text>
        </Pressable>

        <View style={styles.divider} />
        <Pressable onPress={() => router.push('/sources')}>
          <Text style={styles.sourcesLink}>{t('level.sourcesLink')}</Text>
        </Pressable>

        <View style={styles.divider} />
        <AccountSection />

        {/* Not gated on __DEV__ (always false in an eas build --profile
            production, the only kind testers actually install) — visible
            in every build for now since closed testing is a developer-
            heavy group and re-testing onboarding otherwise requires a full
            uninstall/reinstall. Re-gate before a real public launch (see
            RULES.md-style note: revisit once Selfinder+ has a real
            entitlement/purchase flow and onboarding has another way to
            reset for QA). */}
        <View style={styles.divider} />
        <Pressable
          style={({ pressed }) => [styles.devResetButton, pressed && styles.devResetButtonPressed]}
          onPress={handleResetOnboarding}
        >
          <Text style={styles.devResetText}>
            {resetDone ? t('you.devResetDone') : t('you.devResetOnboarding')}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg.base },
    scroll: { flex: 1 },
    content: { padding: spacing[6], paddingBottom: spacing[12], gap: spacing[6] },
    languageSection: { gap: spacing[3] },
    languageKicker: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
    },
    languageRow: { flexDirection: 'row', gap: spacing[2] },
    // Filled pill on the active option, same convention as AccountSection's
    // consentToggleButton — an outlined pill would be a different visual
    // language from the one other real toggle already in this screen area.
    languageOption: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
      borderRadius: radius.full,
      backgroundColor: colors.bg.elevated,
    },
    languageOptionText: { color: colors.text.secondary, fontFamily: fonts.medium, fontSize: fontSizes.sm },
    themeSection: { gap: spacing[3] },
    themeKicker: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
    },
    themeRow: { flexDirection: 'row', gap: spacing[2] },
    themeOption: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
      borderRadius: radius.full,
      backgroundColor: colors.bg.elevated,
    },
    themeOptionText: { color: colors.text.secondary, fontFamily: fonts.medium, fontSize: fontSizes.sm },
    kicker: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
      marginBottom: spacing[4],
    },
    // No card — space and the kicker label above it separate this from the
    // rest of the page, same register as every other screen in the app.
    currentSection: { gap: spacing[2] },
    // Thin line between logical groups (current philosopher / Daily Reminder /
    // Account / dev tools) — same token values as Depths' own sectionDivider,
    // so a section break reads identically everywhere in the app rather than
    // each screen inventing its own gap.
    divider: { height: 1, backgroundColor: colors.bg.border },
    currentName: { fontFamily: fonts.medium, fontSize: fontSizes.lg },
    currentMode: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs },
    currentDescription: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
      marginBottom: spacing[2],
    },
    changeLink: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.sm },
    chooseTitle: {
      color: colors.text.secondary,
      fontFamily: fonts.medium,
      fontSize: fontSizes.md,
      marginBottom: spacing[4],
    },
    cancelButton: { alignItems: 'center', paddingVertical: spacing[4] },
    cancelLink: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.sm },
    devResetButton: {
      alignItems: 'center',
      paddingVertical: spacing[3],
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.bg.border,
      borderStyle: 'dashed',
    },
    devResetButtonPressed: {
      opacity: 0.5,
      backgroundColor: colors.bg.elevated,
    },
    devResetText: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
    sourcesLink: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.sm },
  });
}
