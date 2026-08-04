import { useWindowDimensions } from 'react-native';

// The app was portrait-phone-only until tablet/rotation support was added
// (see app.json — orientation lock and ios.supportsTablet removed). Screens
// built for a ~390px phone column read as uncomfortably wide text lines on
// a rotated tablet if left unconstrained. This is intentionally narrow in
// scope: a single reading-column cap, not a general breakpoint system —
// most screens (Guide, Depths) just want their text/list column to stop
// growing past a comfortable line length, not a different layout entirely.
export const READING_COLUMN_MAX_WIDTH = 640;

// useWindowDimensions (not Dimensions.get, see MessageCard.tsx's static
// call) re-renders on rotation, which a centered-column width needs to
// react to live rather than only reflecting the size at first mount.
export function useReadingColumnWidth() {
  const { width } = useWindowDimensions();
  return Math.min(width, READING_COLUMN_MAX_WIDTH);
}
