import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../src/theme/typography';
import { spacing, radius } from '../../src/theme/spacing';
import { usePhilosopherStore } from '../../src/store/philosopherStore';
import { PhilosopherPicker } from '../../src/components/PhilosopherPicker';
import { AmbientGlow } from '../../src/components/AmbientGlow';
import { AuraFigure } from '../../src/components/AuraFigure';
import { track } from '../../src/utils/analytics';

// Previews the app's real visual signature — the same aura figure that will
// later embody the color of an actual reading — before a single word is
// read. Shown in its neutral, unmeasured state, since onboarding always
// happens before a first Measure exists. Gently pulses, echoing AmbientGlow's
// breathing background.
function IntroFigure() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 3400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.85 + pulse.value * 0.15,
    transform: [{ scale: 1 + pulse.value * 0.03 }],
  }));

  return (
    <Animated.View style={[styles.introOrbWrap, animatedStyle]}>
      <AuraFigure neutral size={140} uid="onboarding" />
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const [step, setStep] = useState<'intro' | 'choose'>('intro');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const select = usePhilosopherStore((s) => s.select);

  const handleSelect = async (id: string) => {
    await select(id);
    track('onboarding_completed');
    router.replace('/(tabs)/guide');
  };

  if (step === 'intro') {
    return (
      <View style={styles.introRoot}>
        <AmbientGlow />

        <View style={styles.introBody}>
          <IntroFigure />
          <Text style={styles.introKicker}>Selfinder</Text>
          <View style={styles.introLines}>
            <Text style={styles.introLine1}>Know what you feel.</Text>
            <Text style={styles.introLine2}>Understand why.</Text>
            <Text style={styles.introLine3}>Walk it through with a philosopher.</Text>
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
    <View style={[styles.chooseRoot, { paddingTop: insets.top + spacing[4] }]}>
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
    justifyContent: 'flex-end',
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[10],
  },
  introOrbWrap: {
    alignSelf: 'flex-start',
    marginBottom: spacing[6],
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
