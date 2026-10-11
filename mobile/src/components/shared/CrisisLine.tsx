import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../theme/useThemeColors';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

// The crisis safety net's quiet line (2026-10-10) — never an alarm, never a
// block, never a diagnosis; one line that opens the crisis screen.
// 'crisis': shown when someone's words said they may be in danger.
// 'heavy': shown with the heavy states' readings (shame, guilt, apathy,
// grief) whatever was said — about how heavy they can feel, never a claim
// that the state is dangerous. 'help': the always-there "Need help now?".
export function CrisisLine({ kind, style }: { kind: 'crisis' | 'heavy' | 'help'; style?: object }) {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const text =
    kind === 'crisis' ? t('crisisSupport.lineCrisis') : kind === 'heavy' ? t('crisisSupport.lineHeavy') : t('crisisSupport.needHelp');
  return (
    <Pressable
      onPress={() => router.push('/crisis-support')}
      accessibilityRole="link"
      hitSlop={spacing[2]}
      style={style}
    >
      <Text style={[styles.text, kind === 'crisis' && styles.crisis]}>{text} →</Text>
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    text: { color: colors.text.muted, fontFamily: fonts.medium, fontSize: fontSizes.xs, lineHeight: fontSizes.xs * 1.5 },
    // Someone said they may be in danger — the line is still quiet, but
    // not faint.
    crisis: { color: colors.text.primary, fontSize: fontSizes.sm, lineHeight: fontSizes.sm * 1.5 },
  });
}
