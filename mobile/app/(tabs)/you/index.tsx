import { useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../src/theme/typography';
import { spacing, radius } from '../../../src/theme/spacing';
import { usePhilosopherStore } from '../../../src/store/philosopherStore';
import { useGuideChatStore } from '../../../src/store/guideChatStore';
import { useMeasureStore } from '../../../src/store/measureStore';
import { useSubscriptionStore } from '../../../src/store/subscriptionStore';
import { useAppAccentRgb } from '../../../src/utils/appAccent';
import { PhilosopherPicker } from '../../../src/components/PhilosopherPicker';
import { AccountSection } from '../../../src/components/AccountSection';
import { DailyReminderSection } from '../../../src/components/DailyReminderSection';
import { AmbientGlow } from '../../../src/components/AmbientGlow';

export default function YouScreen() {
  const [changing, setChanging] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const select = usePhilosopherStore((s) => s.select);
  const resetMet = usePhilosopherStore((s) => s.resetMet);
  const resetSelection = usePhilosopherStore((s) => s.resetSelection);
  const resetGuideChats = useGuideChatStore((s) => s.resetAll);
  const resetSavedResults = useMeasureStore((s) => s.resetSavedResults);
  const isSubscribed = useSubscriptionStore((s) => s.isSubscribed);
  const setSubscribed = useSubscriptionStore((s) => s.setSubscribed);
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

  const handleSelect = async (id: string) => {
    await select(id);
    setChanging(false);
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

        {!changing && philosopher && (
          <View style={styles.currentSection}>
            <Text style={[styles.currentName, { color: accentColor }]}>{philosopher.name}</Text>
            <Text style={styles.currentMode}>{philosopher.mode}</Text>
            <Text style={styles.currentDescription}>{philosopher.description}</Text>
            <Pressable
              onPress={() => {
                setChanging(true);
                scrollRef.current?.scrollTo({ y: 0, animated: false });
              }}
            >
              <Text style={styles.changeLink}>Change who walks beside you →</Text>
            </Pressable>
          </View>
        )}

        {changing && (
          <View>
            <Text style={styles.chooseTitle}>Choose who walks beside you</Text>
            <PhilosopherPicker selectedId={philosopher?.id} onSelect={handleSelect} />
            <Pressable style={styles.cancelButton} onPress={() => setChanging(false)}>
              <Text style={styles.cancelLink}>Cancel</Text>
            </Pressable>
          </View>
        )}

        {!changing && (
          <>
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
