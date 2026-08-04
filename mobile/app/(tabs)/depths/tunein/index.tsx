import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet } from 'react-native';
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
import { TUNE_IN_STATES, getLocalizedTuneInState } from '../../../../src/content/tuneInStates';
import { track } from '../../../../src/utils/analytics';
import { useEngagementStore } from '../../../../src/store/engagementStore';
import { useLocaleStore } from '../../../../src/store/localeStore';
import { AmbientGlow } from '../../../../src/components/AmbientGlow';

const VOLUME_STEPS = [0.1, 0.2, 0.3, 0.4, 0.5];
const TIMER_OPTIONS = [5, 15, 30, 45, 60];
// Fading out over the last stretch of a timer matters specifically for the
// bedtime use case this was built for — an abrupt cut is jarring if you're
// already half asleep; a fade reads as the sound settling, not stopping.
const FADE_SECONDS = 15;

const PULSE_REST_SCALE = 1;

// The transparent ring runs its own slow, independent wave — several
// seconds to fully spread and fade — separate from the core's own quick
// 1.8s pulse. Tying the ring's full screen-spanning travel to the same
// fast beat as the button made it look like it was rushing to keep up,
// which fought the whole point of Calm/Deep Rest/Sleep. A slow wave
// underneath a faster pulse reads as the room breathing at its own
// unhurried pace, echoing AmbientGlow's register, while the core still
// pulses at the beat that matches the audio.
const WAVE_DURATION_MS = 6600;
const WAVE_PEAK_SCALE = 7;

function Pulse({ active, onPress }: { active: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const beat = useSharedValue(0);
  const wave = useSharedValue(0);

  useEffect(() => {
    if (active) {
      beat.value = withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
      wave.value = withRepeat(
        withTiming(1, { duration: WAVE_DURATION_MS, easing: Easing.out(Easing.sin) }),
        -1,
        false
      );
    } else {
      beat.value = withSpring(0);
      wave.value = withTiming(0, { duration: 400 });
    }
  }, [active]);

  const coreStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + beat.value * 0.45,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: PULSE_REST_SCALE + wave.value * (WAVE_PEAK_SCALE - PULSE_REST_SCALE) }],
    opacity: 0.3 * (1 - wave.value),
  }));

  return (
    <View style={styles.pulseWrap} pointerEvents="box-none">
      <Animated.View style={[styles.pulseOrb, ringStyle]} pointerEvents="none" />
      <Animated.View style={[styles.pulseCoreGlow, coreStyle]} pointerEvents="none" />
      <Pressable style={styles.pulseCore} onPress={onPress}>
        <Text style={styles.pulseCoreLabel}>{active ? t('common.stop') : t('tuneIn.play')}</Text>
      </Pressable>
    </View>
  );
}

export default function TuneInScreen() {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const markDiscovered = useEngagementStore((s) => s.markDiscovered);

  useEffect(() => {
    markDiscovered('tuneIn');
  }, []);

  const players = [
    useAudioPlayer(TUNE_IN_STATES[0].asset),
    useAudioPlayer(TUNE_IN_STATES[1].asset),
    useAudioPlayer(TUNE_IN_STATES[2].asset),
  ];

  // shouldPlayInBackground + doNotMix keep a tune sounding after the screen
  // locks — deliberately available to every user, not gated behind
  // Selfinder+: several states are explicitly built for falling asleep
  // (see Sleep/Deep Rest's intent copy), and a sleep aid that stops the
  // moment the screen locks doesn't do its job.
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
  }, []);

  useEffect(() => {
    players.forEach((player) => {
      player.loop = true;
      player.volume = volume;
    });
  }, [volume]);

  // Counts down once a timer is set, fading the active player's volume over
  // the final FADE_SECONDS rather than cutting it off, then stops playback.
  // Only ticks while something is actually playing — setting a timer before
  // pressing Play should hold the chosen duration, not silently burn through
  // it (or start fading toward silence) while nothing is even sounding.
  useEffect(() => {
    if (remainingSeconds === null || !isPlaying) return;
    if (remainingSeconds <= 0) {
      players[selected].pause();
      players[selected].setActiveForLockScreen(false);
      setIsPlaying(false);
      players.forEach((player) => { player.volume = volume; });
      setTimerMinutes(null);
      setRemainingSeconds(null);
      track('tune_in_stopped', { state: TUNE_IN_STATES[selected].name, reason: 'timer' });
      return;
    }
    if (remainingSeconds <= FADE_SECONDS) {
      players[selected].volume = volume * (remainingSeconds / FADE_SECONDS);
    }
    const id = setTimeout(() => setRemainingSeconds((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [remainingSeconds, isPlaying]);

  const activeState = TUNE_IN_STATES[selected];

  const clearTimer = () => {
    setTimerMinutes(null);
    setRemainingSeconds(null);
    players.forEach((player) => { player.volume = volume; });
  };

  const handleSelectTimer = (minutes: number) => {
    if (timerMinutes === minutes) {
      clearTimer();
      return;
    }
    setTimerMinutes(minutes);
    setRemainingSeconds(minutes * 60);
  };

  const handleToggle = () => {
    if (isPlaying) {
      players[selected].pause();
      players[selected].setActiveForLockScreen(false);
      setIsPlaying(false);
      clearTimer();
      track('tune_in_stopped', { state: activeState.name, reason: 'manual' });
    } else {
      players[selected].play();
      players[selected].setActiveForLockScreen(true, {
        title: getLocalizedTuneInState(activeState, locale).name,
        artist: t('tuneIn.lockScreenArtist'),
      });
      setIsPlaying(true);
      track('tune_in_started', { state: activeState.name });
    }
  };

  const handleSelect = (index: number) => {
    if (index === selected) return;
    if (isPlaying) {
      players[selected].pause();
      players[selected].setActiveForLockScreen(false);
      players[index].play();
      players[index].setActiveForLockScreen(true, {
        title: getLocalizedTuneInState(TUNE_IN_STATES[index], locale).name,
        artist: t('tuneIn.lockScreenArtist'),
      });
      track('tune_in_switched', { from: activeState.name, to: TUNE_IN_STATES[index].name });
    }
    setSelected(index);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[4] }]}>
      <AmbientGlow intensified={isPlaying} pulseDurationMs={isPlaying ? 1800 : 4200} />

      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Text style={styles.backLink}>{t('common.back')}</Text>
      </Pressable>

      <Text style={styles.kicker}>{t('common.regulationLayer')}</Text>
      <Text style={styles.title}>{t('tuneIn.title')}</Text>
      <Text style={styles.introLine}>
        {t('tuneIn.introLine')}
      </Text>

      <View style={styles.pickerRow}>
        {TUNE_IN_STATES.map((state, i) => (
          <Pressable key={state.name} style={styles.pickerItem} onPress={() => handleSelect(i)}>
            <Text style={[styles.pickerName, i === selected && styles.pickerNameActive]}>
              {getLocalizedTuneInState(state, locale).name}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.centerBlock}>
        <Pulse active={isPlaying} onPress={handleToggle} />
        <Text style={styles.intent}>{getLocalizedTuneInState(activeState, locale).intent}</Text>
      </View>

      <View style={styles.volumeRow}>
        <Text style={styles.volumeLabel}>{t('tuneIn.volume')}</Text>
        <View style={styles.volumeSteps}>
          {VOLUME_STEPS.map((step) => (
            <Pressable
              key={step}
              style={[styles.volumeDot, volume >= step && styles.volumeDotActive]}
              onPress={() => setVolume(step)}
            />
          ))}
        </View>
      </View>

      <View style={styles.timerSection}>
        <Text style={styles.volumeLabel}>{t('tuneIn.sleepTimer')}</Text>
        <View style={styles.timerChipRow}>
          {TIMER_OPTIONS.map((minutes) => (
            <Pressable
              key={minutes}
              style={[styles.timerChip, timerMinutes === minutes && styles.timerChipActive]}
              onPress={() => handleSelectTimer(minutes)}
            >
              <Text style={[styles.timerChipText, timerMinutes === minutes && styles.timerChipTextActive]}>
                {minutes}m
              </Text>
            </Pressable>
          ))}
        </View>
        {remainingSeconds !== null && (
          <Text style={styles.timerCountdown}>
            {t('tuneIn.fadingOutIn', {
              time: `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`,
            })}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
    alignItems: 'center',
  },
  backRow: { alignSelf: 'flex-start', paddingBottom: spacing[8] },
  backLink: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
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
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.tight,
    marginTop: spacing[2],
  },
  introLine: {
    alignSelf: 'flex-start',
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    marginTop: spacing[3],
    marginBottom: spacing[6],
  },
  pickerRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: spacing[6],
  },
  pickerItem: { alignItems: 'center', paddingVertical: spacing[2] },
  pickerName: { color: colors.text.muted, fontFamily: fonts.medium, fontSize: fontSizes.sm },
  pickerNameActive: { color: colors.accent.ivory, fontSize: fontSizes.base },
  centerBlock: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pulseWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
  },
  pulseOrb: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.accent.ivory,
  },
  // The fast now-playing beat, close to the button — separate from pulseOrb
  // so the quick 1.8s rhythm stays a small confirmation near the button
  // rather than the thing traveling across the screen.
  pulseCoreGlow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.accent.ivory,
  },
  pulseCore: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.accent.ivory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCoreLabel: { color: colors.bg.base, fontFamily: fonts.medium, fontSize: fontSizes.sm },
  intent: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    textAlign: 'center',
    marginBottom: spacing[5],
    paddingHorizontal: spacing[4],
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  volumeLabel: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.sm },
  volumeSteps: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  volumeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.bg.border },
  volumeDotActive: { backgroundColor: colors.accent.ivory },
  timerSection: { alignItems: 'center', gap: spacing[3], marginBottom: spacing[8] },
  timerChipRow: { flexDirection: 'row', gap: spacing[2] },
  timerChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  timerChipActive: { borderColor: colors.accent.ivory },
  timerChipText: { color: colors.text.secondary, fontFamily: fonts.medium, fontSize: fontSizes.xs },
  timerChipTextActive: { color: colors.accent.ivory },
  timerCountdown: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs },
});
