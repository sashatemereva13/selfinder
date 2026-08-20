import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors } from '../../../../src/theme/useThemeColors';
import { useThemeStore } from '../../../../src/store/themeStore';
import type { Colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { TUNE_IN_STATES, getLocalizedTuneInState } from '../../../../src/content/tuneInStates';
import { track } from '../../../../src/utils/analytics';
import { useEngagementStore } from '../../../../src/store/engagementStore';
import { useReadingColumnWidth } from '../../../../src/theme/responsive';
import { useLocaleStore } from '../../../../src/store/localeStore';
import { AmbientGlow } from '../../../../src/components/AmbientGlow';
import { tuneInArtworkReady } from '../../../../src/components/TuneInAudioController';
import { VOLUME_STEPS, TIMER_OPTIONS, players, useTuneInStore } from '../../../../src/store/tuneInStore';

// Tells the lock screen not to show a scrub bar/duration for Tune In's
// Now Playing entry. The underlying .m4a is a fixed-length loop (60s) with
// no relationship to how long a session actually runs — that's decided by
// the sleep timer, not the file — so a real progress bar would show the
// file looping every 60s regardless of the chosen timer, which reads as
// "the timer isn't doing anything." Seek is disabled for the same reason:
// skipping around inside one loop of an ambient tone has no meaningful
// destination.
const LOCK_SCREEN_OPTIONS = { isLiveStream: true, showSeekForward: false, showSeekBackward: false };

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

function Pulse({
  active,
  onPress,
  styles,
}: {
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
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
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Playback state and the players themselves live outside this screen (see
  // tuneInStore.ts and TuneInAudioController.tsx) so audio survives
  // navigating away from Tune In, not just backgrounding the whole app —
  // this screen only reads state and calls player methods imperatively.
  const selected = useTuneInStore((s) => s.selected);
  const isPlaying = useTuneInStore((s) => s.isPlaying);
  const volume = useTuneInStore((s) => s.volume);
  const timerMinutes = useTuneInStore((s) => s.timerMinutes);
  const remainingSeconds = useTuneInStore((s) => s.remainingSeconds);
  const setSelected = useTuneInStore((s) => s.setSelected);
  const setIsPlaying = useTuneInStore((s) => s.setIsPlaying);
  const setVolumeStore = useTuneInStore((s) => s.setVolume);
  const setTimerMinutes = useTuneInStore((s) => s.setTimerMinutes);
  const setRemainingSeconds = useTuneInStore((s) => s.setRemainingSeconds);
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

  const setVolume = (v: number) => {
    setVolumeStore(v);
    players.forEach((player) => { player.volume = v; });
  };

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
      players[selected].setActiveForLockScreen(
        true,
        {
          title: getLocalizedTuneInState(activeState, locale).name,
          artist: t('tuneIn.lockScreenArtist'),
          ...(artworkUri ? { artworkUrl: artworkUri } : null),
        },
        // The track itself loops on its own fixed length (60s), which has
        // nothing to do with how long this session actually plays — that's
        // governed entirely by the sleep timer above. Without isLiveStream,
        // iOS shows a scrub bar/progress tied to the 60s file and loops it,
        // which reads as "the timer isn't working" (reported: lock screen
        // duration didn't match the chosen timer) even though the timer's
        // own setTimeout loop is stopping playback correctly the whole
        // time — the lock screen was just never told the real semantics.
        LOCK_SCREEN_OPTIONS
      );
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
      players[index].setActiveForLockScreen(
        true,
        {
          title: getLocalizedTuneInState(TUNE_IN_STATES[index], locale).name,
          artist: t('tuneIn.lockScreenArtist'),
          ...(artworkUri ? { artworkUrl: artworkUri } : null),
        },
        LOCK_SCREEN_OPTIONS
      );
      track('tune_in_switched', { from: activeState.name, to: TUNE_IN_STATES[index].name });
    }
    setSelected(index);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[4] }]}>
      {theme === 'dark' && (
        <AmbientGlow intensified={isPlaying} pulseDurationMs={isPlaying ? 1800 : 4200} />
      )}

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
          <Pulse active={isPlaying} onPress={handleToggle} styles={styles} />
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

function makeStyles(colors: Colors) {
  return StyleSheet.create({
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
  // 140, not the original 110 — measured "Спокойствие" (Calm's Russian
  // name, one word, no natural break point) at 133px wide at the active
  // font size (fontSizes.base/16), so 110 forced it to wrap mid-word
  // every time it was selected, which reads as broken rather than a
  // deliberate two-line label the way "Глубокий отдых" (two words, wraps
  // cleanly between them) does. 140 comfortably fits the one-word case
  // with a small margin; two-word labels still wrap normally under it —
  // flexWrap on the row above reflows to a second row on narrow phones
  // if three 140-wide items don't fit on one line, rather than needing a
  // tighter per-item cap to force that.
  pickerItem: { alignItems: 'center', paddingVertical: spacing[2], maxWidth: 140 },
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
    backgroundColor: colors.accent.buttonFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCoreLabel: { color: colors.onAccent, fontFamily: fonts.medium, fontSize: fontSizes.sm },
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
}
