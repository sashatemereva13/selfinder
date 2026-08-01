import { useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { colors } from '../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../src/theme/typography';
import { spacing, radius } from '../../../src/theme/spacing';
import { usePhilosopherStore } from '../../../src/store/philosopherStore';
import { useLocaleStore, Locale } from '../../../src/store/localeStore';
import { useGuideChatStore } from '../../../src/store/guideChatStore';
import { useMeasureStore } from '../../../src/store/measureStore';
import { useSubscriptionStore } from '../../../src/store/subscriptionStore';
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
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const select = usePhilosopherStore((s) => s.select);
  const resetMet = usePhilosopherStore((s) => s.resetMet);
  const resetSelection = usePhilosopherStore((s) => s.resetSelection);
  const resetGuideChats = useGuideChatStore((s) => s.resetAll);
  const resetSavedResults = useMeasureStore((s) => s.resetSavedResults);
  const isSubscribed = useSubscriptionStore((s) => s.isSubscribed);
  const setSubscribed = useSubscriptionStore((s) => s.setSubscribed);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const accentRgb = useAppAccentRgb();
  const accentColor = `rgb(${accentRgb})`;

  const handleResetOnboarding = () => {
    resetMet();
    resetGuideChats();
    resetSavedResults();
    resetSelection();
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
    <View style={styles.root}>
      <AmbientGlow />
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
      >
        {/* "Walking with", not "Your guide" — the walk is the app's one
            recurring metaphor (walk it through → who walks beside you →
            Walk with Socrates), and this label keeps it going. */}
        <Text style={styles.kicker}>Walking with</Text>

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
              <Text style={styles.changeLink}>Change who walks beside you →</Text>
            </Pressable>
          </Animated.View>
        )}

        {showPicker && (
          <Animated.View style={pickerFadeStyle}>
            <Text style={styles.chooseTitle}>Choose who walks beside you</Text>
            <PhilosopherPicker selectedId={philosopher?.id} onSelect={handleSelect} />
            <Pressable style={styles.cancelButton} onPress={() => crossfadeTo('current')}>
              <Text style={styles.cancelLink}>Cancel</Text>
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
              <Text style={styles.languageKicker}>Language</Text>
              <View style={styles.languageRow}>
                {(['en', 'ru'] as Locale[]).map((option) => (
                  <Pressable
                    key={option}
                    style={[
                      styles.languageOption,
                      locale === option && { backgroundColor: colors.accent.ivory },
                    ]}
                    onPress={() => setLocale(option)}
                  >
                    <Text
                      style={[
                        styles.languageOptionText,
                        locale === option && { color: colors.bg.base },
                      ]}
                    >
                      {option === 'en' ? 'English' : 'Русский'}
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
        <AccountSection />

        {__DEV__ && (
          <>
            <View style={styles.divider} />
            <Pressable
              style={({ pressed }) => [styles.devResetButton, pressed && styles.devResetButtonPressed]}
              onPress={handleResetOnboarding}
            >
              <Text style={styles.devResetText}>
                {resetDone ? 'Reset ✓' : 'Reset onboarding state (dev only)'}
              </Text>
            </Pressable>
            {/* Placeholder for real entitlement — see subscriptionStore.ts.
                Toggling this is the only way to see/test the subscribed
                Your Arc experience until a real purchase flow exists. */}
            <Pressable
              style={({ pressed }) => [styles.devResetButton, pressed && styles.devResetButtonPressed]}
              onPress={() => setSubscribed(!isSubscribed)}
            >
              <Text style={styles.devResetText}>
                {isSubscribed ? 'Subscribed ✓ (dev only, tap to unsubscribe)' : 'Not subscribed (dev only, tap to subscribe)'}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
