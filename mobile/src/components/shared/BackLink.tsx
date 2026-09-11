import { Pressable, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../../theme/useThemeColors';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';

// The "← Back" link's own style and default behavior — copy-pasted
// verbatim (byte-identical backLink style, same t('common.back') text)
// into 17 route files plus JourneyScreenShell before this extraction. The
// visual consistency this produced was already real (the same style
// object, not just similar screens), so this component changes nothing
// about how it looks — it just gives the one thing every call site
// already agreed on a single home, so a future tweak doesn't need to be
// repeated 18 times to stay consistent.
//
// Deliberately does NOT own the wrapping "backRow" View — each screen's
// own padding around this link comes from that screen's broader layout
// (some pad the row itself, others rely on an outer content padding), and
// that varies for real, non-duplicated reasons from screen to screen.
// Consolidating the link's own style/text/default action here, while
// leaving each screen free to wrap it however its own layout needs, is
// the boundary that doesn't fight any screen's real layout decisions.
interface BackLinkProps {
  // Almost every screen just wants router.back() — the couple that need
  // something else (crisis-support.tsx replaces to Depths rather than
  // returning to a screen someone may not want to land back on) pass
  // their own handler instead of forcing a workaround into this
  // component's own default.
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function BackLink({ onPress, style }: BackLinkProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = makeStyles(colors);

  return (
    <Pressable
      style={style}
      onPress={onPress ?? (() => router.back())}
      accessibilityRole="button"
    >
      <Text style={styles.backLink}>{t('common.back')}</Text>
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    backLink: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
  });
}
