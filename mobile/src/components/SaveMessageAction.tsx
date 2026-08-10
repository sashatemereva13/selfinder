import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MessageCard } from './MessageCard';
import { saveMessageImage, shareMessageImage } from '../utils/saveMessageImage';
import { useThemeColors } from '../theme/useThemeColors';
import type { Colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { spacing } from '../theme/spacing';

// Renders an off-screen copy of the message as a standalone card (see
// MessageCard) purely as the capture target for "save as image" / "share" —
// the on-screen message elsewhere on the page is untouched by this.
export function SaveMessageAction({ message, accentRgb }: { message: string; accentRgb: string }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const cardRef = useRef<View>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSave = async () => {
    setStatus('saving');
    setErrorText(null);
    const result = await saveMessageImage(cardRef);
    if (result.success) {
      setStatus('saved');
    } else {
      setStatus('error');
      setErrorText(result.error ?? t('saveMessage.somethingWentWrong'));
    }
  };

  const handleShare = () => {
    shareMessageImage(cardRef);
  };

  return (
    <View>
      <View style={styles.offscreen} pointerEvents="none">
        <View ref={cardRef} collapsable={false}>
          <MessageCard message={message} accentRgb={accentRgb} />
        </View>
      </View>

      <Text style={styles.label}>{t('saveMessage.keepThisMessage')}</Text>
      <View style={styles.actions}>
        <Pressable onPress={handleSave} disabled={status === 'saving'}>
          <Text style={styles.actionText}>
            {status === 'saving'
              ? t('saveMessage.saving')
              : status === 'saved'
                ? t('saveMessage.saved')
                : t('saveMessage.saveAsImage')}
          </Text>
        </Pressable>
        <Pressable onPress={handleShare}>
          <Text style={styles.actionText}>{t('saveMessage.shareIt')}</Text>
        </Pressable>
      </View>

      {status === 'saved' && <Text style={styles.hint}>{t('saveMessage.wallpaperHint')}</Text>}
      {status === 'error' && errorText && <Text style={styles.error}>{errorText}</Text>}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  offscreen: { position: 'absolute', top: -9999, left: 0 },
  label: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: spacing[4],
  },
  // Was flexDirection: 'row' — "Save as an image" next to "Share it" fit
  // fine in English, but "Сохранить как изображение" (Russian) is long
  // enough that the two crowded each other or overflowed a narrow phone
  // width side by side. Stacked vertically instead — costs a little extra
  // height, but each action gets its own full-width line regardless of
  // how long its label is in a given language.
  actions: { gap: spacing[3], marginTop: spacing[2] },
  // Ivory, consistently, matching the row actions on Depths — previously
  // "Save as an image" took the reading's accent color and "Share it" sat
  // in plain secondary gray, so the two sat at different visual weights
  // right next to each other despite both being the same kind of action.
  actionText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.accent.ivory },
  hint: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs, marginTop: spacing[2] },
  error: { color: colors.accent.ivory, fontFamily: fonts.light, fontSize: fontSizes.xs, marginTop: spacing[2] },
  });
}
