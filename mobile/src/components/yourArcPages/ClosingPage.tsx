import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useThemeColors } from '../../theme/useThemeColors';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes, lineHeights } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { ReadingLogEntry } from '../../store/measureStore';
import { SavedWish } from '../../api/wish';
import { makeSharedArcPageStyles } from './arcPageShared';

interface ClosingPageProps {
  activeWish: SavedWish | null; // read-only here
  wishComposerOpen: boolean; // read-only here — gates the "invite a wish" row
  setWishComposerOpen: (open: boolean) => void; // write-only mutation (opens WishCrossingPage's composer)
  latestReading: ReadingLogEntry; // caller only mounts this page when truthy
  latestLevelName: string | null;
  closingWriteSaved: boolean;
  closingWriteInput: string;
  setClosingWriteInput: (v: string) => void;
  closingWriteSubmitting: boolean;
  onSubmitClosingWrite: () => void;
  closingArrivalStyle: ReturnType<typeof useAnimatedStyle>;
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
export function ClosingPage({
  activeWish,
  wishComposerOpen,
  setWishComposerOpen,
  latestLevelName,
  closingWriteSaved,
  closingWriteInput,
  setClosingWriteInput,
  closingWriteSubmitting,
  onSubmitClosingWrite,
  closingArrivalStyle,
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
        {!activeWish && !wishComposerOpen && (
          <Pressable style={styles.closingWishInvite} onPress={() => setWishComposerOpen(true)}>
            <Text style={styles.closingWishInviteText}>{t('yourArc.closingWishInvite')}</Text>
          </Pressable>
        )}
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
              <Text style={styles.closingWriteButtonText}>{t('yourArc.closingWriteButton')}</Text>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    closingSynthesis: {
      color: colors.text.primary,
      fontFamily: fonts.light,
      fontSize: fontSizes.md,
      lineHeight: fontSizes.md * lineHeights.normal,
      textAlign: 'center',
    },
    closingNeedLine: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontStyle: 'italic',
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
      textAlign: 'center',
      marginTop: spacing[5],
      paddingHorizontal: spacing[4],
    },
    closingWishInvite: { marginTop: spacing[5] },
    closingWishInviteText: {
      color: colors.text.muted,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      textAlign: 'center',
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
      borderWidth: 1,
      borderColor: colors.bg.border,
      backgroundColor: colors.bg.elevated,
      color: colors.text.primary,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
    },
    closingWriteButton: { alignSelf: 'center', marginTop: spacing[3], paddingVertical: spacing[1] },
    closingWriteButtonText: {
      color: colors.text.primary,
      fontFamily: fonts.medium,
      fontSize: fontSizes.sm,
    },
    closingWriteSavedText: {
      color: colors.text.muted,
      fontFamily: fonts.light,
      fontStyle: 'italic',
      fontSize: fontSizes.sm,
      textAlign: 'center',
      marginTop: spacing[8],
    },
  });
}
