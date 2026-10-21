import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useThemeColors } from '../src/theme/useThemeColors';
import { useThemeStore, ThemePreference } from '../src/store/themeStore';
import type { Colors } from '../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../src/theme/typography';
import { spacing, radius } from '../src/theme/spacing';
import { useReadingColumnWidth } from '../src/theme/responsive';
import { usePhilosopherStore } from '../src/store/philosopherStore';
import { useLocaleStore, Locale } from '../src/store/localeStore';
import { useReminderStore } from '../src/store/reminderStore';
import { useAuthStore } from '../src/store/authStore';
import { useAppAccentTextRgb } from '../src/utils/appAccent';
import { PhilosopherPicker } from '../src/components/shared/PhilosopherPicker';
import { AccountSection } from '../src/components/AccountSection';
import { DailyReminderSection } from '../src/components/account/DailyReminderSection';
import { AmbientGlow } from '../src/components/shared/AmbientGlow';
import { BackLink } from '../src/components/shared/BackLink';
import { CrisisLine } from '../src/components/shared/CrisisLine';

// Both directions ride the same crossfade duration/ease as PhilosopherPicker's
// own ring fade-in (see ownRingOpacity in PhilosopherPicker.tsx) — opening
// "Change who walks beside you" and confirming a new choice are the same
// kind of handoff (one block dissolving as the other resolves), so they
// should feel like the same motion, not two different speeds.
const CROSSFADE_DURATION = 450;

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const themePreference = useThemeStore((s) => s.preference);
  const setThemePreference = useThemeStore((s) => s.setPreference);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [changing, setChanging] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const session = useAuthStore((s) => s.session);
  // Where "Walking with" sits, so changing the philosopher scrolls to the
  // picker rather than to the sign-in form above it.
  const philosopherY = useRef(0);
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
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const rescheduleReminderWindow = useReminderStore((s) => s.rescheduleWindow);
  // Text-safe — colors the current philosopher's name.
  const accentRgb = useAppAccentTextRgb();
  const accentColor = `rgb(${accentRgb})`;

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
        {/* A top-level route reached from Explore's last row ("You",
            2026-10-09), not a tab itself — the default router.back() is
            correct here, since this is always PUSHED from Explore, so
            popping the stack genuinely returns there. */}
        <BackLink style={styles.backRow} />

        {/* Signed out, signing in is what someone came here for — Explore's
            row says "Sign in" — so the form comes first (2026-10-21).
            Signed in, the account (consent, export, delete) stays at the
            end, below everything used more often. */}
        {!session && (
          <>
            <AccountSection />
            <View style={styles.divider} />
          </>
        )}

        {/* "Walking with", not "Your guide" — the walk is the app's one
            recurring metaphor (walk it through → who walks beside you →
            Walk with Socrates), and this label keeps it going. */}
        <Text
          style={styles.kicker}
          accessibilityRole="header"
          onLayout={(e) => (philosopherY.current = e.nativeEvent.layout.y)}
        >
          {t('you.walkingWith')}
        </Text>

        {showCurrent && philosopher && (
          <Animated.View style={[styles.currentSection, currentFadeStyle]}>
            <Text style={[styles.currentName, { color: accentColor }]}>{philosopher.name}</Text>
            <Text style={styles.currentMode}>{philosopher.mode}</Text>
            <Text style={styles.currentDescription}>{philosopher.description}</Text>
            <Pressable
              onPress={() => {
                crossfadeTo('picker');
                scrollRef.current?.scrollTo({ y: session ? 0 : philosopherY.current, animated: false });
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
            {/* Grouped into the four sections docs/app-architecture-
                concept.md specified for this screen ("You becomes a
                profile page, not a tab") — Your guide (above) / Selfinder
                / Preferences / Account — reorganized 2026-08-28 from a
                flat, ungrouped list of rows into these labeled sections,
                and with the now-redundant "Journeys →" row removed (it
                only mattered before Journeys had its own bottom tab). */}
            <View style={styles.divider} />
            <View style={styles.groupSection}>
              <Text style={styles.groupKicker} accessibilityRole="header">{t('you.groupSelfinder')}</Text>
              <Pressable onPress={() => router.push('/how-to-use')}>
                <Text style={styles.sourcesLink}>{t('you.howToUseLink')}</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/sources')}>
                <Text style={styles.sourcesLink}>{t('level.sourcesLink')}</Text>
              </Pressable>
            </View>

            <View style={styles.divider} />
            <View style={styles.groupSection}>
              <Text style={styles.groupKicker} accessibilityRole="header">{t('you.groupPreferences')}</Text>
              {/* Not nested inside AccountSection, and not gated on being
                  signed in — most usage doesn't require an account, and a
                  language preference is meaningful before someone ever
                  creates one. */}
              <View style={styles.languageSection}>
                <Text style={styles.languageKicker}>{t('you.language')}</Text>
                <View style={styles.languageRow} accessibilityRole="radiogroup">
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
                      accessibilityRole="radio"
                      accessibilityState={{ checked: locale === option }}
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

              <View style={styles.themeSection}>
                <Text style={styles.themeKicker}>{t('you.theme')}</Text>
                <View style={styles.themeRow} accessibilityRole="radiogroup">
                  {(['system', 'light', 'dark'] as ThemePreference[]).map((option) => (
                    <Pressable
                      key={option}
                      style={[
                        styles.themeOption,
                        themePreference === option && { backgroundColor: colors.accent.buttonFill },
                      ]}
                      onPress={() => setThemePreference(option)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: themePreference === option }}
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

              <DailyReminderSection />
            </View>
          </>
        )}

        {/* No wrapping groupKicker here, unlike the two sections above —
            AccountSection already renders its own "Account" kicker
            internally (account.kicker), so adding a second one directly
            above it would read as the same label twice in a row. */}
        {session && (
          <>
            <View style={styles.divider} />
            <AccountSection />
          </>
        )}
        {/* Always there, last (crisis safety net, 2026-10-10). */}
        <View style={styles.divider} />
        <CrisisLine kind="help" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg.base },
    scroll: { flex: 1 },
    content: { padding: spacing[6], paddingBottom: spacing[12], gap: spacing[6] },
    groupSection: { gap: spacing[5] },
    groupKicker: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
    },
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
    backRow: { alignSelf: 'flex-start', paddingBottom: spacing[6] },
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
    sourcesLink: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.sm },
  });
}
