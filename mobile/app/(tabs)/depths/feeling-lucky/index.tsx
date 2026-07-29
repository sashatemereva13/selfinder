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
import { usePhilosopherStore } from '../../../../src/store/philosopherStore';
import { useGuideChatStore } from '../../../../src/store/guideChatStore';
import { useEngagementStore } from '../../../../src/store/engagementStore';

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
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const sendGuideMessage = useGuideChatStore((s) => s.send);
  const recordTalkAboutIt = useEngagementStore((s) => s.recordTalkAboutIt);

  useEffect(() => {
    track('feeling_lucky_viewed');
  }, []);

  const handleTalkAboutIt = () => {
    if (!philosopher) return;
    track('feeling_lucky_talk_about_it');
    recordTalkAboutIt();
    sendGuideMessage(philosopher, `This found me just now: "${message}" Can we talk about it?`);
    router.push('/(tabs)/guide');
  };

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
        <SaveMessageAction message={message} accentRgb={colors.accent.ivoryRgb} />
      </View>

      {philosopher && (
        <Pressable style={styles.talkLinkWrap} onPress={handleTalkAboutIt}>
          <Text style={styles.talkLink}>Talk to {philosopher.name} about it →</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { flexGrow: 1, padding: spacing[6], paddingBottom: spacing[12] },
  backRow: { paddingBottom: spacing[8] },
  backLink: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
  messageWrap: { flex: 1, justifyContent: 'center', paddingVertical: spacing[8] },
  saveWrap: { alignItems: 'center' },
  talkLinkWrap: { alignItems: 'center', marginTop: spacing[6] },
  talkLink: {
    color: colors.text.secondary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    textAlign: 'center',
  },
  message: {
    color: colors.text.primary,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.loose,
    textAlign: 'center',
  },
});
