import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../../../src/theme/colors';
import { fonts, fontSizes } from '../../../../src/theme/typography';
import { spacing } from '../../../../src/theme/spacing';
import { useSpillStore } from '../../../../src/store/spillStore';
import { useAppAccentRgb } from '../../../../src/utils/appAccent';
import { track } from '../../../../src/utils/analytics';

const DURATION_MS = 60_000;
// Once time is up, don't cut a word off mid-typing — wait for the next
// space, but only for so long, in case they stop typing without ever
// finishing the word.
const GRACE_MS = 4_000;

export default function SpillWriteScreen() {
  const router = useRouter();
  const setSpillText = useSpillStore((s) => s.setText);
  const accentRgb = useAppAccentRgb();
  const accentColor = `rgb(${accentRgb})`;

  const [text, setText] = useState('');
  const textRef = useRef('');
  const finishingRef = useRef(false);
  const finishedRef = useRef(false);
  const progress = useSharedValue(0);

  const words = text.split(/\s+/);
  const activeWord = words[words.length - 1];

  const finish = (finalText: string) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setSpillText(finalText.trim());
    track('spill_completed');
    router.replace('/(tabs)/depths/spill/reveal');
  };

  useEffect(() => {
    progress.value = withTiming(1, { duration: DURATION_MS, easing: Easing.linear });

    let graceTimer: ReturnType<typeof setTimeout>;
    const endTimer = setTimeout(() => {
      finishingRef.current = true;
      graceTimer = setTimeout(() => finish(textRef.current), GRACE_MS);
    }, DURATION_MS);

    return () => {
      clearTimeout(endTimer);
      clearTimeout(graceTimer);
    };
  }, []);

  const handleChangeText = (newText: string) => {
    setText(newText);
    textRef.current = newText;
    if (finishingRef.current && /\s$/.test(newText)) {
      finish(newText);
    }
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.root}>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressStyle, { backgroundColor: accentColor }]} />
      </View>

      <View style={styles.wordWrap} pointerEvents="none">
        {activeWord.length > 0 && (
          <Animated.Text
            key={words.length}
            entering={FadeIn.duration(140)}
            exiting={FadeOut.duration(180)}
            style={[styles.word, { color: accentColor }]}
          >
            {activeWord}
          </Animated.Text>
        )}
      </View>

      <TextInput
        style={styles.hiddenInput}
        value={text}
        onChangeText={handleChangeText}
        autoFocus
        multiline
        caretHidden
        selectionColor="transparent"
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        contextMenuHidden
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  progressTrack: {
    height: 2,
    backgroundColor: colors.bg.border,
  },
  progressFill: {
    height: '100%',
  },
  wordWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  word: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xxl,
    textAlign: 'center',
  },
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    color: 'transparent',
    fontSize: fontSizes.base,
    padding: spacing[6],
  },
});
