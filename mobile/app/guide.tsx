import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/theme/useThemeColors';
import { useThemeStore } from '../src/store/themeStore';
import type { Colors } from '../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../src/theme/typography';
import { spacing, radius } from '../src/theme/spacing';
import { useWideColumnWidth, useIsLargeScreen } from '../src/theme/responsive';
import { usePhilosopherStore } from '../src/store/philosopherStore';
import { useGuideChatStore } from '../src/store/guideChatStore';
import { useMeasureStore } from '../src/store/measureStore';
import { useEngagementStore } from '../src/store/engagementStore';
import { CrisisLine } from '../src/components/shared/CrisisLine';
import { useAppAccentTextRgb, useAppAccentButtonRgb } from '../src/utils/appAccent';
import { TypingDots } from '../src/components/shared/TypingDots';
import { AmbientGlow } from '../src/components/shared/AmbientGlow';
import { BackLink } from '../src/components/shared/BackLink';
import { ensureAIConsent } from '../src/store/aiDisclosureStore';
import { useLocaleStore } from '../src/store/localeStore';
import { formatDate } from '../src/utils/relativeTime';
import { track } from '../src/utils/analytics';

export default function GuideScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const columnWidth = useWideColumnWidth();
  const isLargeScreen = useIsLargeScreen();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const metPhilosopherIds = usePhilosopherStore((s) => s.metPhilosopherIds);
  const markMet = usePhilosopherStore((s) => s.markMet);
  const conversations = useGuideChatStore((s) => s.conversations);
  const isLoading = useGuideChatStore((s) => s.isLoading);
  const send = useGuideChatStore((s) => s.send);
  const clearConversation = useGuideChatStore((s) => s.clearConversation);
  const flushPendingSave = useGuideChatStore((s) => s.flushPendingSave);
  const currentResult = useMeasureStore((s) => s.currentResult);
  const totalMeasureCount = useEngagementStore((s) => s.totalMeasureCount);
  const hasShownSecondVisit = useEngagementStore((s) => s.hasShownSecondVisit);
  const isNewVisitSinceLastOpen = useEngagementStore((s) => s.isNewVisitSinceLastOpen);
  const markSecondVisitShown = useEngagementStore((s) => s.markSecondVisitShown);
  const markTalkedAbout = useEngagementStore((s) => s.markTalkedAbout);
  const locale = useLocaleStore((s) => s.locale);

  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  // Snapshot "have I met this one before" per philosopher id, so markMet
  // (fired just below) doesn't swap the first-meeting text out from under
  // the user the instant it's marked as seen. Only frozen in the
  // false→true direction, though — an external reset (true→false, e.g.
  // resetMet firing on sign-out, see authStore.ts) is reflected
  // immediately, since tab screens stay mounted and switching
  // philosophers isn't guaranteed to happen before you look again.
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

  // Best-effort save (Selfinder+) when leaving Guide — tab blur, not every
  // message, since Groq replies already stream independently of
  // persistence. Reads the current philosopher fresh in the cleanup rather
  // than closing over the outer `philosopher`, since a blur can happen
  // after switching philosophers mid-visit.
  useFocusEffect(
    useCallback(() => {
      return () => {
        const current = usePhilosopherStore.getState().philosopher;
        if (current) flushPendingSave(current.id);
      };
    }, [flushPendingSave])
  );

  const messages = philosopher ? conversations[philosopher.id] ?? [] : [];
  const lastCrisisIndex = messages.map((m) => !!m.crisis).lastIndexOf(true);
  // Text-safe — every use in this file colors real Text (the philosopher's
  // name).
  const accentRgb = useAppAccentTextRgb();
  const accentColor = `rgb(${accentRgb})`;
  const accentButtonColor = `rgb(${useAppAccentButtonRgb()})`;

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

  // Consent before the box is cleared, so "Not now" leaves what they wrote
  // where it was (the store asks again itself, harmlessly, once granted).
  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    if (!(await ensureAIConsent())) return;
    setInput('');
    send(philosopher, text);
    // Saying something about today's reading is what moves the
    // philosopher's step on to the Shift offer — opening the conversation
    // alone doesn't (docs/shift-concept.md, §2).
    // The reading's reflection in the conversation, or its details as
    // context (a reading with no reflection joins as context only).
    const aboutReading =
      messages.some((m) => m.readingAt === currentResult?.savedAt) ||
      !!useGuideChatStore.getState().readingContext[philosopher.id];
    if (currentResult && aboutReading) {
      markTalkedAbout(currentResult.savedAt);
    }
  };

  // Guide is always opened on top of something since onboarding stopped
  // landing here (2026-09-26) — but a cold deep link could still arrive
  // with nothing underneath, so fall back to Depths rather than a dead end.
  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/depths');
  };

  // The plain "what Measure is" layer plus its button, for anyone who
  // hasn't measured yet — shown under the greeting on an empty
  // conversation, and under the philosopher's opening line from
  // onboarding's meet step until the person has said anything themselves.
  const showMeasureIntro = !currentResult && !messages.some((m) => m.role === 'user');
  const measureIntro = showMeasureIntro ? (
    <View>
      <Text style={styles.measureExplainer}>
        {t('guide.measureExplainer', { name: philosopher.name })}
      </Text>
      <Pressable
        style={[styles.measureCta, { backgroundColor: accentButtonColor }]}
        onPress={() => router.push('/(tabs)/depths/measure')}
      >
        <Text style={styles.measureCtaText}>{t('guide.takeMeasure')}</Text>
      </Pressable>
    </View>
  ) : null;

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
      {theme === 'dark' && <AmbientGlow />}

      <BackLink onPress={handleBack} style={[styles.backRow, { width: columnWidth, alignSelf: 'center' }]} />

      <View style={[styles.header, { width: columnWidth, alignSelf: 'center' }]}>
        <View>
          <Text style={styles.headerMode}>{philosopher.mode}</Text>
          <Text style={[styles.headerName, { color: accentColor }]}>{philosopher.name}</Text>
        </View>
        <View style={styles.headerSide}>
          {messages.length > 0 && (
            <Pressable onPress={() => clearConversation(philosopher.id)}>
              <Text style={styles.clearLink}>{t('guide.clear')}</Text>
            </Pressable>
          )}
          {/* Always there, so no one has to say the right words first
              (crisis safety net, 2026-10-10). */}
          <CrisisLine kind="help" />
        </View>
      </View>

      {/* The discovery nudge banner that sat here (Levels / Tune In /
          Measure again) was removed 2026-10-08: a second "what next"
          beside the philosopher's one step, pointing at an outdated path,
          pulling people out of the conversation. Its time-aware "measure
          again" lines moved into the step (depthsSeam.ts). */}

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { width: columnWidth, alignSelf: 'center' },
          // On phone, content always overflows the viewport, so flex-end
          // is a no-op — content just fills and scrolls. On a tablet, an
          // empty/short conversation is shorter than the screen, and
          // flex-end collapses it to the bottom edge, leaving the entire
          // upper portion of the screen empty. Centering the empty state
          // specifically (not the whole scroll content generally, which
          // should still anchor new messages toward the bottom once a
          // conversation exists) fixes that without changing phone layout.
          isLargeScreen && messages.length === 0 && styles.scrollContentCenteredEmpty,
        ]}
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
                has any idea what it means) — measureIntro is the plain-
                language layer underneath that voice. Keyed off whether
                they've ever actually measured, not whether they've met this
                philosopher: someone who's met one before without measuring
                still doesn't know what it is. */}
            {measureIntro}
          </View>
        ) : (
          <>
          {messages.map((message, i) => (
            <View key={i} style={isLargeScreen && styles.turnRowLargeScreen}>
              {message.readingAt && (
                <Text style={styles.readingLabel}>
                  {t('guide.afterYourReading', { date: formatDate(message.readingAt, locale) })}
                </Text>
              )}
              <Turn isUser={message.role === 'user'} styles={styles}>{message.content}</Turn>
              {/* Under the latest reply to words that said someone may be
                  in danger — once, not under every such reply. */}
              {message.crisis && i === lastCrisisIndex && <CrisisLine kind="crisis" style={styles.crisisLine} />}
              {message.suggestSpill && i === messages.length - 1 && !isLoading && (
                <Pressable style={styles.spillCta} onPress={() => router.push('/(tabs)/explore/spill')}>
                  <Text style={styles.spillCtaText}>{t('guide.writeItOutInstead')}</Text>
                </Pressable>
              )}
            </View>
          ))}
          {measureIntro}
          </>
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
            style={[styles.sendButton, { backgroundColor: accentButtonColor, opacity: input.trim() && !isLoading ? 1 : 0.4 }]}
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
function Turn({
  children,
  isUser,
  styles,
}: {
  children: string;
  isUser: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Text style={[styles.turnText, isUser ? styles.turnUser : styles.turnPhilosopher]}>
      {children}
    </Text>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  emptyRoot: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[6] },
  emptyText: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    textAlign: 'center',
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  backRow: { paddingHorizontal: spacing[5], marginBottom: spacing[3] },
  // Faint and plain — a date stamp on the record, not part of what the
  // philosopher said.
  readingLabel: {
    color: colors.text.faint,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    marginBottom: spacing[2],
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
  headerSide: { alignItems: 'flex-end', gap: spacing[2] },
  crisisLine: { marginTop: spacing[2], marginBottom: spacing[2] },
  clearLink: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.sm, marginTop: spacing[2] },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    gap: spacing[4],
  },
  // See the isLargeScreen && messages.length === 0 check above this style's
  // usage — only overrides justifyContent, so a real conversation on a
  // tablet still anchors to the bottom like it does on phone.
  scrollContentCenteredEmpty: { justifyContent: 'center' },
  emptyState: { paddingVertical: spacing[8] },
  // No border-bar — italic already carries "this is the philosopher's own
  // voice" (same pairing used everywhere else in the app: an italic line,
  // then a plain one underneath for anything that needs explaining), so a
  // drawn rule beside it was a redundant second signal for the same thing.
  greeting: {
    color: colors.text.primary,
    fontFamily: fonts.voice,
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
    color: colors.onAccent,
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
    letterSpacing: letterSpacings.body,
    maxWidth: '88%',
  },
  // A little extra room between turns on a tablet — the conversation
  // fills more of the available height without inventing new content,
  // the same way a book sets wider margins on a bigger page.
  turnRowLargeScreen: { marginBottom: spacing[2] },
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
  sendButtonText: { color: colors.onAccent, fontFamily: fonts.medium, fontSize: fontSizes.lg },
  });
}
