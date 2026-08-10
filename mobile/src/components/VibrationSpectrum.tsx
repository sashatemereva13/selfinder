import { View, StyleSheet } from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { VIBRATION_LEVELS, LEVEL_COLORS } from '../content/measureConfig';
import { useThemeColors } from '../theme/useThemeColors';

// A wheel, not a line — and not a single-hue marker on a plain track
// either. Two decisions stacked on each other, both from the same
// worry: any left-to-right bar, even recolored to one plain hue, still
// has a low end and a high end, and a red-to-violet fill along it is
// exactly the "bad → good" visual convention (traffic lights, health
// bars, sentiment scores) Selfinder's philosophy refuses. A circle has
// no ends — shame and enlightenment sit adjacent, closing the loop, on
// purpose (see the user's own framing: if no vibration is better or
// worse, experiencing shame is just as much a part of the whole as
// enlightenment). All 17 level colors are shown around the ring, like a
// genuine color wheel — safe to do specifically BECAUSE it's a closed
// loop: nobody reads a color wheel's red as "worse" than its blue, since
// there's no start or end to rank them along. That's the one thing a
// gradient BAR could never do safely, no matter how it was recolored.
//
// Matches PhilosopherObject's visual language: thin stroke, no fill, no
// glow — the same crisp construction-line register as the philosopher
// symbols and the picker's own ring.
//
// All 17 stay the default (this is still what Levels, a level's own
// detail page, and the arrival spin itself show). Depths' own ring is the
// one deliberate exception, via onlySlugs below — once a reading exists,
// THAT screen personalizes down to just the four sphere colors the
// reading actually produced, since Depths is scoped to one reading, not a
// map of the whole territory the way Levels is.
const RING_RADIUS = 42;
const TICK_LENGTH = 6;
const MARKER_RADIUS = 5;
const COMPACT_RING_RADIUS = 17;
const COMPACT_TICK_LENGTH = 3;
const COMPACT_MARKER_RADIUS = 3;

function levelIndex(slug: string): number {
  const i = VIBRATION_LEVELS.findIndex((l) => l.slug === slug);
  return i === -1 ? 0 : i;
}

// 0 stays "up" (12 o'clock) — the natural rest position a clock face or
// color wheel starts from. Distributes all 17 levels evenly around the
// FULL circle (not a half-circle or open arc), since a wheel with a
// visible start/end point would just be a bent line.
function angleFor(index: number, total: number): number {
  return (index / total) * 2 * Math.PI - Math.PI / 2;
}

function polarToXY(center: number, r: number, angle: number) {
  return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
}

// Exported so a caller composing something around this ring (Depths'
// sphere-convergence animation, see depths/index.tsx) can find a level's
// exact dot position without re-deriving the angle math — keeps the
// ring's own drawing and anything positioned relative to it from silently
// drifting apart if this math ever changes.
export function vibrationSpectrumDotPosition(levelSlug: string, size: number) {
  const total = VIBRATION_LEVELS.length;
  const angle = angleFor(levelIndex(levelSlug), total);
  const baseSize = (RING_RADIUS + TICK_LENGTH) * 2 + MARKER_RADIUS * 2;
  const r = RING_RADIUS * (size / baseSize);
  const center = size / 2;
  return polarToXY(center, r, angle);
}

export function VibrationSpectrum({
  levelSlug,
  compact = false,
  size: sizeOverride,
  hideMarker = false,
  onlySlugs,
}: {
  levelSlug: string;
  compact?: boolean;
  // Scales the whole ring (radius/tick/marker together, same proportions
  // as the compact/full presets) to an arbitrary diameter — for
  // compositions that need a size neither preset fits, e.g. a ring sized
  // to wrap around the aura figure on Depths. Presets stay the default so
  // existing call sites (the compact per-line wheels, Levels' own use of
  // the full size) are unaffected.
  size?: number;
  // For Depths' arrival spin: without this, the current level's tick is
  // already the one drawn larger/outlined from the very first frame, so
  // spinning the ring doesn't actually conceal which position is "the
  // one" — an observant viewer can already see it before the spin lands.
  // With hideMarker true, that tick renders exactly like the other 16
  // (same size/opacity, no distinguishing outline) — genuinely
  // indistinguishable from the rest until the caller flips this back to
  // false once the spin has stopped.
  hideMarker?: boolean;
  // For Depths' settled-after-arrival ring: once the spin has landed,
  // only the slugs that actually mattered for THIS reading (the four
  // sphere results) draw as dots — the other 13 positions on the wheel
  // are dropped rather than dimmed, since a reading is about what these
  // four specific answers produced, not the full 17-position map (that
  // map still exists, unchanged, everywhere else this component is used
  // — Levels, level-detail, the spin itself). Undefined (the default)
  // draws all 17, same as before this prop existed.
  //
  // TODO: this leaves the ring visually sparse with only 4-5 points on
  // it — the plan is to fill that space with a thin-line geometric
  // visualization (see the web frontend's MagicBall/DistortBall for the
  // visual reference), not yet built. Don't mistake the current bare
  // dots for the finished look.
  onlySlugs?: string[];
}) {
  const colors = useThemeColors();
  const index = levelIndex(levelSlug);
  const total = VIBRATION_LEVELS.length;
  const angle = angleFor(index, total);
  const color = `rgb(${LEVEL_COLORS[levelSlug] ?? '239,227,207'})`;

  const baseR = compact ? COMPACT_RING_RADIUS : RING_RADIUS;
  const baseTickLen = compact ? COMPACT_TICK_LENGTH : TICK_LENGTH;
  const baseMarkerR = compact ? COMPACT_MARKER_RADIUS : MARKER_RADIUS;
  const baseSize = (baseR + baseTickLen) * 2 + baseMarkerR * 2;
  const scale = sizeOverride ? sizeOverride / baseSize : 1;
  const r = baseR * scale;
  const tickLen = baseTickLen * scale;
  const markerR = baseMarkerR * scale;
  const size = sizeOverride ?? baseSize;
  const center = size / 2;
  const marker = polarToXY(center, r, angle);

  return (
    <View style={compact ? styles.wrapCompact : styles.wrap}>
      <Svg width={size} height={size}>
        {/* The wheel itself — one short tick per level, in that level's own
            warmed color, evenly spaced around the full circle. Ticks are
            radial (pointing outward from center), like hour marks on a
            clock face or hue marks on a color wheel, not a continuous
            painted ring — this keeps every level visually distinct rather
            than blurring into a gradient. */}
        {VIBRATION_LEVELS.map((level, i) => {
          if (onlySlugs && !onlySlugs.includes(level.slug)) return null;
          const a = angleFor(i, total);
          const inner = polarToXY(center, r - tickLen / 2, a);
          const outer = polarToXY(center, r + tickLen / 2, a);
          const isCurrent = i === index && !hideMarker;
          return (
            <SvgCircle
              key={level.slug}
              cx={outer.x}
              cy={outer.y}
              r={isCurrent ? 0 : tickLen / 2.4}
              fill={`rgb(${LEVEL_COLORS[level.slug]})`}
              opacity={isCurrent ? 0 : compact ? 0.6 : 0.75}
              // Rendered as small dots rather than <Line> strokes — a dot
              // reads as "one of 17 points on a wheel" at a glance; a
              // radial line at this size and count starts to look like a
              // sunburst/warning pattern instead.
            />
          );
        })}
        <SvgCircle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={colors.bg.border}
          strokeWidth={1}
        />
        {/* The current reading — outlined and slightly larger than the
            other 17 dots, at the exact same position theirs would sit, so
            it reads as "this one, specifically" rather than a foreign
            marker laid on top of the wheel. Hidden during the arrival
            spin (see hideMarker) — its normal tick renders in the loop
            above instead, indistinguishable from the other 16, until the
            spin lands. */}
        {!hideMarker && (
          <SvgCircle cx={marker.x} cy={marker.y} r={markerR} fill={color} stroke={colors.bg.base} strokeWidth={compact ? 1 : 1.5} />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  // "N of 17" used to render here — dropped along with the whole label:
  // on a wheel, no position is first or last, so ranking one against the
  // total is exactly the kind of order/hierarchy the ring shape exists to
  // NOT imply. The level's name already appears wherever a caller needs
  // it (the reveal screen's own hero title, a line row's own label) — this
  // component only draws the wheel now, not a second copy of the name.
  wrap: { alignItems: 'center' },
  wrapCompact: { alignItems: 'center' },
});
