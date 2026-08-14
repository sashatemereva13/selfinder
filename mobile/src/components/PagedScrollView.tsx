import { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useThemeColors } from '../theme/useThemeColors';
import type { Colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useAppAccentRgb } from '../utils/appAccent';

// A reusable horizontal-swipe pager with a dot indicator — first built for
// Your Arc's own restructure (2026-08-14: "everything is a one-page
// scroll, which feels overwhelming... it would look better as cards" —
// paged single-screen sections instead of one long undifferentiated
// scroll). Not Your-Arc-specific: any screen that wants "one focused idea
// per screen, swipe between them" can reuse this rather than each building
// its own ScrollView+pagingEnabled+dot-row from scratch.
//
// Each child is expected to be a single, self-contained screen's worth of
// content — this component doesn't scroll vertically itself; a child that
// needs its own vertical scroll should wrap its own content in a
// ScrollView (per the "split into more screens, not scroll-within-scroll"
// decision this was built for — most Your Arc pages are short enough not
// to need this at all).
export function PagedScrollView({ children }: { children: React.ReactNode[] }) {
  const { width } = useWindowDimensions();
  const colors = useThemeColors();
  const accentRgb = useAppAccentRgb();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (index !== activeIndex) setActiveIndex(index);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={32}
      >
        {children.map((child, i) => (
          <View key={i} style={{ width }}>
            {child}
          </View>
        ))}
      </ScrollView>
      {children.length > 1 && (
        <View style={styles.dotsRow} pointerEvents="none">
          {children.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex
                  ? { backgroundColor: `rgb(${accentRgb})`, opacity: 0.95 }
                  : { backgroundColor: colors.text.faint, opacity: 0.5 },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { flex: 1 },
    // Fixed at the bottom of the viewport, not scrolled with the page
    // content — same "quiet, always-there orientation" job a real page
    // indicator does anywhere else (iOS's own onboarding carousels, etc.).
    dotsRow: {
      position: 'absolute',
      bottom: spacing[6],
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing[2],
    },
    dot: { width: 6, height: 6, borderRadius: 3 },
  });
}
