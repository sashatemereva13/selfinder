import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useReadingColumnWidth } from '../../../src/theme/responsive';
import { usePhilosopherStore } from '../../../src/store/philosopherStore';
import { useGuideChatStore } from '../../../src/store/guideChatStore';
import { useMeasureStore } from '../../../src/store/measureStore';
import { useEngagementStore } from '../../../src/store/engagementStore';
import { useAppAccentRgb } from '../../../src/utils/appAccent';
import { getNudgeState, getNudgeCopy } from '../../../src/content/guideNudges';
import { TypingDots } from '../../../src/components/TypingDots';
import { AmbientGlow } from '../../../src/components/AmbientGlow';
import { track } from '../../../src/utils/analytics';

export default function GuideScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const columnWidth = useReadingColumnWidth();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const metPhilosopherIds = usePhilosopherStore((s) => s.metPhilosopherIds);
  const markMet = usePhilosopherStore((s) => s.markMet);
  const conversations = useGuideChatStore((s) => s.conversations);
  const isLoading = useGuideChatStore((s) => s.isLoading);
  const send = useGuideChatStore((s) => s.send);
  const clearConversation = useGuideChatStore((s) => s.clearConversation);
  const currentResult = useMeasureStore((s) => s.currentResult);
  const previousResult = useMeasureStore((s) => s.previousResult);
  const totalMeasureCount = useEngagementStore((s) => s.totalMeasureCount);
  const hasShownSecondVisit = useEngagementStore((s) => s.hasShownSecondVisit);
  const isNewVisitSinceLastOpen = useEngagementStore((s) => s.isNewVisitSinceLastOpen);
  const markSecondVisitShown = useEngagementStore((s) => s.markSecondVisitShown);

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

  // Computed once per mount, not re-derived — otherwise calling
  // markSecondVisitShown() below would flip hasShownSecondVisit mid-session
  // and swap the special line back out to the routine greeting the instant
  // it appeared, the same flicker metSnapshotRef exists to avoid above.
  const secondVisitSnapshotRef = useRef<boolean | null>(null);
  if (secondVisitSnapshotRef.current === null) {
    secondVisitSnapshotRef.current = Boolean(
      metSnapshotRef.current?.hasMet &&
        totalMeasureCount === 1 &&
        !hasShownSecondVisit &&
        isNewVisitSinceLastOpen
    );
  }
  const showSecondVisit = secondVisitSnapshotRef.current;

  useEffect(() => {
    if (showSecondVisit) markSecondVisitShown();
  }, [showSecondVisit]);

  const messages = philosopher ? conversations[philosopher.id] ?? [] : [];
  const accentRgb = useAppAccentRgb();
  const accentColor = `rgb(${accentRgb})`;
  const nudge = getNudgeCopy(philosopher?.id ?? 'socrates', getNudgeState(currentResult, previousResult));

  // Was a useEffect keyed on messages.length/isLoading, calling
  // scrollToEnd directly — that fires the instant React commits the new
  // message to the JS side, which can still be a layout pass ahead of the
  // ScrollView's content actually growing to its new height. scrollToEnd
  // then computes its offset against the OLD (shorter) content size, so it
  // lands just short of the newly-sent message instead of showing it — the
  // message is genuinely there and correctly rendered, it's just sitting
  // just below the visible fold until something else (the reply arriving,
  // shifting layout again) happens to scroll far enough to reveal it. That's
  // the reported "my own message only appears once the philosopher replies"
  // bug. onContentSizeChange fires once the ScrollView's content has
  // actually finished laying out at its new size, so scrolling here is
  // guaranteed to already account for the message that was just added.
  const handleContentSizeChange = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    if (!philosopher || metPhilosopherIds.includes(philosopher.id)) return;
    markMet(philosopher.id);
    track('guide_first_meeting_shown');
  }, [philosopher?.id]);

  if (!philosopher) {
    return (
      <View style={[styles.root, styles.emptyRoot]}>
        <Text style={styles.emptyText}>{t('guide.chooseSomeone')}</Text>
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
      // Same fix as interview.tsx — 'undefined' on Android meant no
      // keyboard avoidance ran at all, the keyboard just overlaid the
      // conversation. 'height' is the standard Android equivalent to
      // iOS's 'padding'. No keyboardVerticalOffset — no fixed header on
      // this screen (headerShown: false on the Tabs navigator), so a
      // manual offset just left a visible gap above the keyboard on both
      // platforms (confirmed on-device).
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AmbientGlow />

      <View style={[styles.header, { width: columnWidth, alignSelf: 'center' }]}>
        <View>
          <Text style={styles.headerMode}>{philosopher.mode}</Text>
          <Text style={[styles.headerName, { color: accentColor }]}>{philosopher.name}</Text>
        </View>
        {messages.length > 0 && (
          <Pressable onPress={() => clearConversation(philosopher.id)}>
            <Text style={styles.clearLink}>{t('guide.clear')}</Text>
          </Pressable>
        )}
      </View>

      {metSnapshotRef.current?.hasMet && (
        <Pressable
          style={[styles.nudgeBanner, { width: columnWidth, alignSelf: 'center' }]}
          onPress={() => router.push(nudge.route)}
        >
          <Text style={styles.nudgeText}>{nudge.text}</Text>
          <Text style={[styles.nudgeAction, { color: accentColor }]}>{nudge.actionLabel} →</Text>
        </Pressable>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { width: columnWidth, alignSelf: 'center' }]}
        onContentSizeChange={handleContentSizeChange}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.greeting}>
              {showSecondVisit
                ? philosopher.secondVisitGreeting
                : metSnapshotRef.current?.hasMet
                  ? philosopher.greeting
                  : philosopher.firstMeeting}
            </Text>
            {/* "Measure" is a proper noun in every philosopher's own voice
                above (each firstMeeting line namedrops it before a new user
                has any idea what it means) — this is the plain-language
                layer underneath that voice, saying outright what tapping
                the button actually does. Keyed off !currentResult, not
                hasMet: someone who's already measured with philosopher A
                and is now meeting philosopher B for the first time already
                knows what Measure is — but someone who's met a philosopher
                before without ever measuring still doesn't, so this has to
                stay tied to "have they ever actually done Measure," not
                "have they met this particular philosopher before." */}
            {!currentResult && (
              <Text style={styles.measureExplainer}>
                {t('guide.measureExplainer', { name: philosopher.name })}
              </Text>
            )}
            {!currentResult && (
              <Pressable
                style={[styles.measureCta, { backgroundColor: accentColor }]}
                onPress={() => router.push('/(tabs)/depths/measure')}
              >
                <Text style={styles.measureCtaText}>{t('guide.takeMeasure')}</Text>
              </Pressable>
            )}
          </View>
        ) : (
          messages.map((message, i) => (
            <View key={i}>
              <Turn isUser={message.role === 'user'}>{message.content}</Turn>
              {message.suggestSpill && i === messages.length - 1 && !isLoading && (
                <Pressable style={styles.spillCta} onPress={() => router.push('/(tabs)/depths/spill')}>
                  <Text style={styles.spillCtaText}>{t('guide.writeItOutInstead')}</Text>
                </Pressable>
              )}
            </View>
          ))
        )}

        {isLoading && (
          <View style={styles.typingRow}>
            <TypingDots />
          </View>
        )}
      </ScrollView>

      <View style={[styles.compose, { width: columnWidth, alignSelf: 'center' }]}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={t('guide.inputPlaceholder')}
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

// No bubble shape, no card — a conversation with a philosopher reads closer
// to a transcript or a book dialogue than a messenger thread. Turn-taking
// still needs to be instantly legible without a border/fill doing that job,
// so it's carried by alignment (philosopher left, you right) and color
// (philosopher in primary text, you in secondary) instead — same register
// the rest of the app uses to differentiate voice (e.g. the greeting's
// italic vs. plain-line pairing).
function Turn({ children, isUser }: { children: string; isUser: boolean }) {
  return (
    <Text style={[styles.turnText, isUser ? styles.turnUser : styles.turnPhilosopher]}>
      {children}
    </Text>
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
  // No border, no fill — plain text with spacing, same register as
  // Depths' discoveryNudge. The tap affordance is the accent-colored
  // action line beneath it, not a bordered box around the whole thing.
  nudgeBanner: {
    marginHorizontal: spacing[5],
    marginBottom: spacing[4],
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
    gap: spacing[4],
  },
  emptyState: { paddingVertical: spacing[8] },
  // No border-bar — italic already carries "this is the philosopher's own
  // voice" (same pairing used everywhere else in the app: an italic line,
  // then a plain one underneath for anything that needs explaining), so a
  // drawn rule beside it was a redundant second signal for the same thing.
  greeting: {
    color: colors.text.primary,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
  },
  // Quiet and unitalicized, sitting apart from the philosopher's own voice
  // above it — plain information, not character.
  measureExplainer: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    marginTop: spacing[3],
  },
  // Filled pill, not outlined — matches the confirm button on the
  // philosopher picker and every other primary action in the app; an
  // outlined CTA was the odd one out, not the established pattern.
  measureCta: {
    alignSelf: 'flex-start',
    marginTop: spacing[5],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: radius.full,
  },
  measureCtaText: {
    color: colors.bg.base,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
  },
  spillCta: {
    alignSelf: 'flex-start',
    marginTop: spacing[1],
    marginBottom: spacing[2],
  },
  spillCtaText: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
  },
  // Turn-taking carried by alignment and color, not a bubble shape — the
  // philosopher's words sit left in the app's primary text tone (the
  // "someone is speaking to you" register everywhere else uses), yours
  // sit right in a more muted tone, closer to how a transcript or a book's
  // dialogue distinguishes speakers than a messenger's two-tone bubbles.
  turnText: {
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.chat,
    maxWidth: '88%',
  },
  turnPhilosopher: {
    alignSelf: 'flex-start',
    color: colors.text.primary,
    textAlign: 'left',
  },
  turnUser: {
    alignSelf: 'flex-end',
    color: colors.text.secondary,
    textAlign: 'right',
  },
  typingRow: { alignSelf: 'flex-start', paddingVertical: spacing[2] },
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
    fontSize: fontSizes.sm,
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
