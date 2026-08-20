import { useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent, Pressable } from 'react-native';
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
interface PagedScrollViewProps {
  children: React.ReactNode[];
  // A one-shot external "jump to this page" signal (2026-08-19) — for a
  // caller-driven navigation, not the person's own dot tap. Your Arc uses
  // this so tapping a reading dot on the time cone lands the person on
  // that reading's own detail page (appended dynamically at the END of
  // the page list, several swipes past where the cone itself sits)
  // instead of just quietly adding a new dot they'd have to notice and
  // navigate to themselves.
  //
  // { index, token }, not a bare index — the index alone can legitimately
  // repeat across two separate real triggers (Your Arc's own detail page
  // always occupies the SAME slot at the end of the page list, so tapping
  // cone point A then cone point B both resolve to an identical index),
  // and a plain index prop can't tell "the same jump request" apart from
  // "a new request that happens to land on the same page." `token` is any
  // caller-chosen value that changes per distinct request (Your Arc uses
  // Date.now()); this effect keys off `token`, not `index`, so it always
  // refires on a genuinely new request even when the destination repeats.
  jumpTo?: { index: number; token: number } | null;
  // Fired whenever the settled active page changes (2026-08-20, Your Arc's
  // closing-page arrival beat) — lets a caller know when a SPECIFIC page
  // becomes the one on screen, without this component needing to know
  // anything about what that page is. All children stay mounted the whole
  // time (this is a plain horizontal ScrollView, not virtualized), so a
  // child's own onMount effect only ever fires once; a page that wants to
  // replay an entrance animation each time it's actually swiped to needs
  // this signal instead.
  onActiveIndexChange?: (index: number) => void;
  // Marks the LAST dot as visually distinct — a small filled/hollow shape
  // difference, not a new color (aesthetic.md's "one accent color per
  // screen" still applies) — so the row itself hints "this one is the
  // destination" before arriving there (2026-08-20, Your Arc's "journey,
  // not equal-weight carousel" pass).
  distinctLastDot?: boolean;
}

export function PagedScrollView({ children, jumpTo, onActiveIndexChange, distinctLastDot }: PagedScrollViewProps) {
  const { width } = useWindowDimensions();
  const colors = useThemeColors();
  const accentRgb = useAppAccentRgb();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (index !== activeIndex) {
      setActiveIndex(index);
      onActiveIndexChange?.(index);
    }
  };

  // Dots are a real navigation control, not just a passive indicator
  // (review, 2026-08-19: "there should be its own navigation in Your Arc,
  // so that the user can go to any page at any point") — tapping any dot
  // jumps straight there, reusing the same row already on screen rather
  // than adding a second, separate nav affordance. animated: true so a
  // far jump (e.g. dot 1 to dot 7) still reads as real motion through the
  // pages, matching "gather, condense, become" over an instant teleport.
  const handleJumpTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setActiveIndex(index);
    onActiveIndexChange?.(index);
  };

  useEffect(() => {
    if (jumpTo == null) return;
    handleJumpTo(jumpTo.index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpTo?.token]);

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
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
        <View style={styles.dotsRow}>
          {children.map((_, i) => {
            const isLast = distinctLastDot && i === children.length - 1;
            return (
              <Pressable
                key={i}
                onPress={() => handleJumpTo(i)}
                hitSlop={8}
                style={styles.dotTapTarget}
              >
                <View
                  style={[
                    // The last dot is a small ring (hollow center), not a
                    // filled circle, when distinctLastDot is set — same
                    // size and the same active/inactive color logic below,
                    // just a shape difference (never a new color, per
                    // aesthetic.md) so it reads as "the destination" in
                    // the row at a glance.
                    isLast ? styles.dotRing : styles.dot,
                    i === activeIndex
                      ? { backgroundColor: isLast ? 'transparent' : `rgb(${accentRgb})`, borderColor: `rgb(${accentRgb})`, opacity: 0.95 }
                      : { backgroundColor: isLast ? 'transparent' : colors.text.faint, borderColor: colors.text.faint, opacity: 0.5 },
                  ]}
                />
              </Pressable>
            );
          })}
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
      // No gap here — dotTapTarget's own padding already provides the
      // visible spacing between dots (see its comment); an additional
      // gap on top of that padding spread dots noticeably further apart
      // than the original bare-dot design (confirmed by the math: 8px
      // padding each side + an 8px gap = 24px between visible dots,
      // vs. the original 6px dot + 8px gap = 14px).
    },
    // A real 6px dot is a small tap target — hitSlop alone still leaves a
    // cramped hit area when several dots sit close together, so each dot
    // gets its own padded Pressable wrapper (bigger tap area) around the
    // small visible dot itself. The padding value itself now also DOUBLES
    // as the visible gap between dots (see dotsRow's own comment) — it
    // isn't purely a hit-area concern anymore.
    dotTapTarget: { padding: spacing[2] },
    dot: { width: 6, height: 6, borderRadius: 3 },
    // Same footprint as `dot`, but a hollow ring (borderWidth, transparent
    // fill) instead of a filled circle — see distinctLastDot's own
    // comment on why this exists.
    dotRing: { width: 6, height: 6, borderRadius: 3, borderWidth: 1 },
  });
}
