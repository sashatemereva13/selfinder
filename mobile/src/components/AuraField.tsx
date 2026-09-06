import { useEffect } from 'react';
import Svg, { Ellipse as SvgEllipse } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { getAuraFigureMetrics } from './AuraFigure';

const AnimatedSvgEllipse = Animated.createAnimatedComponent(SvgEllipse);
const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);
// Matches DepthsSpiral.tsx's own PULSE_DURATION_MS — the ring-dimming
// should settle at roughly the same pace as the spiral's own confirmation
// pulse landing, so "rings shift" reads as caused by the pulse arriving,
// not a separate, differently-timed transition.
const EMPHASIS_DURATION_MS = 380;

// PHASE C of Depths' field-lines reveal — the aura + its four rings now
// sit as a foreshortened "ground plane" at the base of the conical
// spiral (see DepthsSpiral.tsx's header comment). Earlier versions tried:
// (1) each sphere in its own vertical body-region band, which
// accidentally evoked the chakra system; (2) two mirrored ellipse lobes
// per sphere (a pinched-waist silhouette inspired by wormhole/torus-field
// references); (3) a wireframe mesh per lobe, exploring a literal
// energy-field look. This version — one concentric, foreshortened ellipse
// per sphere, all sharing the body's own center — replaces (2)/(3): the
// rings' MEANING was reframed from "a literal energy field" to "a
// person's inner state has a real, outward effect on their life" (an
// observation, not a physics claim — see RULES.md's anti-belief-
// assertion rule), and the visual moved to match: simple rings radiating
// from the body, reading as the ground a cone rises from, not a dense
// mesh competing with the spiral above it.
//
// One clean line per sphere (no multi-line texture, no fill/glow) —
// matches VibrationSpectrum's own thin-stroke construction-line register.
export const RING_GAP = 14;
export const BASE_RADIUS = 8;
// How far the smallest ring clears the body's own silhouette — as a
// fraction of the aura's width, same unit radiusFor already scales by.
export const BODY_CLEARANCE_FACTOR = 0.32;
// A ground-plane circle viewed from above at a steep angle reads as WIDE
// and FLAT — rx much larger than ry, the opposite ratio direction from
// the old two-lobe silhouette (which wanted a tall narrow lens). An
// earlier pass here used 0.82 (rx only slightly smaller than ry), which
// barely foreshortened at all — on a real device the rings ballooned up
// past the aura's own head instead of reading as ground beneath its
// feet (see collaboration notes on IMG_3926). ry is now the SMALL axis.
// GROUND_RX_RATIO also directly sets SPIRAL_AURA_HALF_WIDTH in
// depths/index.tsx (the spiral's own base-ellipse width) — an earlier
// value of 2.2 pushed the ring wider than the spiral's own canvas,
// clipping the Levels/Tune In labels off the right edge. Was 1.5 — bumped
// slightly to 1.55 (the ring itself ~20pt/6.6% wider) after a real device
// showed the four rings sitting with noticeably tighter margin than the
// spiral's own loops above them (see collaboration notes on IMG_3945).
// 1.55 is the most this can safely grow while depths/index.tsx's own
// SPIRAL_WIDTH is now screen-width-responsive (see its own comment) but
// still clamped down to 327px on the smallest supported phone (iPhone
// SE) — 1.6 or higher would overflow that floor. On larger phones,
// SPIRAL_WIDTH's own responsive growth (up to 380px) gives the whole
// canvas more room around this same ring, which is the bigger part of
// the fix; this ratio only needed a small nudge, not a large one.
export const GROUND_RX_RATIO = 1.55;
export const GROUND_RY_RATIO = 0.4;

export type SphereKey = 'spirit' | 'mind' | 'heart' | 'body';

// Display order, smallest ring to largest — arbitrary but fixed, so a
// given sphere always draws at the same relative diameter across renders
// rather than shuffling based on object key order. Exported so Depths'
// own arrival animation (AuraArrival in depths/index.tsx) can stagger its
// ring-draw/ring-color-settle sequence in the same order the static rings
// themselves are laid out in — inner ring resolves first, outer last.
export const RING_ORDER: SphereKey[] = ['heart', 'mind', 'body', 'spirit'];

// Pure geometry, no rendering — exported so the arrival animation can
// compute each lobe's true radius and the whole field's own centering
// nudge without duplicating this math. Kept as one function (not
// inlined at each call site) so AuraField's own render and the arrival
// animation can never silently drift apart on lobe sizing.
export function buildAuraFieldGeometry(size: number) {
  const metrics = getAuraFigureMetrics(size);
  // Base radius (before the rx/ry ratios below) scales with the aura's
  // width — same unit BODY_CLEARANCE_FACTOR already used.
  const maxBase = BASE_RADIUS + (RING_ORDER.length - 1) * RING_GAP + metrics.width * BODY_CLEARANCE_FACTOR;
  const maxRx = maxBase * GROUND_RX_RATIO;
  const maxRy = maxBase * GROUND_RY_RATIO;
  const svgWidth = maxRx * 2;
  const svgHeight = maxRy * 2;
  const svgCenterX = svgWidth / 2;
  const svgCenterY = svgHeight / 2;
  // Anchored at the FEET (legsBottomY), not the chest — an earlier
  // chest-anchored pass ballooned the rings up past the aura's own head
  // on a real device instead of reading as ground beneath it (see
  // collaboration notes on IMG_3926). The caller (ringWrap) is sized to
  // the aura's own height with justifyContent:'flex-end', so the aura
  // image's BOTTOM edge sits flush with the box's own bottom — this ring
  // SVG is likewise bottom-anchored (see its own `bottom` style below),
  // so groundUpOffset measures UP from that shared bottom edge to
  // legsBottomY (not down from a geometric center, which assumed a
  // different parent layout that no longer applies).
  const groundUpOffset = metrics.height - metrics.legsBottomY;
  const ryFor = (index: number) => (BASE_RADIUS + index * RING_GAP + metrics.width * BODY_CLEARANCE_FACTOR) * GROUND_RY_RATIO;
  const rxFor = (index: number) => (BASE_RADIUS + index * RING_GAP + metrics.width * BODY_CLEARANCE_FACTOR) * GROUND_RX_RATIO;
  return { svgWidth, svgHeight, svgCenterX, svgCenterY, groundUpOffset, ryFor, rxFor };
}

export function AuraField({
  size,
  colors,
  selectedSphere,
}: {
  size: number;
  // One color per sphere, keyed the same as SphereKey — callers derive
  // this from currentResult.lines the same way ringOnlySlugs/LEVEL_COLORS
  // already do elsewhere in depths/index.tsx.
  colors: Record<SphereKey, string>;
  // Same selection Depths' own sphere buttons already track (selectedSphere
  // in depths/index.tsx) — when set, the other three rings dim while the
  // selected one stays full-bright, echoing the aura image itself
  // recoloring to the selected sphere's hue. Null/undefined means no
  // dimming — all four rings equally visible, the reading's default/idle
  // state.
  selectedSphere?: SphereKey | null;
}) {
  const { svgWidth, svgHeight, svgCenterX, svgCenterY, groundUpOffset, ryFor, rxFor } = buildAuraFieldGeometry(size);

  return (
    <Svg
      width={svgWidth}
      height={svgHeight}
      style={{ position: 'absolute', bottom: groundUpOffset - svgHeight / 2 }}
      pointerEvents="none"
    >
      {RING_ORDER.map((key, i) => {
        const emphasis = !selectedSphere || selectedSphere === key ? 1 : 0.25;
        const rx = rxFor(i);
        const ry = ryFor(i);
        return (
          <AuraFieldRing
            key={key}
            cx={svgCenterX}
            cy={svgCenterY}
            rx={rx}
            ry={ry}
            color={colors[key]}
            emphasis={emphasis}
          />
        );
      })}
    </Svg>
  );
}

// A single ring, its own emphasis-driven opacity animated rather than a
// plain SVG prop — a bare `opacity` prop snaps instantly when `emphasis`
// changes (React Native SVG doesn't interpolate prop changes on its own),
// which read as an instant swap rather than the "rings shift" transition
// the sphere-tap pulse is meant to cause (2026-08-29, see DepthsSpiral.tsx's
// own pulseToSphere). Kept as its own small component (not inlined in the
// .map above) so the shared value lives per-ring, not per-render.
function AuraFieldRing({
  cx,
  cy,
  rx,
  ry,
  color,
  emphasis,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  color: string;
  emphasis: number;
}) {
  const emphasisValue = useSharedValue(emphasis);
  useEffect(() => {
    emphasisValue.value = withTiming(emphasis, { duration: EMPHASIS_DURATION_MS, easing: SOFT_EASE });
  }, [emphasis]);
  const animatedProps = useAnimatedProps(() => ({
    opacity: 0.55 * emphasisValue.value,
  }));
  return (
    <AnimatedSvgEllipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill="none"
      stroke={color}
      strokeWidth={1}
      animatedProps={animatedProps}
    />
  );
}
