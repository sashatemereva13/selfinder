import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../src/theme/typography';
import { spacing, radius } from '../../src/theme/spacing';
import { usePhilosopherStore } from '../../src/store/philosopherStore';
import { PhilosopherPicker } from '../../src/components/PhilosopherPicker';
import { AmbientGlow } from '../../src/components/AmbientGlow';

export default function OnboardingScreen() {
  const [step, setStep] = useState<'intro' | 'choose'>('intro');
  const router = useRouter();
  const select = usePhilosopherStore((s) => s.select);

  const handleSelect = async (id: string) => {
    await select(id);
    router.replace('/(tabs)/depths');
  };

  if (step === 'intro') {
    return (
      <View style={styles.introRoot}>
        <AmbientGlow />

        <View style={styles.introBody}>
          <Text style={styles.introKicker}>Selfinder</Text>
          <View style={styles.introLines}>
            <Text style={styles.introLine1}>Know what you feel.</Text>
            <Text style={styles.introLine2}>Understand why.</Text>
            <Text style={styles.introLine3}>Decide what{'\n'}comes next.</Text>
          </View>
        </View>

        <View style={styles.introFooter}>
          <Pressable style={styles.beginButton} onPress={() => setStep('choose')}>
            <Text style={styles.beginButtonText}>Begin</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.chooseRoot}>
      <Text style={styles.chooseTitle}>Choose who walks beside you</Text>
      <View style={styles.chooseBody}>
        <PhilosopherPicker onSelect={handleSelect} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  introRoot: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  introBody: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  introKicker: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
    marginBottom: spacing[6],
  },
  introLines: { gap: spacing[2] },
  introLine1: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.tight,
  },
  introLine2: {
    color: colors.text.primary,
    fontFamily: fonts.light,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.tight,
  },
  introLine3: {
    color: colors.brand.purple,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.tight,
    marginTop: spacing[2],
  },
  introFooter: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[10],
  },
  beginButton: {
    paddingVertical: spacing[4],
    borderRadius: radius.full,
    alignItems: 'center',
    backgroundColor: colors.brand.purple,
  },
  beginButtonText: { color: colors.bg.base, fontFamily: fonts.medium, fontSize: fontSizes.base },
  chooseRoot: {
    flex: 1,
    backgroundColor: colors.bg.base,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[12],
  },
  chooseTitle: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.tight,
    textAlign: 'center',
  },
  chooseBody: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing[10],
  },
});
