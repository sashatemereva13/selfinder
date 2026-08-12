import Svg, { Ellipse as SvgEllipse } from 'react-native-svg';
import { getAuraFigureMetrics } from './AuraFigure';

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
// A foreshortened circle viewed from an angle reads as rx close to (but
// less than) ry — this is a GROUND ellipse now, not a sideways-bulging
// lobe, so the ratio is much closer to 1 than the old two-lobe silhouette
// needed (that version's LOBE_RX_RATIO=0.42 would read as a tall narrow
// lens here, not a plane the cone could plausibly sit on).
export const GROUND_RX_RATIO = 0.82;

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
  const maxRy = BASE_RADIUS + (RING_ORDER.length - 1) * RING_GAP + metrics.width * (BODY_CLEARANCE_FACTOR + 0.2);
  const maxRx = maxRy * GROUND_RX_RATIO;
  // A single concentric ellipse's own bounding box — smaller than the old
  // two-lobes-side-by-side footprint (maxRx * 4), which is expected: a
  // ground ellipse is meant to look flat/foreshortened, not as wide as
  // two lobes ever were.
  const svgWidth = maxRx * 2;
  const svgHeight = maxRy * 2;
  const svgCenterX = svgWidth / 2;
  const svgCenterY = svgHeight / 2;
  // The caller centers this the same way it centers the aura image itself
  // (flex alignItems/justifyContent), which lines up the SVG's own center
  // with the aura's geometric center, NOT its chest point — this nudges
  // it down by the difference so the rings' shared center lands on the
  // chest instead. Kept chest-anchored (not feet/legsBottomY) as the
  // starting point for the ground-plane framing — revisit only if this
  // doesn't read as "ground plane" once screenshotted.
  const chestNudge = metrics.chestY - metrics.height / 2;
  const ryFor = (index: number) => BASE_RADIUS + index * RING_GAP + metrics.width * BODY_CLEARANCE_FACTOR;
  const rxFor = (index: number) => ryFor(index) * GROUND_RX_RATIO;
  return { svgWidth, svgHeight, svgCenterX, svgCenterY, chestNudge, ryFor, rxFor };
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
  const { svgWidth, svgHeight, svgCenterX, svgCenterY, chestNudge, ryFor, rxFor } = buildAuraFieldGeometry(size);

  return (
    <Svg
      width={svgWidth}
      height={svgHeight}
      style={{ position: 'absolute', marginTop: chestNudge }}
      pointerEvents="none"
    >
      {RING_ORDER.map((key, i) => {
        const emphasis = !selectedSphere || selectedSphere === key ? 1 : 0.25;
        const rx = rxFor(i);
        const ry = ryFor(i);
        return (
          <SvgEllipse
            key={key}
            cx={svgCenterX}
            cy={svgCenterY}
            rx={rx}
            ry={ry}
            fill="none"
            stroke={colors[key]}
            strokeWidth={1}
            opacity={0.55 * emphasis}
          />
        );
      })}
    </Svg>
  );
}
