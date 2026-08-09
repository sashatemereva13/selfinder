import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, Platform, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Asset } from 'expo-asset';
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
import { useReadingColumnWidth } from '../../../../src/theme/responsive';
import { useLocaleStore } from '../../../../src/store/localeStore';
import { AmbientGlow } from '../../../../src/components/AmbientGlow';

// Lock-screen Now Playing artwork — without this, iOS shows a plain grey
// placeholder box while Tune In plays in the background. iOS-only: on
// Android, both Asset.fromModule's synchronous `.uri` (an internal
// `assets_tuneinartwork`-style scheme with no protocol) AND the resolved
// `.localUri` from `.downloadAsync()` reliably crashed the app the
// instant Play was pressed — confirmed twice via on-device adb logcat,
// including after switching to the (supposedly real file://) resolved
// localUri, which still surfaced the same native
// MalformedURLException("no protocol") deep in expo-audio's Kotlin
// Metadata parsing. The actual native asset-resolution path
// (expo-asset's Android downloadAsync, which is what's supposed to turn
// a bundled asset into a real file:// URI) isn't behaving as documented
// in this build. Since the original complaint was specifically about
// iOS's lock screen, and Android's lock screen still shows title/artist
// correctly without an image, this sidesteps the whole broken path
// rather than continuing to chase it for a cosmetic feature.
const tuneInArtworkReady =
  Platform.OS === 'ios'
    ? Asset.fromModule(require('../../../../assets/tunein-artwork.png')).downloadAsync()
    : null;

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
  // Defaults to the first timer option (5m) rather than "no timer" — the
  // lock screen's Now Playing progress bar reflects the actual looped
  // audio sample's own ~1s length, not the sleep timer, since expo-audio
  // has no way to override that from JS; always having a real timer
  // selected at least means the in-app countdown always shows a concrete,
  // sensible duration instead of implying "plays forever" by default.
  const [timerMinutes, setTimerMinutes] = useState<number | null>(TIMER_OPTIONS[0]);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const markDiscovered = useEngagementStore((s) => s.markDiscovered);
  const columnWidth = useReadingColumnWidth();
  // Real file:// URI once resolved, iOS only (see tuneInArtworkReady's own
  // comment for why Android never attempts this) — undefined until then,
  // so the lock screen just gets no artwork for the brief window before
  // this settles rather than a value that could crash the native layer.
  const [artworkUri, setArtworkUri] = useState<string | undefined>(undefined);

  useEffect(() => {
    markDiscovered('tuneIn');
    tuneInArtworkReady?.then((asset) => {
      if (asset.localUri) setArtworkUri(asset.localUri);
    });
  }, []);

  const players = [
    useAudioPlayer(TUNE_IN_STATES[0].asset),
    useAudioPlayer(TUNE_IN_STATES[1].asset),
    useAudioPlayer(TUNE_IN_STATES[2].asset),
  ];

  // Reflects each player's real native state — needed because pausing from
  // the lock screen's remote controls calls player.pause() natively,
  // entirely outside this component; the local isPlaying boolean below has
  // no way to learn about that on its own, which left the in-app button
  // stuck showing "Stop" after a lock-screen pause even though playback had
  // actually stopped. Three fixed calls (not a loop) since there are always
  // exactly three players — hooks can't be called a variable number of times.
  const statuses = [
    useAudioPlayerStatus(players[0]),
    useAudioPlayerStatus(players[1]),
    useAudioPlayerStatus(players[2]),
  ];

  // Syncs isPlaying down from the selected player's real native state —
  // catches the case where playback was paused via the lock screen's own
  // remote controls (an entirely native path that never touches this
  // component's state directly) so reopening the app shows "Play" instead
  // of a stale "Stop" for audio that has actually already paused.
  useEffect(() => {
    setIsPlaying(statuses[selected].playing);
  }, [statuses[selected].playing, selected]);

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

  // Resets the countdown, but keeps whichever timer duration was selected
  // (defaults to TIMER_OPTIONS[0], 5m) rather than clearing it to "no
  // timer" — so the chip and duration shown before pressing Play stay
  // consistent across a stop/restart instead of reverting to an
  // unselected state every time playback ends.
  const clearTimer = () => {
    setRemainingSeconds(null);
    players.forEach((player) => { player.volume = volume; });
  };

  const handleSelectTimer = (minutes: number) => {
    setTimerMinutes(minutes);
    if (isPlaying) setRemainingSeconds(minutes * 60);
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
        ...(artworkUri ? { artworkUrl: artworkUri } : null),
      });
      setIsPlaying(true);
      // Seeds the countdown from whichever timer is currently selected —
      // handleSelectTimer only sets it live while already playing, so
      // starting playback needs its own seed from the selected duration.
      if (timerMinutes !== null) setRemainingSeconds(timerMinutes * 60);
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
        ...(artworkUri ? { artworkUrl: artworkUri } : null),
      });
      track('tune_in_switched', { from: activeState.name, to: TUNE_IN_STATES[index].name });
    }
    setSelected(index);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[4] }]}>
      <AmbientGlow intensified={isPlaying} pulseDurationMs={isPlaying ? 1800 : 4200} />

      {/* Was a plain flex:1 View with no scroll — fine in English, where
          every string here is short enough that the fixed-height screen
          never actually overflowed. Russian's longer intro/intent copy
          and two-line state-picker wraps push the real content height
          past the screen, and a non-scrolling View doesn't clip or
          reflow that overflow the way a ScrollView does — it just lets
          later rows visually collide with earlier ones (reported: the
          Volume row overlapping the intent text above it). Matches the
          ScrollView pattern every other screen in the app already uses. */}
      <ScrollView
        style={{ width: columnWidth, alignSelf: 'center', flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
    flexGrow: 1,
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
  // flexWrap + a smaller gap (was spacing[6]/24px, fixed regardless of
  // content) — Russian state names ("Глубокий отдых", two words, longer
  // than any English name here) could push the row's natural width past
  // the screen on narrower phones, and a plain row with no wrap would
  // either overflow or get silently clipped rather than reflow. flex-item
  // width caps each label so long text wraps onto its own second line
  // instead of stretching the row wider.
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'center',
    gap: spacing[4],
  },
  pickerItem: { alignItems: 'center', paddingVertical: spacing[2], maxWidth: 110 },
  pickerName: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
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
