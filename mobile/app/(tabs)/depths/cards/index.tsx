import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useThemeColors } from '../../../../src/theme/useThemeColors';
import { useThemeStore } from '../../../../src/store/themeStore';
import type { Colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, lineHeights, letterSpacings } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { AnimatedCardSymbol } from '../../../../src/components/AnimatedCardSymbol';
import { CARDS_DECK, CardEntry, drawCard } from '../../../../src/content/cardsDeck';
import { SaveMessageAction } from '../../../../src/components/SaveMessageAction';
import { AmbientGlow } from '../../../../src/components/AmbientGlow';
import { track } from '../../../../src/utils/analytics';
import { usePhilosopherStore } from '../../../../src/store/philosopherStore';
import { useGuideChatStore } from '../../../../src/store/guideChatStore';
import { useSpillStore } from '../../../../src/store/spillStore';
import { useEngagementStore } from '../../../../src/store/engagementStore';
import { useLocaleStore } from '../../../../src/store/localeStore';

// A redraw needs to feel like a genuine new card, not a re-render — the
// old card dissolves first, there's a brief held beat of nothing (same
// "beat of stillness" idiom as Measure's scoring→Depths transition, just
// much shorter since this never leaves the screen), then the new symbol
// draws in fresh via AnimatedCardSymbol. Never a hard cut or cross-fade
// where both cards are visible at once.
const REDRAW_FADE_OUT_MS = 220;
const REDRAW_HOLD_MS = 160;

export default function CardsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Drawn once per visit, deliberately — same "no reroll" rule as Feeling
  // Lucky (see feeling-lucky/index.tsx): letting people fish for a
  // different card would turn the draw into a search for the "right"
  // answer, which is exactly what a random, non-inferential draw must not
  // become. See docs/cards-concept.md, "What it must never do."
  const [card, setCard] = useState<CardEntry>(() => drawCard());
  const [isRedrawing, setIsRedrawing] = useState(false);
  const cardOpacity = useSharedValue(1);
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const sendGuideMessage = useGuideChatStore((s) => s.send);
  const setSpillText = useSpillStore((s) => s.setText);
  const recordTalkAboutIt = useEngagementStore((s) => s.recordTalkAboutIt);

  useEffect(() => {
    track('cards_drawn', { card: card.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const name = card.name[locale] ?? card.name.en;
  const line = card.line[locale] ?? card.line.en;

  const handleDrawAgain = () => {
    if (isRedrawing) return;
    setIsRedrawing(true);
    cardOpacity.value = withTiming(0, { duration: REDRAW_FADE_OUT_MS, easing: Easing.in(Easing.quad) });
    setTimeout(() => {
      const next = drawCard();
      setCard(next);
      track('cards_drawn', { card: next.id });
      cardOpacity.value = withTiming(1, { duration: 200 });
      setIsRedrawing(false);
    }, REDRAW_FADE_OUT_MS + REDRAW_HOLD_MS);
  };

  const cardFadeStyle = useAnimatedStyle(() => ({ opacity: cardOpacity.value }));

  const handleTalkAboutIt = () => {
    if (!philosopher) return;
    track('cards_talk_about_it', { card: card.id });
    recordTalkAboutIt();
    sendGuideMessage(philosopher, t('cards.talkAboutItMessage', { name, line }));
    router.push('/(tabs)/guide');
  };

  const handleSpillAboutIt = () => {
    track('cards_spill_it', { card: card.id });
    // Spill always starts blank by design (see spillStore.ts / spill/write.tsx)
    // — there is no prefill mechanism, so this only seeds the free-writing
    // intent, not the text itself. Reset first so a stale draft from an
    // earlier Spill session doesn't leak in here.
    setSpillText('');
    router.push('/(tabs)/depths/spill');
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
    >
      {theme === 'dark' && <AmbientGlow />}

      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Text style={styles.backLink}>{t('common.back')}</Text>
      </Pressable>

      {/* The card itself — a bounded plane (colors.bg.elevated, the same
          token input fields and other raised surfaces already use, see
          docs/design/aesthetic.md) so it's unambiguous where the card
          ends and the next-step actions begin. The symbol is the largest
          element on the page; the line underneath is deliberately smaller
          and quieter than a first-time reader might expect — the artwork
          is the card, the words are a caption under it, not the other
          way around. */}
      <Animated.View style={[styles.cardPlane, cardFadeStyle]}>
        <View style={styles.symbolWrap}>
          <AnimatedCardSymbol id={card.id} rgb={card.rgb} size={240} />
        </View>

        <Text style={styles.kind}>{t(card.kind === 'statement' ? 'cards.receive' : 'cards.notice')}</Text>
        <Text style={[styles.name, { color: `rgb(${card.rgb})` }]}>{name}</Text>
        <Text style={styles.line}>{line}</Text>

        <View style={styles.saveWrap}>
          <SaveMessageAction message={line} accentRgb={card.rgb} />
        </View>
      </Animated.View>

      {/* Next steps, outside the card plane — Talk about it / Write about
          it are real, equally-weighted rows (same register as Depths'
          own next-step rows); Draw again is a quiet reset, not a peer
          option, so it drops to Feeling-Lucky's low-weight treatment
          behind its own divider — see docs/design/aesthetic.md, "rows
          with different jobs don't share a shelf just because they're
          nearby." */}
      <View style={styles.actionsWrap}>
        {philosopher && (
          <Pressable style={styles.actionRow} onPress={handleTalkAboutIt}>
            <Text style={styles.actionLabel}>{t('cards.talkAboutIt', { name: philosopher.name })}</Text>
          </Pressable>
        )}
        <Pressable style={styles.actionRow} onPress={handleSpillAboutIt}>
          <Text style={styles.actionLabel}>{t('cards.spillAboutIt')}</Text>
        </Pressable>
      </View>

      <View style={styles.drawAgainWrap}>
        <Text style={styles.drawAgainDivider}>· · ·</Text>
        <Pressable style={styles.drawAgainRow} onPress={handleDrawAgain}>
          <Text style={styles.drawAgainLabel}>{t('cards.backLabel')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { flexGrow: 1, padding: spacing[6], paddingBottom: spacing[12], alignItems: 'center' },
  backRow: { alignSelf: 'flex-start', paddingBottom: spacing[8] },
  backLink: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
  cardPlane: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.lg,
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[6],
  },
  symbolWrap: { marginBottom: spacing[6] },
  kind: {
    color: colors.text.faint,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.wide,
    textTransform: 'uppercase',
    marginBottom: spacing[2],
  },
  name: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    marginBottom: spacing[3],
  },
  line: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    textAlign: 'center',
    maxWidth: 280,
  },
  saveWrap: { alignItems: 'center', marginTop: spacing[6] },
  actionsWrap: { alignItems: 'center', marginTop: spacing[8], gap: spacing[3] },
  actionRow: { paddingVertical: spacing[3] },
  actionLabel: {
    color: colors.text.secondary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  drawAgainWrap: { alignItems: 'center', gap: spacing[3], marginTop: spacing[8] },
  drawAgainDivider: { color: colors.text.faint, fontSize: fontSizes.sm, letterSpacing: letterSpacings.wide },
  drawAgainRow: { paddingVertical: spacing[2] },
  drawAgainLabel: {
    color: colors.text.faint,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    textAlign: 'center',
  },
  });
}
