import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../src/theme/typography';
import { spacing, radius } from '../../../src/theme/spacing';
import { usePhilosopherStore } from '../../../src/store/philosopherStore';
import { useGuideChatStore } from '../../../src/store/guideChatStore';
import { useMeasureStore } from '../../../src/store/measureStore';
import { PhilosopherPicker } from '../../../src/components/PhilosopherPicker';
import { AccountSection } from '../../../src/components/AccountSection';
import { DailyReminderSection } from '../../../src/components/DailyReminderSection';

export default function YouScreen() {
  const [changing, setChanging] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const insets = useSafeAreaInsets();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const select = usePhilosopherStore((s) => s.select);
  const resetMet = usePhilosopherStore((s) => s.resetMet);
  const resetGuideChats = useGuideChatStore((s) => s.resetAll);
  const resetSavedResults = useMeasureStore((s) => s.resetSavedResults);

  const handleResetOnboarding = () => {
    resetMet();
    resetGuideChats();
    resetSavedResults();
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2000);
  };

  const handleSelect = async (id: string) => {
    await select(id);
    setChanging(false);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
    >
      <Text style={styles.kicker}>Your guide</Text>

      {!changing && philosopher && (
        <View style={[styles.currentCard, { borderColor: philosopher.color }]}>
          <Text style={[styles.currentName, { color: philosopher.color }]}>{philosopher.name}</Text>
          <Text style={styles.currentMode}>{philosopher.mode}</Text>
          <Text style={styles.currentDescription}>{philosopher.description}</Text>
          <Pressable onPress={() => setChanging(true)}>
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

      {!changing && <DailyReminderSection />}

      <AccountSection />

      {__DEV__ && (
        <Pressable
          style={({ pressed }) => [styles.devResetButton, pressed && styles.devResetButtonPressed]}
          onPress={handleResetOnboarding}
        >
          <Text style={styles.devResetText}>
            {resetDone ? 'Reset ✓' : 'Reset onboarding state (dev only)'}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { padding: spacing[6], paddingBottom: spacing[12], gap: spacing[6] },
  kicker: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
    marginBottom: spacing[4],
  },
  currentCard: {
    gap: spacing[2],
    padding: spacing[5],
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.bg.elevated,
  },
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
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
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
