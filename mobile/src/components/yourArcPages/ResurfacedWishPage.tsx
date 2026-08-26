import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import { SavedWish } from '../../api/wish';
import { makeSharedArcPageStyles } from './arcPageShared';

interface ResurfacedWishPageProps {
  resurfacedWish: SavedWish; // caller only mounts this page when truthy
  wishRevealed: boolean;
  onReveal: () => void; // handleRevealWish
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// A wish from before. Pure resurfacing (docs/session-result-concept.md,
// Phase 4), offered quietly, not pushed — only exists as its own page when
// there's actually one eligible this visit. Held behind a tap until opened
// (same "held, not displayed" rule the same-session version follows): no
// comparison to the current reading is ever drawn here — showing the
// wish's own words is the whole mechanism.
export function ResurfacedWishPage({ resurfacedWish, wishRevealed, onReveal }: ResurfacedWishPageProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeSharedArcPageStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <View style={styles.wishSection}>
        {wishRevealed ? (
          <>
            <Text style={styles.wishHeading}>{t('yourArc.wishResurfaceHeading')}</Text>
            <Text style={styles.wishDate}>{formatDate(new Date(resurfacedWish.savedAt).getTime())}</Text>
            <Text style={styles.wishText}>{resurfacedWish.text}</Text>
            <Text style={styles.wishHint}>{t('yourArc.wishResurfaceHint')}</Text>
          </>
        ) : (
          <Pressable style={styles.wishRow} onPress={onReveal}>
            <Text style={styles.wishRowText}>
              {t('yourArc.wishResurfaceRow', { date: formatDate(new Date(resurfacedWish.savedAt).getTime()) })}
            </Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}
