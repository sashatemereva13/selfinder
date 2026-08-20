import { ReactNode, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MessageCard } from './MessageCard';
import { saveMessageImage } from '../utils/saveMessageImage';
import { useThemeColors } from '../theme/useThemeColors';
import type { Colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { spacing } from '../theme/spacing';

// Replaces SaveMessageAction's visible "Save as an image" / "Share it"
// buttons app-wide (2026-08-20 review) — long-press the content itself
// instead. Decision, from the same review: "it should be really easy to
// save... long press to save across all pages... if the user wishes to
// share, they'd do it after an inner reflection, so after the image is
// already saved in their gallery" — so this drops the separate Share
// button entirely; sharing happens from the person's own gallery, after
// the fact, not as a second in-app action competing with save. Every
// saved image already carries the "SELFINDER" wordmark (see
// MessageCard.tsx) — first built for the message-card flow, now the
// standing rule for any Selfinder art someone saves.
//
// Two capture modes:
// - `message` (+ `accentRgb`): renders MessageCard off-screen as the
//   capture target, same as SaveMessageAction always did — the ON-screen
//   content (children) can look however the calling screen wants; the
//   SAVED image is always the same clean, consistent card design.
// - `captureChildren`: captures the on-screen children directly (no
//   off-screen render) — for content that IS already the thing worth
//   saving as-is, e.g. Your Arc's kaleidoscope.
// Exactly one of these should be provided.
interface LongPressToSaveProps {
  children: ReactNode;
  message?: string;
  accentRgb?: string;
  captureChildren?: boolean;
}

export function LongPressToSave({ children, message, accentRgb, captureChildren }: LongPressToSaveProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const targetRef = useRef<View>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleLongPress = async () => {
    if (status === 'saving') return;
    setStatus('saving');
    setErrorText(null);
    const result = await saveMessageImage(targetRef);
    if (result.success) {
      setStatus('saved');
    } else {
      setStatus('error');
      setErrorText(result.error ?? null);
    }
  };

  return (
    <View>
      {captureChildren ? (
        <Pressable onLongPress={handleLongPress} disabled={status === 'saving'}>
          <View ref={targetRef} collapsable={false}>
            {children}
          </View>
        </Pressable>
      ) : (
        <>
          <Pressable onLongPress={handleLongPress} disabled={status === 'saving'}>
            {children}
          </Pressable>
          {/* Off-screen capture target — same pattern SaveMessageAction
              always used, just triggered by long-press now instead of a
              visible button. */}
          <View style={styles.offscreen} pointerEvents="none">
            <View ref={targetRef} collapsable={false}>
              <MessageCard message={message ?? ''} accentRgb={accentRgb ?? colors.accent.ivoryRgb} />
            </View>
          </View>
        </>
      )}
      {status !== 'idle' && (
        <Text style={styles.status}>
          {status === 'saving'
            ? t('saveMessage.saving')
            : status === 'saved'
              ? t('saveMessage.saved')
              : errorText ?? t('saveMessage.somethingWentWrong')}
        </Text>
      )}
      {/* MessageCard is deliberately sized to fill the exact screen
          dimensions (see its own header comment) — this hint only makes
          sense for that message-card mode, not captureChildren (e.g. the
          kaleidoscope), which isn't full-screen-shaped. */}
      {status === 'saved' && !captureChildren && (
        <Text style={styles.status}>{t('saveMessage.wallpaperHint')}</Text>
      )}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    offscreen: { position: 'absolute', top: -9999, left: 0 },
    status: {
      color: colors.text.muted,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      textAlign: 'center',
      marginTop: spacing[2],
    },
  });
}
