import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { TUNE_IN_STATES } from '../../../../src/content/tuneInStates';

const VOLUME_STEPS = [0.1, 0.2, 0.3, 0.4, 0.5];

function Pulse({ color, active }: { color: string; active: boolean }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      progress.value = withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    } else {
      progress.value = withSpring(0);
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.18 }],
    opacity: 0.55 + progress.value * 0.45,
  }));

  return (
    <View style={styles.pulseWrap}>
      <Animated.View style={[styles.pulseOrb, { backgroundColor: `rgba(${color},0.35)` }, animatedStyle]} />
      <View style={[styles.pulseCore, { backgroundColor: `rgb(${color})` }]} />
    </View>
  );
}

export default function TuneInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);

  const players = [
    useAudioPlayer(TUNE_IN_STATES[0].asset),
    useAudioPlayer(TUNE_IN_STATES[1].asset),
    useAudioPlayer(TUNE_IN_STATES[2].asset),
  ];

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  useEffect(() => {
    players.forEach((player) => {
      player.loop = true;
      player.volume = volume;
    });
  }, [volume]);

  const activeState = TUNE_IN_STATES[selected];

  const handleToggle = () => {
    if (isPlaying) {
      players[selected].pause();
      setIsPlaying(false);
    } else {
      players[selected].play();
      setIsPlaying(true);
    }
  };

  const handleSelect = (index: number) => {
    if (index === selected) return;
    if (isPlaying) {
      players[selected].pause();
      players[index].play();
    }
    setSelected(index);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
    >
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Text style={styles.backLink}>← Back</Text>
      </Pressable>

      <Text style={styles.kicker}>Regulation Layer</Text>
      <Text style={styles.title}>Tune your field with frequency</Text>
      <Text style={styles.copy}>
        Each state plays two tones a few Hz apart, one per ear — your brain reads the gap
        between them as a single slow pulse.
      </Text>
      <Text style={styles.headphonesNote}>🎧 Needs stereo headphones — through speakers the beat won't form.</Text>

      <Pulse color={activeState.color} active={isPlaying} />

      <Text style={[styles.activeLabel, { color: `rgb(${activeState.color})` }]}>
        {activeState.name} — {activeState.band} ({activeState.beatHz}Hz beat)
      </Text>
      <Text style={styles.intent}>{activeState.intent}</Text>

      <Pressable
        style={[styles.playButton, { backgroundColor: `rgb(${activeState.color})` }]}
        onPress={handleToggle}
      >
        <Text style={styles.playButtonText}>{isPlaying ? 'Stop' : 'Play'}</Text>
      </Pressable>

      <View style={styles.volumeRow}>
        <Text style={styles.volumeLabel}>Volume</Text>
        <View style={styles.volumeSteps}>
          {VOLUME_STEPS.map((step) => (
            <Pressable
              key={step}
              style={[
                styles.volumeBar,
                { height: 10 + VOLUME_STEPS.indexOf(step) * 5 },
                volume >= step && { backgroundColor: `rgb(${activeState.color})` },
              ]}
              onPress={() => setVolume(step)}
            />
          ))}
        </View>
      </View>

      <View style={styles.list}>
        {TUNE_IN_STATES.map((state, i) => (
          <Pressable
            key={state.name}
            style={[styles.row, i === selected && { borderColor: `rgb(${state.color})` }]}
            onPress={() => handleSelect(i)}
          >
            <View style={[styles.rowDot, { backgroundColor: `rgb(${state.color})` }]} />
            <View style={styles.rowTextCol}>
              <Text style={styles.rowName}>{state.name}</Text>
              <Text style={styles.rowIntent}>{state.intent}</Text>
            </View>
            <Text style={styles.rowHz}>{state.band} · {state.beatHz}Hz</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { padding: spacing[6], paddingBottom: spacing[12], alignItems: 'center' },
  backRow: { alignSelf: 'flex-start', paddingBottom: spacing[4] },
  backLink: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.sm },
  kicker: {
    alignSelf: 'flex-start',
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  title: {
    alignSelf: 'flex-start',
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.tight,
    marginTop: spacing[2],
  },
  copy: {
    alignSelf: 'flex-start',
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
    marginTop: spacing[3],
  },
  headphonesNote: {
    alignSelf: 'flex-start',
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    marginTop: spacing[3],
    marginBottom: spacing[6],
  },
  pulseWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
  },
  pulseOrb: { position: 'absolute', width: 160, height: 160, borderRadius: 80 },
  pulseCore: { width: 64, height: 64, borderRadius: 32 },
  activeLabel: { fontFamily: fonts.medium, fontSize: fontSizes.md, textAlign: 'center' },
  intent: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    textAlign: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[5],
    paddingHorizontal: spacing[4],
  },
  playButton: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: radius.full,
    marginBottom: spacing[6],
  },
  playButtonText: { color: colors.bg.base, fontFamily: fonts.medium, fontSize: fontSizes.base },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  volumeLabel: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.sm },
  volumeSteps: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2] },
  volumeBar: { width: 8, borderRadius: radius.full, backgroundColor: colors.bg.border },
  list: { width: '100%', gap: spacing[3] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    backgroundColor: colors.bg.elevated,
  },
  rowDot: { width: 10, height: 10, borderRadius: 5 },
  rowTextCol: { flex: 1, gap: spacing[1] },
  rowName: { color: colors.text.primary, fontFamily: fonts.medium, fontSize: fontSizes.base },
  rowIntent: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },
  rowHz: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs },
});
