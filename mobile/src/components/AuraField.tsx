import { Fragment } from 'react';
import Svg, { Ellipse as SvgEllipse } from 'react-native-svg';
import { getAuraFigureMetrics } from './AuraFigure';

// PHASE A of Depths' field-lines reveal — replaces the earlier ring/spin/
// dot-convergence approach entirely for THIS screen (Levels and level-
// detail keep VibrationSpectrum's own 17-dot ring unchanged; this is
// scoped to Depths' own reveal).
//
// Two mirrored ellipse lobes per sphere — one bulging left of the body,
// one bulging right, touching at the body's own vertical centerline —
// inspired by wormhole/torus-field reference images (two funnel shapes
// meeting at a narrow waist). Earlier versions tried: (1) each sphere in
// its own vertical body-region band, which accidentally evoked the
// chakra system; (2) one shared full circle per sphere, centered on the
// chest — closer, but a flat bullseye rather than the two-lobed field
// shape the references actually show. This is the left/right pinch
// version specifically (not top/bottom) — the user's own framing: the
// body is the narrow throat, the two lobes extend sideways.
//
// One clean line per sphere (no multi-line texture per lobe) — simplest,
// most legible, matches VibrationSpectrum's own thin-stroke construction-
// line register (no fill, no glow).
export const RING_GAP = 14;
export const BASE_RADIUS = 8;
// How far the smallest lobe clears the body's own silhouette — as a
// fraction of the aura's width, same unit radiusFor already scales by.
export const BODY_CLEARANCE_FACTOR = 0.32;
// Lobes are narrower (in x) than they are tall (in y) — RX_RATIO < 1
// means each ellipse reads as a sideways-bulging lobe rather than a
// circle, which is what actually produces the pinched-waist silhouette
// when the two touch at center. Lower = narrower/more pinched. Kept
// fairly narrow (not the 0.62 a first pass used) since the whole field
// is now roughly 4×rx wide (two lobes side by side) — at 0.62 the total
// width pushed past a typical phone's usable content width; 0.42 keeps
// the full shape comfortably on-screen.
export const LOBE_RX_RATIO = 0.42;

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
  const maxRx = maxRy * LOBE_RX_RATIO;
  // Wide enough to fit both lobes side by side (2× the widest lobe's own
  // rx, since each lobe's OUTER edge sits 2×rx from the centerline — its
  // center is rx out, its own radius reaches another rx further).
  const svgWidth = maxRx * 4;
  const svgHeight = maxRy * 2;
  const svgCenterX = svgWidth / 2;
  const svgCenterY = svgHeight / 2;
  // The caller centers this the same way it centers the aura image itself
  // (flex alignItems/justifyContent), which lines up the SVG's own center
  // with the aura's geometric center, NOT its chest point — this nudges
  // it down by the difference so the lobes' shared waist lands on the
  // chest instead.
  const chestNudge = metrics.chestY - metrics.height / 2;
  const ryFor = (index: number) => BASE_RADIUS + index * RING_GAP + metrics.width * BODY_CLEARANCE_FACTOR;
  const rxFor = (index: number) => ryFor(index) * LOBE_RX_RATIO;
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
  // in depths/index.tsx) — when set, the other three lobe-pairs dim while
  // the selected one stays full-bright, echoing the aura image itself
  // recoloring to the selected sphere's hue. Null/undefined means no
  // dimming — all four lobe-pairs equally visible, the reading's default/
  // idle state.
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
          <Fragment key={key}>
            <SvgEllipse
              cx={svgCenterX - rx}
              cy={svgCenterY}
              rx={rx}
              ry={ry}
              fill="none"
              stroke={colors[key]}
              strokeWidth={1}
              opacity={0.55 * emphasis}
            />
            <SvgEllipse
              cx={svgCenterX + rx}
              cy={svgCenterY}
              rx={rx}
              ry={ry}
              fill="none"
              stroke={colors[key]}
              strokeWidth={1}
              opacity={0.55 * emphasis}
            />
          </Fragment>
        );
      })}
    </Svg>
  );
}
