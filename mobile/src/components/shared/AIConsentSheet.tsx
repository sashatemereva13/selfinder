import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useThemeColors } from '../../theme/useThemeColors';
import { hexToRgba } from '../../theme/colors';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes, lineHeights } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { useReadingColumnWidth } from '../../theme/responsive';
import { useAIDisclosureStore } from '../../store/aiDisclosureStore';
import { PRIVACY_POLICY_URL } from '../../utils/privacyPolicy';

// Raised by ensureAIConsent() the first time someone's own words are about
// to leave the device for the AI provider — a message to their
// philosopher, Measure's "Begin", a Journey answer (see
// aiDisclosureStore.ts). Mounted once at the root layout, so it rises over
// whatever screen asked. A small panel from the bottom rather than the
// full-screen notice it replaced (2026-09-26): it only exists for the one
// moment it's relevant, and "Continue" carries straight on into what the
// person was already doing. "Not now" cancels just that action — nothing
// is sent, and the question comes back the next time they try.
export function AIConsentSheet() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const columnWidth = useReadingColumnWidth();
  const pending = useAIDisclosureStore((s) => s.pending);
  const respond = useAIDisclosureStore((s) => s.respond);

  // Always mounted (see _layout.tsx) with only its contents toggled —
  // Reanimated's exiting animations run when the animated view itself is
  // removed, not when an ancestor is, so unmounting the whole component
  // would cut the slide-down short.
  return (
    <View style={styles.root} pointerEvents="box-none">
      {pending && (
        <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(200)} style={StyleSheet.absoluteFill}>
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: hexToRgba(colors.bg.base, 0.7) }]}
            onPress={() => respond(false)}
            accessibilityLabel={t('aiDisclosure.notNow')}
          />
        </Animated.View>
      )}
      {pending && (
        <Animated.View
          entering={SlideInDown.duration(350)}
          exiting={SlideOutDown.duration(250)}
          style={[styles.panel, { paddingBottom: insets.bottom + spacing[6] }]}
          accessibilityViewIsModal
        >
          <View style={[styles.content, { width: columnWidth }]}>
            <Text style={styles.body}>{t('aiDisclosure.body')}</Text>
            <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} accessibilityRole="link">
              <Text style={styles.linkText}>{t('account.readPrivacyPolicy')}</Text>
            </Pressable>
            <View style={styles.actions}>
              <Pressable style={styles.button} onPress={() => respond(true)} accessibilityRole="button">
                <Text style={styles.buttonText}>{t('aiDisclosure.continue')}</Text>
              </Pressable>
              <Pressable onPress={() => respond(false)} accessibilityRole="button" hitSlop={spacing[3]}>
                <Text style={styles.notNowText}>{t('aiDisclosure.notNow')}</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: {
      ...StyleSheet.absoluteFill,
      zIndex: 100,
      justifyContent: 'flex-end',
    },
    // A hairline and the page's own background, not a filled card — it
    // reads as the bottom of the same evening, pulled up, rather than a
    // system dialog laid on top of it.
    panel: {
      backgroundColor: colors.bg.base,
      borderTopWidth: 1,
      borderTopColor: colors.bg.border,
      paddingTop: spacing[6],
    },
    content: {
      alignSelf: 'center',
      paddingHorizontal: spacing[6],
      gap: spacing[4],
    },
    body: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.loose,
    },
    linkText: {
      color: colors.text.muted,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[6],
      marginTop: spacing[2],
    },
    button: {
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[5],
      borderRadius: radius.full,
      backgroundColor: colors.accent.buttonFill,
    },
    buttonText: {
      color: colors.onAccent,
      fontFamily: fonts.medium,
      fontSize: fontSizes.sm,
    },
    notNowText: {
      color: colors.text.muted,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
    },
  });
}
