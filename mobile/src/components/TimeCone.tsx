import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Ellipse as SvgEllipse, Line, Circle as SvgCircle } from 'react-native-svg';
import { useThemeColors } from '../theme/useThemeColors';

// Selfinder+'s own visual metaphor (see RULES.md, Product/positioning,
// 2026-08-14) — a light cone: a fixed past below, an open future above,
// meeting at "here and now." Borrowed deliberately as a STRUCTURAL SHAPE,
// never a physics claim (same "structural metaphor, no attached belief
// system" test docs/measure-experience-concept.md already applies to the
// cultural-symbol boundary) — this is positioning language rendered, not
// a scientific diagram. Thin single-stroke wireframe, no fill, no
// gradient — matches AuraField.tsx/VibrationSpectrum.tsx's own
// standing convention (strokeWidth: 1, no fill) exactly, so this reads
// as the same family of shape as everything else Selfinder already
// draws, not a new visual language.
//
// Deliberately DIFFERENT from DepthsSpiral's own single, one-directional
// cone (wide base at the aura, narrow apex at Measure — the walk through
// Depths' 8 tools). That cone is about traversing a session; this one is
// about locating a moment in time. A double cone (hourglass) is visually
// distinct enough from a single funnel that the two can't be confused,
// and they live on different screens (Depths vs. Your Arc).
export interface TimeConePoint {
  id: string;
  // 0 = at the vertex (now), 1 = at the rim (oldest past / furthest
  // reaching future) — normalized so the geometry function doesn't need
  // to know anything about real dates; the caller (Your Arc) maps actual
  // timestamps to this range.
  depth: number;
  // Angular position around the cone's own axis, in turns (0..1) — purely
  // for visual spread so multiple points at similar depths don't stack on
  // the same spot. Not meaningful information; caller can assign stable
  // per-point values (e.g. a hash of the point's id) so a point doesn't
  // jump position across re-renders.
  angle: number;
  label?: string;
}

// Two cones, mirrored — TOP cone is the future (open, sparse, honest —
// never fabricated/projected, see RULES.md's existing "no expected
// trajectory" rule), BOTTOM cone is the past (dense, real, one point per
// remembered moment). The vertex where they meet is "here and now."
const CONE_HEIGHT_RATIO = 1.15; // each cone's own height, relative to its base radius
const RIM_RY_RATIO = 0.32; // ellipse foreshortening — matches AuraField's own "wide and flat, viewed from an angle" ratio family

export function buildTimeConeGeometry(width: number, height: number) {
  const centerX = width / 2;
  const vertexY = height / 2;
  const baseRx = width / 2 - 4;
  const baseRy = baseRx * RIM_RY_RATIO;
  const coneHeight = baseRx * CONE_HEIGHT_RATIO;
  const futureRimY = vertexY - coneHeight;
  const pastRimY = vertexY + coneHeight;

  return { centerX, vertexY, baseRx, baseRy, coneHeight, futureRimY, pastRimY };
}

// Maps a normalized point (depth 0..1, angle 0..1 turns) onto one cone's
// slanted surface — pure parametric ellipse-on-a-cone math, same
// "one geometry function, many consumers" discipline as
// vibrationSpectrumDotPosition/spiralPointPosition elsewhere in this
// codebase. `direction` picks which cone (future rises, past falls).
export function timeConePointPosition(
  point: TimeConePoint,
  geometry: ReturnType<typeof buildTimeConeGeometry>,
  direction: 'past' | 'future'
): { x: number; y: number } {
  const { centerX, vertexY, baseRx, baseRy, coneHeight } = geometry;
  const depth = Math.max(0, Math.min(1, point.depth));
  const rx = baseRx * depth;
  const ry = baseRy * depth;
  const y = direction === 'future' ? vertexY - coneHeight * depth : vertexY + coneHeight * depth;
  const theta = point.angle * Math.PI * 2;
  const x = centerX + rx * Math.cos(theta);
  const yOffset = ry * Math.sin(theta);
  return { x, y: y + yOffset };
}

interface TimeConeProps {
  width: number;
  height: number;
  pastPoints: TimeConePoint[];
  futurePoints: TimeConePoint[];
  onPointPress?: (id: string) => void;
}

// onPointPress is accepted but not wired to a tap target yet — this pass
// is deliberately static (see collaboration notes, 2026-08-14: "static
// first... get the shape right before investing in animation/
// interaction"). Kept on the prop contract now so a later interactive
// pass doesn't need to change every call site's signature.
export function TimeCone({ width, height, pastPoints, futurePoints }: TimeConeProps) {
  const colors = useThemeColors();
  const geometry = useMemo(() => buildTimeConeGeometry(width, height), [width, height]);
  const strokeColor = colors.text.faint;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Future cone — open, sparse by construction (only ever the
            active wish, never a fabricated forecast). Slant lines rise
            from the vertex to the future rim. */}
        <Line
          x1={geometry.centerX - geometry.baseRx}
          y1={geometry.futureRimY}
          x2={geometry.centerX}
          y2={geometry.vertexY}
          stroke={strokeColor}
          strokeWidth={1}
        />
        <Line
          x1={geometry.centerX + geometry.baseRx}
          y1={geometry.futureRimY}
          x2={geometry.centerX}
          y2={geometry.vertexY}
          stroke={strokeColor}
          strokeWidth={1}
        />
        <SvgEllipse
          cx={geometry.centerX}
          cy={geometry.futureRimY}
          rx={geometry.baseRx}
          ry={geometry.baseRy}
          fill="none"
          stroke={strokeColor}
          strokeOpacity={0.55}
          strokeWidth={1}
        />

        {/* Past cone — dense, real, one point per remembered moment (the
            person's own account of it, never asserted as raw fact — see
            RULES.md). Slant lines fall from the vertex to the past rim. */}
        <Line
          x1={geometry.centerX - geometry.baseRx}
          y1={geometry.pastRimY}
          x2={geometry.centerX}
          y2={geometry.vertexY}
          stroke={strokeColor}
          strokeWidth={1}
        />
        <Line
          x1={geometry.centerX + geometry.baseRx}
          y1={geometry.pastRimY}
          x2={geometry.centerX}
          y2={geometry.vertexY}
          stroke={strokeColor}
          strokeWidth={1}
        />
        <SvgEllipse
          cx={geometry.centerX}
          cy={geometry.pastRimY}
          rx={geometry.baseRx}
          ry={geometry.baseRy}
          fill="none"
          stroke={strokeColor}
          strokeOpacity={0.55}
          strokeWidth={1}
        />

        {/* The vertex itself — "here and now." A small, bright dot, same
            "core orb" register AuraFigure's own chest glow uses for "this
            is the person." */}
        <SvgCircle cx={geometry.centerX} cy={geometry.vertexY} r={3} fill={colors.text.primary} />

        {pastPoints.map((p) => {
          const pos = timeConePointPosition(p, geometry, 'past');
          return <SvgCircle key={p.id} cx={pos.x} cy={pos.y} r={2.2} fill={colors.text.secondary} />;
        })}
        {futurePoints.map((p) => {
          const pos = timeConePointPosition(p, geometry, 'future');
          return <SvgCircle key={p.id} cx={pos.x} cy={pos.y} r={2.6} fill={colors.text.primary} />;
        })}
      </Svg>
    </View>
  );
}
