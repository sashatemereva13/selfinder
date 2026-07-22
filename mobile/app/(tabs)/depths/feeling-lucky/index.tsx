import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, lineHeights } from '../../../../src/theme/typography';
import { spacing } from '../../../../src/theme/spacing';
import feelingLuckyList from '../../../../src/content/feelingLuckyList.json';
import { SaveMessageAction } from '../../../../src/components/SaveMessageAction';
import { track } from '../../../../src/utils/analytics';

// Drawn once per visit, deliberately — no reroll button. The whole idea is
// that whichever message shows up is the one meant to find you right now;
// letting people fish for a better one would undo that.
function pickMessage(): string {
  const entry = feelingLuckyList[Math.floor(Math.random() * feelingLuckyList.length)];
  return entry.message;
}

export default function FeelingLuckyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [message] = useState(pickMessage);

  useEffect(() => {
    track('feeling_lucky_viewed');
  }, []);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
    >
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Text style={styles.backLink}>← Back</Text>
      </Pressable>

      <View style={styles.messageWrap}>
        <Text style={styles.message}>{message}</Text>
      </View>

      <View style={styles.saveWrap}>
        <SaveMessageAction message={message} accentRgb={colors.brand.purpleRgb} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { flexGrow: 1, padding: spacing[6], paddingBottom: spacing[12] },
  backRow: { paddingBottom: spacing[4] },
  backLink: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.sm },
  messageWrap: { flex: 1, justifyContent: 'center', paddingVertical: spacing[8] },
  saveWrap: { alignItems: 'center' },
  message: {
    color: colors.text.primary,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.loose,
    textAlign: 'center',
  },
});
