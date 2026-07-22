import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { fonts, fontSizes, lineHeights } from '../theme/typography';
import { spacing } from '../theme/spacing';

// Full device screen size (not 'window', which excludes the status bar) so
// the captured image matches this phone's actual wallpaper dimensions —
// read once at module load, since this is only ever used as an
// off-screen capture target, not a component that needs to react to rotation.
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

// Reserves the top ~27% of the screen for the iOS lock-screen clock/date
// (and any widgets under it), which is drawn over whatever image is set as
// the wallpaper — so the message must live below that zone, not dead-center
// across the whole screen, or its opening lines get covered by the clock.
const CLOCK_ZONE_HEIGHT = SCREEN_HEIGHT * 0.27;

// The on-screen message is plain text, styled to sit inside the rest of a
// busy screen. This is a standalone, decorative rendering of the same
// message meant to stand alone as an image, sized to fill one phone screen
// exactly — used as the capture target for "save as image", not shown as
// the primary in-app presentation.
export function MessageCard({ message, accentRgb }: { message: string; accentRgb: string }) {
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[`rgba(${accentRgb},0.24)`, 'rgba(6,6,13,1)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.clockZone} />
      <View style={styles.messageZone}>
        <Text style={[styles.message, { color: `rgb(${accentRgb})` }]}>{message}</Text>
      </View>
      <Text style={styles.wordmark}>SELFINDER</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: colors.bg.base,
    overflow: 'hidden',
  },
  clockZone: {
    height: CLOCK_ZONE_HEIGHT,
  },
  messageZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    paddingBottom: spacing[12],
  },
  message: {
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.loose,
    textAlign: 'center',
  },
  wordmark: {
    position: 'absolute',
    bottom: spacing[10],
    alignSelf: 'center',
    color: colors.text.faint,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: 3,
  },
});
