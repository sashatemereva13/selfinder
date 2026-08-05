import { useWindowDimensions } from 'react-native';

// The app was portrait-phone-only until tablet/rotation support was added
// (see app.json — orientation lock and ios.supportsTablet removed). Screens
// built for a ~390px phone column read as uncomfortably wide text lines on
// a rotated tablet if left unconstrained. This is intentionally narrow in
// scope: a single reading-column cap, not a general breakpoint system —
// most screens (Guide, Depths) just want their text/list column to stop
// growing past a comfortable line length, not a different layout entirely.
export const READING_COLUMN_MAX_WIDTH = 640;

// A second, roomier cap for screens that should visibly use more of a
// tablet's width than dense prose wants (a conversation thread, a hub of
// short rows) without ever going full-bleed edge to edge.
export const WIDE_COLUMN_MAX_WIDTH = 900;

// useWindowDimensions (not Dimensions.get, see MessageCard.tsx's static
// call) re-renders on rotation, which a centered-column width needs to
// react to live rather than only reflecting the size at first mount.
export function useReadingColumnWidth() {
  const { width } = useWindowDimensions();
  return Math.min(width, READING_COLUMN_MAX_WIDTH);
}

export function useWideColumnWidth() {
  const { width } = useWindowDimensions();
  return Math.min(width, WIDE_COLUMN_MAX_WIDTH);
}

// Real tablets only — keyed on the SHORT axis, not raw width, so a phone
// rotated to landscape (e.g. iPhone 15 Pro Max: 932x430) never qualifies.
// 700 sits between the largest phone short axis (~430pt) and the smallest
// real tablet's short axis (iPad mini: 744pt, in either orientation).
export const LARGE_SCREEN_MIN_SHORT_AXIS = 700;

export function useIsLargeScreen() {
  const { width, height } = useWindowDimensions();
  return Math.min(width, height) >= LARGE_SCREEN_MIN_SHORT_AXIS;
}
