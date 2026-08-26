import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { ReadingLogEntry } from '../../store/measureStore';
import { SavedConversation } from '../../api/conversation';
import { SavedSpillEntry } from '../../api/spill';
import { SavedMeasureResult } from '../../types';
import { ChatTurn } from '../ChatTurn';
import { getLocalizedLevelName } from '../../content/measureConfig';
import { Locale } from '../../store/localeStore';
import { makeSharedArcPageStyles } from './arcPageShared';

interface DetailPageProps {
  selected: ReadingLogEntry; // caller only mounts this page when truthy
  selectedRich: SavedMeasureResult | undefined;
  linkedConversation: SavedConversation | null;
  loadingConversation: boolean;
  linkedSpillEntry: SavedSpillEntry | undefined;
  hasSession: boolean;
  hasRichHistory: boolean;
  locale: Locale;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// The tapped point's own detail, inserted dynamically only once something's
// selected (2026-08-14 decision: "its own dedicated page," not a modal/
// overlay). Two tiers of detail depending on what data exists: the rich
// version (four spheres, the philosopher's reflection, the actual Q&A)
// only exists server-side, for a signed-in account with data-saving
// consent on. Without that, a tapped point still means something (the
// date, the level) — just not the full story, since that was never saved
// anywhere to recover. Never pretend detail exists that doesn't.
export function DetailPage({
  selected,
  selectedRich,
  linkedConversation,
  loadingConversation,
  linkedSpillEntry,
  hasSession,
  hasRichHistory,
  locale,
}: DetailPageProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const sharedStyles = useMemo(() => makeSharedArcPageStyles(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={sharedStyles.pageContent}>
      <Text style={styles.detailDate}>{formatDate(selected.ts)}</Text>
      {selectedRich ? (
        <>
          <Text style={styles.detailLevel}>
            {getLocalizedLevelName(selectedRich.vibrationLevel, locale)}
          </Text>
          {selectedRich.combinationMessage && (
            <Text style={styles.detailReflection}>{selectedRich.combinationMessage}</Text>
          )}

          {/* What you said — grouped by sphere, reusing AccountSection's own
              question/answer rendering pattern rather than inventing a
              second one. Purely descriptive — never captioned with what
              any of it means. */}
          {selectedRich.qaPairs.length > 0 && (
            <View style={styles.momentSection}>
              <Text style={styles.momentHeading}>{t('yourArc.whatYouSaid')}</Text>
              {selectedRich.qaPairs.map((pair, i) => (
                <View key={i} style={styles.momentQA}>
                  <Text style={styles.momentQuestion}>{pair.question}</Text>
                  <Text style={styles.momentAnswer}>{pair.answer}</Text>
                </View>
              ))}
            </View>
          )}

          {/* The conversation that followed, if one was saved (Selfinder+). */}
          {loadingConversation ? null : linkedConversation && (
            <View style={styles.momentSection}>
              <Text style={styles.momentHeading}>{t('yourArc.whatYouTalkedAbout')}</Text>
              {linkedConversation.messages.map((msg, i) => (
                <ChatTurn key={i} role={msg.role}>{msg.content}</ChatTurn>
              ))}
            </View>
          )}

          {/* A Spill entry kept close in time to this reading, if any. */}
          {linkedSpillEntry && (
            <View style={styles.momentSection}>
              <Text style={styles.momentHeading}>{t('yourArc.whatYouWrote')}</Text>
              <Text style={styles.momentSpillText}>{linkedSpillEntry.text}</Text>
            </View>
          )}
        </>
      ) : (
        <>
          <Text style={styles.detailLevel}>{selected.levelSlug}</Text>
          {hasSession && !hasRichHistory && (
            <Text style={styles.detailNote}>{t('yourArc.turnOnSavingNote')}</Text>
          )}
          {!hasSession && (
            <Text style={styles.detailNote}>{t('yourArc.signInToSaveNote')}</Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    detailDate: {
      color: colors.text.muted,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      textTransform: 'uppercase',
      letterSpacing: letterSpacings.wide,
    },
    detailLevel: {
      color: colors.text.primary,
      fontFamily: fonts.medium,
      fontSize: fontSizes.md,
      textTransform: 'capitalize',
    },
    detailReflection: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontStyle: 'italic',
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
      marginTop: spacing[1],
    },
    detailNote: {
      color: colors.text.muted,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      lineHeight: fontSizes.xs * lineHeights.normal,
      marginTop: spacing[1],
    },
    momentSection: { marginTop: spacing[5], gap: spacing[3] },
    momentHeading: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
    },
    momentQA: { gap: spacing[1] },
    momentQuestion: {
      color: colors.text.muted,
      fontFamily: fonts.light,
      fontStyle: 'italic',
      fontSize: fontSizes.xs,
      lineHeight: fontSizes.xs * lineHeights.normal,
    },
    momentAnswer: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
    },
    momentSpillText: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontStyle: 'italic',
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
    },
  });
}
