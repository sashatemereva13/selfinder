import { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MessageCard } from './MessageCard';
import { saveMessageImage, shareMessageImage } from '../utils/saveMessageImage';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { spacing } from '../theme/spacing';

// Renders an off-screen copy of the message as a standalone card (see
// MessageCard) purely as the capture target for "save as image" / "share" —
// the on-screen message elsewhere on the page is untouched by this.
export function SaveMessageAction({ message, accentRgb }: { message: string; accentRgb: string }) {
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
      setErrorText(result.error ?? 'Something went wrong.');
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

      <Text style={styles.label}>Keep this message</Text>
      <View style={styles.actions}>
        <Pressable onPress={handleSave} disabled={status === 'saving'}>
          <Text style={[styles.actionText, { color: `rgb(${accentRgb})` }]}>
            {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save as an image'}
          </Text>
        </Pressable>
        <Pressable onPress={handleShare}>
          <Text style={styles.actionText}>Share it</Text>
        </Pressable>
      </View>

      {status === 'saved' && (
        <Text style={styles.hint}>Set it as your wallpaper from Settings → Wallpaper.</Text>
      )}
      {status === 'error' && errorText && <Text style={styles.error}>{errorText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: { position: 'absolute', top: -9999, left: 0 },
  label: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: spacing[4],
  },
  actions: { flexDirection: 'row', gap: spacing[5], marginTop: spacing[2] },
  actionText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.text.secondary },
  hint: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs, marginTop: spacing[2] },
  error: { color: colors.brand.purple, fontFamily: fonts.light, fontSize: fontSizes.xs, marginTop: spacing[2] },
});
