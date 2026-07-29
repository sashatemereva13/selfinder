import Svg, {
  Defs,
  Filter,
  FeGaussianBlur,
  FeColorMatrix,
  FeComposite,
  LinearGradient,
  RadialGradient,
  Stop,
  G,
  Circle,
  Rect,
  Ellipse,
  Polygon,
  Path,
} from 'react-native-svg';
import { generateAuraDots } from '../utils/auraDots';

// Body zone coordinates in the figure's own 200x380 drawing space, and the
// padding added around it so the blurred rim/dots have room to render
// without the SVG viewport hard-clipping them. Shared between the component
// and getAuraFigureMetrics so callers can align other UI to specific points
// on the body (e.g. text set beside the head or chest) without duplicating
// these numbers.
const BODY = { width: 200, height: 380, headY: 42, chestY: 148, legsTopY: 196, legsBottomY: 324 };
const PAD_TOP = 30;
const PAD_BOTTOM = 10;
const PAD_SIDE = 20;

// The neutral (pre-reading) glow color, exported so callers rendering the
// dots separately (see auraBodyToPixel / showDots) can match it exactly
// rather than re-guessing the hex value.
export const AURA_NEUTRAL_COLOR = '#efe3cf';

export function getAuraFigureMetrics(size: number) {
  const scale = size / BODY.width;
  return {
    width: (BODY.width + PAD_SIDE * 2) * scale,
    height: (BODY.height + PAD_TOP + PAD_BOTTOM) * scale,
    headY: (BODY.headY + PAD_TOP) * scale,
    chestY: (BODY.chestY + PAD_TOP) * scale,
    legsTopY: (BODY.legsTopY + PAD_TOP) * scale,
    legsBottomY: (BODY.legsBottomY + PAD_TOP) * scale,
  };
}

// Maps a point in the figure's own 200x380 drawing space (e.g. a dot from
// generateAuraDots) to a pixel offset within the rendered image's bounding
// box, so a caller rendering the dots separately (to animate them, say) can
// line them up exactly with the static body underneath.
export function auraBodyToPixel(size: number, x: number, y: number) {
  const scale = size / BODY.width;
  return { x: (x + PAD_SIDE) * scale, y: (y + PAD_TOP) * scale };
}

// A standing figure whose body is a constant, near-black form — it's always
// you, never tinted by the aura color. Only the aura around it changes: soft
// white noise before a reading, the vibration level's color after. The dark
// body's fill uses a "goo" filter (blur then re-harden the alpha) so
// separately-drawn limbs read as one continuous silhouette instead of
// assembled parts; the rim reuses the same merged shape, dilated and then
// left softly blurred (no re-hardening), so it diffuses outward like a glow
// instead of a defined outline.
export function AuraFigure({
  rgb = '195,153,255',
  neutral = false,
  size = 160,
  uid = 'aura',
  showDots = true,
}: {
  rgb?: string;
  neutral?: boolean;
  size?: number;
  uid?: string;
  // Off when a caller wants to render/animate the dots itself (see
  // auraBodyToPixel) rather than have them baked into this component's output.
  showDots?: boolean;
}) {
  // Warm, not cold — a cool lavender-white on a featureless humanoid
  // silhouette reads closer to horror-movie lighting than a comforting
  // "self" symbol. Only the neutral (pre-reading) state uses this; a real
  // vibration-level color always overrides it.
  const color = neutral ? AURA_NEUTRAL_COLOR : `rgb(${rgb})`;
  const coreColor = neutral ? '#fff9ef' : '#ffffff';
  const dots = generateAuraDots(`${uid}-${neutral ? 'neutral' : rgb}`);
  const metrics = getAuraFigureMetrics(size);
  const vbWidth = BODY.width + PAD_SIDE * 2;
  const vbHeight = BODY.height + PAD_TOP + PAD_BOTTOM;

  return (
    <Svg
      width={metrics.width}
      height={metrics.height}
      viewBox={`-${PAD_SIDE} -${PAD_TOP} ${vbWidth} ${vbHeight}`}
    >
      <Defs>
        <Filter id={`goo-${uid}`} x="-40%" y="-20%" width="180%" height="140%">
          <FeGaussianBlur in="SourceGraphic" stdDeviation={4} result="blur" />
          <FeColorMatrix
            in="blur"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          <FeComposite in="goo" in2="goo" operator="atop" />
        </Filter>
        <Filter id={`soft-${uid}`} x="-60%" y="-40%" width="220%" height="180%">
          <FeGaussianBlur in="SourceGraphic" stdDeviation={8} />
        </Filter>
        {/* userSpaceOnUse (not the default objectBoundingBox) so the gradient
            maps to the same absolute coordinates for every primitive — each
            shape would otherwise fit the gradient to its own bounding box and
            show a visible seam where they overlap. */}
        <LinearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="380" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="rgb(30,27,40)" stopOpacity={1} />
          <Stop offset="1" stopColor="rgb(18,16,26)" stopOpacity={1} />
        </LinearGradient>
        <RadialGradient id={`core-${uid}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={coreColor} stopOpacity={0.95} />
          <Stop offset="0.35" stopColor={coreColor} stopOpacity={0.65} />
          <Stop offset="0.7" stopColor={color} stopOpacity={0.25} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* rim: a dilated, goo-merged copy of the whole silhouette, softly
          blurred (not re-hardened) so it diffuses outward like an aura */}
      <G filter={`url(#soft-${uid})`} opacity={0.85}>
        <G
          filter={`url(#goo-${uid})`}
          fill={color}
          stroke={color}
          strokeWidth={15}
          strokeOpacity={1}
          strokeLinejoin="round"
        >
          <BodyPrimitives />
        </G>
      </G>

      {/* dark body — drawn twice: a plain, unfiltered pass first so every
          primitive is guaranteed fully opaque no matter how a given platform's
          SVG filter engine happens to render alpha (this is what actually
          keeps the body from reading as tinted), then the same shapes again
          through the goo filter on top purely to blur-bridge the small gaps
          between adjacent primitives (e.g. neck-to-torso) into one silhouette */}
      <G
        fill={`url(#body-${uid})`}
        stroke={`url(#body-${uid})`}
        strokeWidth={8}
        strokeLinejoin="round"
      >
        <BodyPrimitives />
      </G>
      <G
        filter={`url(#goo-${uid})`}
        fill={`url(#body-${uid})`}
        stroke={`url(#body-${uid})`}
        strokeWidth={8}
        strokeLinejoin="round"
      >
        <BodyPrimitives />
      </G>

      {/* a faint seam where each arm meets the torso — without it the two
          read as one fused mass rather than distinct limbs */}
      <Path
        d="M 79,90 Q 65,108 68,130"
        fill="none"
        stroke={color}
        strokeOpacity={0.3}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Path
        d="M 121,90 Q 135,108 132,130"
        fill="none"
        stroke={color}
        strokeOpacity={0.3}
        strokeWidth={2.5}
        strokeLinecap="round"
      />

      <Circle cx={100} cy={148} r={34} fill={`url(#core-${uid})`} />

      {showDots && (
        <G>
          {dots.map((d, i) => (
            <Circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={color} opacity={d.opacity} />
          ))}
        </G>
      )}
    </Svg>
  );
}

// The neck is deliberately wide relative to the head — a narrow neck under a
// round head reads as a classic "grey alien" silhouette, which is exactly
// the unsettling association this figure is meant to avoid.
function BodyPrimitives() {
  return (
    <>
      <Circle cx={100} cy={40} r={23} />
      <Rect x={86} y={54} width={28} height={44} rx={13} />
      <Ellipse cx={100} cy={148} rx={32} ry={52} />
      <Polygon points="78,88 58,96 46,192 62,196" />
      <Polygon points="122,88 142,96 154,192 138,196" />
      <Polygon points="93,196 74,199 66,320 88,324" />
      <Polygon points="107,196 126,199 134,320 112,324" />
      <Circle cx={53} cy={193} r={13} />
      <Circle cx={147} cy={193} r={13} />
      <Ellipse cx={75} cy={330} rx={17} ry={10} />
      <Ellipse cx={125} cy={330} rx={17} ry={10} />
    </>
  );
}
