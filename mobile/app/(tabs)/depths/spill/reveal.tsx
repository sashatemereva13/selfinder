import { useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { usePhilosopherStore } from '../../../../src/store/philosopherStore';
import { useSpillStore } from '../../../../src/store/spillStore';
import { useGuideChatStore } from '../../../../src/store/guideChatStore';

export default function SpillRevealScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const text = useSpillStore((s) => s.text);
  const reset = useSpillStore((s) => s.reset);
  const send = useGuideChatStore((s) => s.send);
  const accentColor = philosopher?.color ?? colors.brand.purple;

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

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[6] }]}
    >
      <Text style={styles.kicker}>What came out</Text>
      <Text style={styles.text}>{text}</Text>

      <View style={styles.actions}>
        {philosopher && (
          <Pressable
            style={[styles.button, { backgroundColor: accentColor }]}
            onPress={handleTalkToPhilosopher}
          >
            <Text style={styles.buttonText}>Talk to {philosopher.name} about this</Text>
          </Pressable>
        )}
        <Pressable style={styles.secondaryButton} onPress={handleWriteAgain}>
          <Text style={styles.secondaryButtonText}>Write again</Text>
        </Pressable>
      </View>
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
});
