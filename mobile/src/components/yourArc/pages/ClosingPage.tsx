import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useThemeColors } from '../../../theme/useThemeColors';
import type { Colors } from '../../../theme/colors';
import { fonts, fontSizes, lineHeights } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import { ReadingLogEntry } from '../../../store/measureStore';
import { SavedWish } from '../../../api/wish';
import { makeSharedArcPageStyles } from './arcPageShared';

interface ClosingPageProps {
  activeWish: SavedWish | null; // read-only here
  latestReading: ReadingLogEntry; // caller only mounts this page when truthy
  latestLevelName: string | null;
  closingWriteSaved: boolean;
  closingWriteInput: string;
  setClosingWriteInput: (v: string) => void;
  closingWriteSubmitting: boolean;
  onSubmitClosingWrite: () => void;
  closingArrivalStyle: ReturnType<typeof useAnimatedStyle>;
  // Text-safe — this page's "Write it now" link is bare Text on the page
  // background (no fill).
  accentTextRgb: string;
  // 2026-09-13, at the user's own request — this page is the true end of
  // the future pager (synthesis of the latest reading + wish already
  // done), and until now offered nothing beyond a private free-write:
  // every page in both of Your Arc's pagers only ever read history or
  // held private material, none of them routed anywhere that DOES
  // something new (unlike Depths, whose own reveal always offers
  // Measure again/Talk about it as real next steps). This is that gap's
  // first fix — a single, focused next step (not a full menu, per the
  // user's own choice) pointing at Journeys, chosen specifically because
  // Journeys' own content (an "arrived" answer from a completed Journey)
  // is exactly the kind of forward-looking material this closing beat
  // is already synthesizing toward.
  onExploreJourney: () => void;
}

// The closing page (docs/your-arc-expansion-plan.md, Thread 2). Positioned
// as the true last static page in the pager, before the dynamically-
// appended Detail page. Three parts, in the phenomenological voice Thread
// 1 already settled for the cone (retention/protention, "held," never a
// verdict): a synthesis line naming that the latest reading and the
// active wish are both still held right now, together; the structural "a
// need exists" line; and one small optional act, a single free-text
// prompt saved as a real Spill entry only if the person chooses to keep
// it — never scored, never reflected back by the app.
//
// 2026-09-13 — this page used to also offer its own "name a wish" button
// (closingWishInvite, wired to WishCrossingPage's own composer via
// wishComposerOpen/setWishComposerOpen) when no active wish existed.
// Removed at the user's own request: WishCrossingPage already owns this
// action as its whole job (its own header comment: "the ACTIVE wish,
// standing on its own"), and offering a second, differently-worded
// invite to the same action here — encountered right after the first
// one on a normal swipe-through with no wish yet — read as the app
// repeating itself rather than two considered separate moments. The
// synthesis/need lines below already name the gap in the reflective
// voice this page is actually for; a live action button duplicating
// another page's own job doesn't need to sit alongside them.
export function ClosingPage({
  activeWish,
  latestLevelName,
  closingWriteSaved,
  closingWriteInput,
  setClosingWriteInput,
  closingWriteSubmitting,
  onSubmitClosingWrite,
  closingArrivalStyle,
  accentTextRgb,
  onExploreJourney,
}: ClosingPageProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const sharedStyles = useMemo(() => makeSharedArcPageStyles(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={sharedStyles.pageCentered}>
      {/* Arrival beat — closingArrivalStyle animates scale+opacity each
          time the pager's active page becomes this one (see the parent's
          own closingArrivalToken comment for why a mount effect alone
          can't do this, since every pager page stays mounted). */}
      <Animated.View style={closingArrivalStyle}>
        <Text style={styles.closingSynthesis}>
          {activeWish
            ? t('yourArc.closingSynthesisWithWish', { level: latestLevelName, wish: activeWish.text })
            : t('yourArc.closingSynthesisNoWish', { level: latestLevelName })}
        </Text>
        <Text style={styles.closingNeedLine}>{t('yourArc.closingNeedLine')}</Text>
        {closingWriteSaved ? (
          <Text style={styles.closingWriteSavedText}>{t('yourArc.closingWriteSaved')}</Text>
        ) : (
          <View style={styles.closingWriteSection}>
            <Text style={styles.closingPrompt}>{t('yourArc.closingPrompt')}</Text>
            <TextInput
              style={styles.closingWriteInput}
              value={closingWriteInput}
              onChangeText={setClosingWriteInput}
              placeholder={t('yourArc.closingPromptPlaceholder')}
              placeholderTextColor={colors.text.muted}
              multiline
              editable={!closingWriteSubmitting}
            />
            <Pressable
              style={[
                styles.closingWriteButton,
                { opacity: closingWriteInput.trim() && !closingWriteSubmitting ? 1 : 0.4 },
              ]}
              onPress={onSubmitClosingWrite}
              disabled={!closingWriteInput.trim() || closingWriteSubmitting}
            >
              <Text style={[styles.closingWriteButtonText, { color: `rgb(${accentTextRgb})` }]}>
                {t('yourArc.closingWriteButton')}
              </Text>
            </Pressable>
          </View>
        )}
        {/* 2026-09-13 — see this page's own onExploreJourney prop comment.
            Always visible here (not gated on closingWriteSaved) — this is
            a genuinely separate next step from the free-write above, not
            a follow-up to it, so it shouldn't wait on that action being
            taken or skipped first. Uses the shared nextStepRow register
            (arcPageShared.ts) — full label+description weight, not
            wishRow's quieter single line, per RULES.md's own "a next
            step meant to be genuinely adopted gets full row weight" rule. */}
        <Pressable
          style={[sharedStyles.nextStepRow, styles.exploreJourneySpacing]}
          onPress={onExploreJourney}
        >
          <Text style={[sharedStyles.nextStepLabel, styles.exploreJourneyText]}>
            {t('yourArc.closingExploreJourney')}
          </Text>
          <Text style={[sharedStyles.nextStepDescription, styles.exploreJourneyText]}>
            {t('yourArc.closingExploreJourneyDescription')}
          </Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    // 2026-08-29: bumped from md to lg — this is the pager's closing,
    // emotional-peak line, and at md it sat only 1pt above its own
    // closingNeedLine (sm) directly below, reading as barely more
    // prominent than its own supporting text. lg gives it real separation
    // while every other page's headline (level name, cone summary) stays
    // at md, since those sit alongside more surrounding content and don't
    // need to carry a whole page's arrival beat alone the way this does.
    closingSynthesis: {
      color: colors.text.primary,
      fontFamily: fonts.light,
      fontSize: fontSizes.lg,
      lineHeight: fontSizes.lg * lineHeights.normal,
      textAlign: 'center',
    },
    closingNeedLine: {
      color: colors.text.secondary,
      fontFamily: fonts.voice,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
      textAlign: 'center',
      marginTop: spacing[5],
      paddingHorizontal: spacing[4],
    },
    closingWriteSection: { width: '100%', marginTop: spacing[8], alignItems: 'center' },
    closingPrompt: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      textAlign: 'center',
      marginBottom: spacing[3],
    },
    closingWriteInput: {
      width: '100%',
      minHeight: 80,
      borderRadius: radius.md,
      backgroundColor: colors.bg.elevated,
      color: colors.text.primary,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
    },
    closingWriteButton: { alignSelf: 'center', marginTop: spacing[3], paddingVertical: spacing[1] },
    // Color set per-instance via accentTextRgb (see call site) rather than
    // a fixed token — this is the pager's actual CTA, so it takes the same
    // reading-aware accent FactsPage's Center row and WishCrossingPage's
    // send buttons already use, instead of the plain text.primary that
    // made it visually indistinguishable from a static body sentence.
    closingWriteButtonText: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.sm,
    },
    closingWriteSavedText: {
      color: colors.text.muted,
      fontFamily: fonts.voice,
      fontSize: fontSizes.sm,
      textAlign: 'center',
      marginTop: spacing[8],
    },
    // sharedStyles.nextStepRow has no top margin of its own (other
    // callers may sit at the top of their own section) — this page needs
    // real separation from the free-write section above it.
    exploreJourneySpacing: { marginTop: spacing[8], alignItems: 'center' },
    exploreJourneyText: { textAlign: 'center' },
  });
}
