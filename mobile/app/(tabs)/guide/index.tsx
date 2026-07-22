import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../src/theme/typography';
import { spacing, radius } from '../../../src/theme/spacing';
import { usePhilosopherStore } from '../../../src/store/philosopherStore';
import { useGuideChatStore } from '../../../src/store/guideChatStore';
import { useMeasureStore } from '../../../src/store/measureStore';
import { getNudgeState, getNudgeCopy } from '../../../src/content/guideNudges';
import { TypingDots } from '../../../src/components/TypingDots';
import { AmbientGlow } from '../../../src/components/AmbientGlow';

export default function GuideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const metPhilosopherIds = usePhilosopherStore((s) => s.metPhilosopherIds);
  const markMet = usePhilosopherStore((s) => s.markMet);
  const conversations = useGuideChatStore((s) => s.conversations);
  const isLoading = useGuideChatStore((s) => s.isLoading);
  const send = useGuideChatStore((s) => s.send);
  const clearConversation = useGuideChatStore((s) => s.clearConversation);
  const currentResult = useMeasureStore((s) => s.currentResult);
  const previousResult = useMeasureStore((s) => s.previousResult);

  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  // Snapshot "have I met this one before" per philosopher id, so markMet
  // (fired just below) doesn't swap the first-meeting text out from under
  // the user the instant it's marked as seen. Only frozen in the
  // false→true direction, though — an external reset (true→false, e.g. the
  // dev "Reset onboarding state" button) is reflected immediately, since
  // tab screens stay mounted and switching philosophers isn't guaranteed
  // to happen before you look again.
  const metSnapshotRef = useRef<{ id: string; hasMet: boolean } | null>(null);
  if (philosopher) {
    const actuallyMet = metPhilosopherIds.includes(philosopher.id);
    if (metSnapshotRef.current?.id !== philosopher.id || !actuallyMet) {
      metSnapshotRef.current = { id: philosopher.id, hasMet: actuallyMet };
    }
  }

  const messages = philosopher ? conversations[philosopher.id] ?? [] : [];
  const accentColor = philosopher?.color ?? colors.brand.purple;
  const nudge = getNudgeCopy(philosopher?.id ?? 'socrates', getNudgeState(currentResult, previousResult));

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, isLoading]);

  useEffect(() => {
    if (!philosopher || metPhilosopherIds.includes(philosopher.id)) return;
    markMet(philosopher.id);
  }, [philosopher?.id]);

  if (!philosopher) {
    return (
      <View style={[styles.root, styles.emptyRoot]}>
        <Text style={styles.emptyText}>Choose who walks beside you in the You tab to begin.</Text>
      </View>
    );
  }

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    send(philosopher, text);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + spacing[4] }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <AmbientGlow />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerMode}>{philosopher.mode}</Text>
          <Text style={[styles.headerName, { color: accentColor }]}>{philosopher.name}</Text>
        </View>
        {messages.length > 0 && (
          <Pressable onPress={() => clearConversation(philosopher.id)}>
            <Text style={styles.clearLink}>Clear</Text>
          </Pressable>
        )}
      </View>

      {metSnapshotRef.current?.hasMet && (
        <Pressable style={[styles.nudgeBanner, { borderColor: accentColor }]} onPress={() => router.push(nudge.route)}>
          <Text style={styles.nudgeText}>{nudge.text}</Text>
          <Text style={[styles.nudgeAction, { color: accentColor }]}>{nudge.actionLabel} →</Text>
        </Pressable>
      )}

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.greeting, { borderColor: accentColor }]}>
              {metSnapshotRef.current?.hasMet ? philosopher.greeting : philosopher.firstMeeting}
            </Text>
          </View>
        ) : (
          messages.map((message, i) => (
            <Bubble key={i} isUser={message.role === 'user'} color={accentColor}>
              {message.content}
            </Bubble>
          ))
        )}

        {isLoading && (
          <View style={[styles.bubble, styles.bubblePhilosopher, styles.typingBubble, { borderColor: accentColor }]}>
            <TypingDots />
          </View>
        )}
      </ScrollView>

      <View style={styles.compose}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Say what's true right now…"
            placeholderTextColor={colors.text.muted}
            multiline
            editable={!isLoading}
          />
          <Pressable
            style={[styles.sendButton, { backgroundColor: accentColor, opacity: input.trim() && !isLoading ? 1 : 0.4 }]}
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>↑</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ children, color, isUser }: { children: string; color: string; isUser: boolean }) {
  return (
    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubblePhilosopher, !isUser && { borderColor: color }]}>
      <Text style={styles.bubbleText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  emptyRoot: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[6] },
  emptyText: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    textAlign: 'center',
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  headerMode: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  headerName: { fontFamily: fonts.medium, fontSize: fontSizes.lg, marginTop: spacing[1] },
  clearLink: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.sm, marginTop: spacing[2] },
  nudgeBanner: {
    marginHorizontal: spacing[5],
    marginBottom: spacing[3],
    padding: spacing[4],
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.bg.elevated,
  },
  nudgeText: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  nudgeAction: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    marginTop: spacing[2],
  },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    gap: spacing[3],
  },
  emptyState: { paddingVertical: spacing[8] },
  greeting: {
    color: colors.text.primary,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    paddingLeft: spacing[4],
    borderLeftWidth: 2,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[2],
  },
  bubblePhilosopher: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.bg.surface,
  },
  bubbleText: {
    color: colors.text.primary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  typingBubble: { minWidth: 52, paddingVertical: spacing[4] },
  compose: { paddingHorizontal: spacing[5], paddingBottom: spacing[2] },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2] },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    backgroundColor: colors.bg.elevated,
    color: colors.text.primary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: { color: colors.bg.base, fontFamily: fonts.medium, fontSize: fontSizes.lg },
});
