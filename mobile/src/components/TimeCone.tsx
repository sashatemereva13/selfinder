import { useMemo, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Ellipse as SvgEllipse,
  Line,
  Circle as SvgCircle,
  Path,
  Text as SvgText,
  TextPath,
} from 'react-native-svg';
import { useThemeColors } from '../theme/useThemeColors';
import { fonts, fontSizes, letterSpacings } from '../theme/typography';

// Selfinder+'s own visual metaphor (see RULES.md, Product/positioning,
// 2026-08-14) — a light cone: a fixed past below, an open future above,
// meeting at "here and now." Borrowed deliberately as a STRUCTURAL SHAPE,
// never a physics claim (same "structural metaphor, no attached belief
// system" test docs/measure-experience-concept.md already applies to the
// cultural-symbol boundary) — this is positioning language rendered, not
// a scientific diagram. The cone's own lines/rims stay thin single-stroke
// wireframe, no fill, no gradient — matches AuraField.tsx/
// VibrationSpectrum.tsx's own standing convention (strokeWidth: 1, no
// fill). The past cone's individual DOTS are the one deliberate
// exception (2026-08-18): each reading point takes that reading's own
// real level color, the same "many real colors on one screen because
// it's showing many readings' worth of history, not one moment" license
// ArcKaleidoscope already has (see docs/design/aesthetic.md) — not a
// regression of the "one color per screen" rule, the same exception
// class as the kaleidoscope, now extended to this page since it merged
// with the facts page and inherited its "about the whole record" job.
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
  // "rgb(r,g,b)" for a reading point (its own real level color, same
  // useLevelColors() map ArcKaleidoscope/SphereArc/VibrationSpectrum all
  // draw from) or a wish point (the neutral accent — a wish has no
  // vibration level, so it never gets a level color; see colors.accent.
  // ivoryRgb). Falls back to colors.text.secondary (the past cone's
  // original fixed color) if omitted, so an older caller that hasn't been
  // updated to pass color still renders correctly.
  colorRgb?: string;
}

// Two cones, mirrored — TOP cone is the future (open, sparse, honest —
// never fabricated/projected, see RULES.md's existing "no expected
// trajectory" rule), BOTTOM cone is the past (dense, real, one point per
// remembered moment). The vertex where they meet is "here and now."
const RIM_RY_RATIO = 0.32; // ellipse foreshortening — matches AuraField's own "wide and flat, viewed from an angle" ratio family

// "Eternal now" plane sizing (showEternalNowPlane) — wider than the
// cone's own base (baseRx) so it visibly extends past the silhouette on
// both sides, matching the reference light-cone diagram's own "space"
// axis reading past the cone. Requires the caller to also pass a wider
// canvasWidth (see that prop's own comment) — without it this gets
// clipped by the SVG canvas edge, confirmed live (2026-09-05).
//
// 2026-09-05 (follow-up: "too subtle, make it more visible... looking at
// it from above"): rounder than the rim ellipses' own foreshortening
// (RIM_RY_RATIO=0.32) rather than flatter — a plane viewed nearly
// straight-on (from above, looking down its own normal) foreshortens
// LESS than a rim viewed edge-on, not more; the original 0.14 (flatter
// than the rims) was reading as a near-invisible sliver for exactly that
// reason. Opacity bumped to fully opaque (1) at the same time — the
// previous 0.8 combined with the ambient backdrop's own container-level
// opacity (see ArcLinePage's coneBackdrop) was reading as barely there.
const PLANE_RX_RATIO = 1.35;
const PLANE_RY_RATIO = 0.55;

// See curvedLabelPadding's own comment below for what this is for.
const CURVED_LABEL_PADDING = fontSizes.xs * 1.5;

// coneHeight used to be derived purely from baseRx (width/2 * 1.15),
// entirely independent of the `height` prop actually given to the SVG —
// confirmed live on a real device (2026-08-19) that this clipped both rim
// ellipses' tops/bottoms against the SVG's own viewBox boundary (viewBox
// is exactly `0 0 width height`, no margin), since futureRimY - baseRy
// and pastRimY + baseRy landed outside [0, height] for the width/height
// combination your-arc.tsx actually passes (260 × 338). Now coneHeight is
// derived from the real available vertical space (half the box, minus
// room for the rim ellipse's own vertical radius) so the whole shape —
// rims included — always fits inside the box it's given.
//
// NOW_LABEL_MARGIN (2026-08-20) reserves real horizontal space on the
// right for the "now" label, which moved from directly below the vertex
// to beside it (see the label's own render comment) — without shrinking
// the cone itself, the label's left position (centerX + baseRx + a few
// px) would land right at or past the box's own right edge for the
// width/height this component is actually given.
const NOW_LABEL_MARGIN = 34;

export function buildTimeConeGeometry(width: number, height: number) {
  const centerX = (width - NOW_LABEL_MARGIN) / 2;
  const vertexY = height / 2;
  const baseRx = (width - NOW_LABEL_MARGIN) / 2 - 4;
  const baseRy = baseRx * RIM_RY_RATIO;
  const coneHeight = Math.max(0, height / 2 - baseRy - 4);
  const futureRimY = vertexY - coneHeight;
  const pastRimY = vertexY + coneHeight;

  return { centerX, vertexY, baseRx, baseRy, coneHeight, futureRimY, pastRimY };
}

// Traces a SHORT arc across the TOP-center of an ellipse — from a point
// partway up-left of top-dead-center to the mirrored point up-right of
// it — rather than the whole ellipse. Explicitly left-to-right by
// construction (the path's own literal start/end points, not an inferred
// midpoint), so TextPath's startOffset="0%" is unambiguous: the actual
// start of the path, not a computed fraction that depends on how many
// arc segments came before it or which way a sweep flag bends.
//
// 2026-09-06 rewrite: the previous version built the FULL ellipse as two
// 180° `A` commands and located "top-center" via startOffset="25%"
// (documented in this function's own prior comment as "confirmed on
// web"). Confirmed live ON DEVICE (2026-09-06) that native rendered that
// same path/offset with the label mirrored/reversed — react-native-svg's
// native (Fabric) TextPath implementation evidently resolves the
// sweep-flag/arc-direction differently from its web fallback for a path
// this shape, even though the `d` string itself follows the SVG spec
// unambiguously. Rather than chase a platform-specific sweep-flag fix
// blind (no way to screenshot-verify native from here), this sidesteps
// the ambiguity entirely: a single, short, explicitly left-to-right arc
// with nothing before it in the path removes every place a
// direction-interpretation difference could hide.
//
// ARC_SPAN_RATIO controls how far around the ellipse (in each direction
// from top-center) the arc reaches — small enough that a short kicker
// label fits without wrapping most of the way around, wide enough that
// letters aren't crammed.
const ARC_SPAN_RATIO = 1.45;

// centerAngle (radians, 0 = top-dead-center, positive = toward the right)
// lets a caller slide the arc's own middle away from top-center — used
// by the plane's label (see its own call site) to land the arc off to
// the right side, clear of ArcLinePage's quote text which sits centered
// on this same ellipse. spanRatio overrides ARC_SPAN_RATIO per call —
// the plane's own label ("the eternal now") needs a NARROWER span than
// the default: widening the shared span enough to fit the future/past
// rim's longer labels (see ARC_SPAN_RATIO's own comment) pushed the
// plane's centerAngle needed to still clear the quote text far enough
// around the ellipse that the label started reading vertically instead
// of horizontally (confirmed live 2026-09-06) — a shorter span lets it
// stay both clear of the quote AND close enough to top-center to read
// roughly horizontally.
function topArcPathD(cx: number, cy: number, rx: number, ry: number, centerAngle = 0, spanRatio = ARC_SPAN_RATIO): string {
  const startAngle = centerAngle - spanRatio;
  const endAngle = centerAngle + spanRatio;
  const startX = cx + rx * Math.sin(startAngle);
  const startY = cy - ry * Math.cos(startAngle);
  const endX = cx + rx * Math.sin(endAngle);
  const endY = cy - ry * Math.cos(endAngle);
  return `M ${startX} ${startY} A ${rx} ${ry} 0 0 1 ${endX} ${endY}`;
}

// Same short arc, across the BOTTOM-center of the ellipse instead — for
// a label meant to sit along a shape's underside (the past rim's own
// front-facing curve) rather than its top. Endpoints below cy, sweep
// flag flipped so the arc still bows outward (away from center) along
// the bottom rather than caving inward.
function bottomArcPathD(cx: number, cy: number, rx: number, ry: number, centerAngle = 0, spanRatio = ARC_SPAN_RATIO): string {
  const startAngle = centerAngle - spanRatio;
  const endAngle = centerAngle + spanRatio;
  const startX = cx + rx * Math.sin(startAngle);
  const startY = cy + ry * Math.cos(startAngle);
  const endX = cx + rx * Math.sin(endAngle);
  const endY = cy + ry * Math.cos(endAngle);
  return `M ${startX} ${startY} A ${rx} ${ry} 0 0 0 ${endX} ${endY}`;
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
  // A lighter, non-navigating preview (2026-08-20 review: "the dots don't
  // make sense to anybody apart from me") — long-press shows a quick
  // date+level label without leaving the page; a plain tap (onPointPress)
  // still opens the full detail. Same past-points-only scope as
  // onPointPress — see that prop's own comment.
  onPointLongPress?: (id: string) => void;
  // Suppresses the built-in "now" label (2026-09-05, ArcLinePage's
  // ambient-background use of this component) — that page renders its
  // own "WHERE YOU ARE" label at the same vertex position as part of its
  // own zone copy, so the internal one would sit on top of/overlap it.
  // Defaults to shown (false) so TimeConePage's own usage is unaffected.
  hideNowLabel?: boolean;
  // Draws a wide, flat ellipse through the vertex, extending past the
  // cone's own silhouette on both sides (2026-09-05, ArcLinePage's
  // ambient use) — the classic "light cone" diagram's horizontal
  // space/"eternal now" plane cutting through past and future, which is
  // what actually reads as a 3D double-cone rather than a flat hourglass
  // outline (a plain two-triangle wireframe has no cue that the vertex is
  // a real cross-section, not just where two lines happen to meet).
  // Opt-in, default off, so TimeConePage's own real-data usage (dense
  // with reading dots already) isn't changed by this purely decorative
  // addition.
  showEternalNowPlane?: boolean;
  // Widens the SVG canvas beyond `width` (defaults to `width`, i.e. no
  // change) so the eternal-now plane can extend past the cone's own
  // silhouette without being clipped by the canvas edge — confirmed live
  // (2026-09-05) that giving the plane's own rx a ratio > 1 without this
  // just got cut off at the SVG boundary, since the canvas is exactly
  // `width` px wide. The cone's own geometry (baseRx etc.) still derives
  // from `width`, not `canvasWidth`, so the cone itself doesn't change
  // size — only the room around it does.
  canvasWidth?: number;
  // Draws each label CURVED along its own ellipse (2026-09-05 follow-up:
  // "could the text be literally drawn on the cone, so that it repeats
  // the cone's shape?") via SVG TextPath, rather than as separate flat RN
  // Text sitting near the shape. Opt-in and independent per ellipse —
  // omit any of the three to leave that one as a plain shape with no
  // label. Kept to short, uppercase, kicker-style strings in practice
  // (ArcLinePage's own usage) — TextPath follows letter-by-letter, so a
  // long sentence would read as increasingly distorted the further round
  // the ellipse it goes.
  curvedLabels?: {
    future?: string;
    past?: string;
    plane?: string;
  };
}

// onPointPress went unwired for a first static-only pass (2026-08-14:
// "static first... get the shape right before investing in animation/
// interaction"). Wired now (2026-08-19, review: "deeper information about
// every reading in particular should be available after pressing one of
// the dots") — a separate absolutely-positioned Pressable layer over the
// SVG, not onPress on the SVG circles themselves, same reasoning
// your-arc.tsx's own sparkline tapLayer already uses: react-native-svg
// shapes don't reliably take touch events at this marker size across
// platforms, plain Views/Pressables do.
// How close (px) a rendered point's center can get to the "now" label's own
// anchor position before the label is pushed further out to clear it.
// hashAngle-based scatter (see TimeConePoint's own comment on `angle`)
// means a point can land anywhere around the rim regardless of its depth —
// for a high-depth point whose angle happens to put it near cos(theta)≈0,
// its x lands close to centerX + baseRx, the same neighborhood the label's
// fixed `left` offset starts from (confirmed on a real device: a recent
// reading's dot sat almost touching the label). NOW_LABEL_MARGIN alone
// only ever cleared the CONE's own geometry, never an individual point's
// actual position, since points are scattered independently of it.
const NOW_LABEL_CLEARANCE = 16;
const NOW_LABEL_EXTRA_PUSH = 20;

export function TimeCone({ width, height, pastPoints, futurePoints, onPointPress, onPointLongPress, hideNowLabel, showEternalNowPlane, canvasWidth, curvedLabels }: TimeConeProps) {
  const colors = useThemeColors();
  const geometry = useMemo(() => buildTimeConeGeometry(width, height), [width, height]);
  const strokeColor = colors.text.faint;
  // Extra canvas width is split evenly on both sides so the cone's own
  // geometry (computed from `width` alone, unaware of canvasWidth) stays
  // centered in the wider box rather than shifting toward one edge.
  const svgWidth = canvasWidth ?? width;
  const canvasXOffset = (svgWidth - width) / 2;
  // Checks real rendered positions (not depth/angle inputs) against the
  // label's own default anchor — the actual collision only exists once
  // points are turned into screen coordinates, so this has to run after
  // that math, not try to predict it from raw depth/angle values.
  const nowLabelLeft = useMemo(() => {
    const defaultLeft = geometry.centerX + geometry.baseRx + 6;
    const labelY = geometry.vertexY - 6;
    const tooClose = [...pastPoints, ...futurePoints].some((p) => {
      const dir = futurePoints.includes(p) ? 'future' : 'past';
      const pos = timeConePointPosition(p, geometry, dir);
      const dx = pos.x - defaultLeft;
      const dy = pos.y - labelY;
      return Math.sqrt(dx * dx + dy * dy) < NOW_LABEL_CLEARANCE;
    });
    return tooClose ? defaultLeft + NOW_LABEL_EXTRA_PUSH : defaultLeft;
  }, [pastPoints, futurePoints, geometry]);
  // Same onPress-fires-after-onLongPress guard as TimeConeRing.tsx (see
  // its own comment) — kept here too even though this component currently
  // receives no handlers from your-arc.tsx, since it's the same shared
  // Pressable pattern and the bug would return the moment it's re-wired.
  const suppressNextPress = useRef<Set<string>>(new Set());

  // Curved labels' own ascenders (e.g. the "C" in "CALLING") extend a few
  // px above the future rim's topmost point / below the past rim's
  // bottommost point — the rim ITSELF fits inside [0, height] (see
  // buildTimeConeGeometry's own comment), but text drawn along an arc
  // sitting right at that boundary doesn't automatically get the same
  // headroom. Confirmed live (both web and on-device, 2026-09-06): the
  // top of "CALLING" was visibly clipped by the viewBox's own y=0 edge.
  // Only applied when curvedLabels is actually set — TimeConePage's real
  // usage never sets it and shouldn't have its own geometry/viewBox
  // shifted for a case that doesn't apply to it. The caller (ArcLinePage)
  // doesn't need to know about or compensate for this — its own
  // coneBackdrop wrapper has no explicit height/top, so this View simply
  // growing symmetrically (top and bottom) needs no adjustment anywhere
  // else (confirmed live 2026-09-06 after first trying, incorrectly, to
  // offset the parent to compensate for a height change it never needed
  // to know about).
  const curvedLabelPadding = curvedLabels ? CURVED_LABEL_PADDING : 0;

  return (
    <View style={{ width: svgWidth, height: height + curvedLabelPadding * 2 }}>
      {/* viewBox's own x-origin absorbs canvasXOffset (negative — shifts
          the visible window left so the geometry, still drawn at its
          original `width`-relative coordinates, appears centered in the
          wider canvas) rather than touching every geometry.centerX call
          site below. y-origin absorbs curvedLabelPadding the same way —
          negative so the extra room appears ABOVE y=0 (and the viewBox's
          own extra height reaches equally far below `height`), without
          moving any of the geometry itself, which is still computed
          purely from the original `height`. */}
      <Svg
        width={svgWidth}
        height={height + curvedLabelPadding * 2}
        viewBox={`${-canvasXOffset} ${-curvedLabelPadding} ${svgWidth} ${height + curvedLabelPadding * 2}`}
      >
        {/* Atmospheric-perspective depth cue (2026-08-20 review: "the cone
            is a bit too 2D") — the wireframe itself stays pure stroke, no
            fill (per this file's own standing rule), but each slant
            line's OPACITY now fades from bright at the vertex to faint at
            the rim, and the rim ellipses are fainter still — the same
            "things further away read as fainter" cue real atmospheric
            perspective uses, applied to line/stroke opacity rather than
            an actual fill gradient on the cone's surface. Two gradients
            (not one) since the future and past slant lines run opposite
            directions — SVG's gradient offset is a fixed 0..1 along its
            own defined vector, it can't be reversed per-shape without a
            second def. */}
        {/* Bounding-box-relative gradients (SVG default gradientUnits) —
            offset 0 is the shape's own bounding-box top (y=0), offset 1
            is its bottom (y=1), regardless of which direction a given
            line's own x1/x2 run. Future lines' bounding box has the RIM
            at the top (smaller Y, further from vertex) and the VERTEX at
            the bottom (larger Y) — so offset 0 (rim) must be the FAINT
            stop and offset 1 (vertex) the BRIGHT one for the vertex to
            read as closer/brighter. Past lines are the mirror: vertex is
            the bounding-box top, rim is the bottom. */}
        <Defs>
          <LinearGradient id="cone-fade-future" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={strokeColor} stopOpacity={0.15} />
            <Stop offset="1" stopColor={strokeColor} stopOpacity={0.7} />
          </LinearGradient>
          <LinearGradient id="cone-fade-past" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={strokeColor} stopOpacity={0.7} />
            <Stop offset="1" stopColor={strokeColor} stopOpacity={0.15} />
          </LinearGradient>
          {/* Path versions of the rim/plane ellipses, referenced by
              TextPath below (2026-09-05, curvedLabels) — TextPath's href
              only accepts a <Path>, not the <Ellipse> elements those
              shapes are actually drawn with, so each labeled ellipse gets
              a matching invisible path here purely to carry text. */}
          {curvedLabels?.future && (
            <Path
              id="cone-future-rim-path"
              d={topArcPathD(geometry.centerX, geometry.futureRimY, geometry.baseRx, geometry.baseRy)}
            />
          )}
          {curvedLabels?.past && (
            <Path
              id="cone-past-rim-path"
              d={bottomArcPathD(geometry.centerX, geometry.pastRimY, geometry.baseRx, geometry.baseRy)}
            />
          )}
          {curvedLabels?.plane && (
            // Narrower spanRatio than the future/past rims (0.55 vs the
            // shared ARC_SPAN_RATIO, widened for their longer labels) —
            // see topArcPathD's own comment on why the plane's shorter
            // "the eternal now" needs its own, smaller span: with the
            // shared wider span, clearing the quote text required a
            // centerAngle far enough around the ellipse that the label
            // read nearly vertically instead of horizontally (confirmed
            // live 2026-09-06). centerAngle 1.2 rad here (~70°) is
            // calibrated for THIS span, not the wider default.
            <Path
              id="cone-plane-path"
              d={topArcPathD(
                geometry.centerX,
                geometry.vertexY,
                geometry.baseRx * PLANE_RX_RATIO,
                geometry.baseRy * PLANE_RY_RATIO,
                1.35,
                0.75
              )}
            />
          )}
        </Defs>

        {/* Future cone — open, sparse by construction (only ever the
            active wish, never a fabricated forecast). Slant lines rise
            from the vertex to the future rim. */}
        <Line
          x1={geometry.centerX - geometry.baseRx}
          y1={geometry.futureRimY}
          x2={geometry.centerX}
          y2={geometry.vertexY}
          stroke="url(#cone-fade-future)"
          strokeWidth={1}
        />
        <Line
          x1={geometry.centerX + geometry.baseRx}
          y1={geometry.futureRimY}
          x2={geometry.centerX}
          y2={geometry.vertexY}
          stroke="url(#cone-fade-future)"
          strokeWidth={1}
        />
        <SvgEllipse
          cx={geometry.centerX}
          cy={geometry.futureRimY}
          rx={geometry.baseRx}
          ry={geometry.baseRy}
          fill="none"
          stroke={strokeColor}
          strokeOpacity={0.3}
          strokeWidth={1}
        />
        {/* startOffset 0% + textAnchor "start" — cone-future-rim-path IS
            the label's own arc now (topArcPathD), not a fraction of a
            larger ellipse path, so "the literal start of the path" is
            unambiguous on every platform (see topArcPathD's own comment
            for why this replaced the old 25%-of-a-full-ellipse approach,
            which rendered mirrored on native). */}
        {curvedLabels?.future && (
          <SvgText fill={colors.text.muted} fontFamily={fonts.medium} fontSize={fontSizes.xs} letterSpacing={2}>
            <TextPath href="#cone-future-rim-path" startOffset="0%" textAnchor="start">
              {curvedLabels.future.toUpperCase()}
            </TextPath>
          </SvgText>
        )}

        {/* Past cone — dense, real, one point per remembered moment (the
            person's own account of it, never asserted as raw fact — see
            RULES.md). Slant lines fall from the vertex to the past rim. */}
        <Line
          x1={geometry.centerX - geometry.baseRx}
          y1={geometry.pastRimY}
          x2={geometry.centerX}
          y2={geometry.vertexY}
          stroke="url(#cone-fade-past)"
          strokeWidth={1}
        />
        <Line
          x1={geometry.centerX + geometry.baseRx}
          y1={geometry.pastRimY}
          x2={geometry.centerX}
          y2={geometry.vertexY}
          stroke="url(#cone-fade-past)"
          strokeWidth={1}
        />
        <SvgEllipse
          cx={geometry.centerX}
          cy={geometry.pastRimY}
          rx={geometry.baseRx}
          ry={geometry.baseRy}
          fill="none"
          stroke={strokeColor}
          strokeOpacity={0.3}
          strokeWidth={1}
        />
        {/* Same startOffset 0% / textAnchor "start" reasoning as the
            future rim's own label above — cone-past-rim-path
            (bottomArcPathD) IS this label's own short arc, not a
            fraction of a longer path. */}
        {curvedLabels?.past && (
          <SvgText fill={colors.text.muted} fontFamily={fonts.medium} fontSize={fontSizes.xs} letterSpacing={2}>
            <TextPath href="#cone-past-rim-path" startOffset="0%" textAnchor="start">
              {curvedLabels.past.toUpperCase()}
            </TextPath>
          </SvgText>
        )}

        {/* The "eternal now" plane — a flat ellipse through the vertex,
            wider than the cone's own rims, reading as a horizontal
            cross-section the two cones share rather than just their
            meeting point. Wide/flat (PLANE_RX_RATIO/PLANE_RY_RATIO) so it
            visually extends past the cone's silhouette on both sides,
            same "space" axis the reference light-cone diagram draws —
            faint stroke, no fill, consistent with this file's own
            wireframe-only rule. */}
        {showEternalNowPlane && (
          <SvgEllipse
            cx={geometry.centerX}
            cy={geometry.vertexY}
            rx={geometry.baseRx * PLANE_RX_RATIO}
            ry={geometry.baseRy * PLANE_RY_RATIO}
            fill="none"
            stroke={strokeColor}
            strokeOpacity={1}
            strokeWidth={1}
          />
        )}
        {/* cone-plane-path is already built off-center (centerAngle 1.2,
            spanRatio 0.55 — see that Path's own comment) so its own
            start (0%) already sits off to the plane's right side, clear
            of ArcLinePage's centered quote text. Same startOffset 0% /
            textAnchor "start"
            reasoning as the future/past rim labels above. */}
        {curvedLabels?.plane && (
          <SvgText fill={colors.text.muted} fontFamily={fonts.medium} fontSize={fontSizes.xs} letterSpacing={2}>
            <TextPath href="#cone-plane-path" startOffset="0%" textAnchor="start">
              {curvedLabels.plane.toUpperCase()}
            </TextPath>
          </SvgText>
        )}

        {/* The vertex itself — "here and now." A small, bright dot, same
            "core orb" register AuraFigure's own chest glow uses for "this
            is the person." */}
        <SvgCircle cx={geometry.centerX} cy={geometry.vertexY} r={3} fill={colors.text.primary} />

        {pastPoints.map((p) => {
          const pos = timeConePointPosition(p, geometry, 'past');
          const fill = p.colorRgb ? `rgb(${p.colorRgb})` : colors.text.secondary;
          return <SvgCircle key={p.id} cx={pos.x} cy={pos.y} r={2.2} fill={fill} />;
        })}
        {futurePoints.map((p) => {
          const pos = timeConePointPosition(p, geometry, 'future');
          return <SvgCircle key={p.id} cx={pos.x} cy={pos.y} r={2.6} fill={colors.text.primary} />;
        })}
      </Svg>
      {/* "now" labels the vertex directly, not the page as a whole — this
          used to be a page-level "NOW" kicker sitting at the top of the
          screen, well above the actual vertex in the middle, which read
          as a mismatch between what the label named and where the thing
          it named actually was (review, 2026-08-19: "it's not clear why
          'now' is at the top while 'now' is represented by the center of
          the cone"). Positioned in plain RN Text (not SVG text — no
          existing pattern for that in this file).

          2026-08-20: moved from directly below the vertex dot to beside
          it (same vertical height, offset past the cone's own outer
          radius) — review: "the 'Now' is squeezed inside the cone, while
          it should be a bit outside." Sitting below the vertex put the
          label right where the future/past cones' own converging lines
          meet, visually crowded by the shape itself; beside the vertex,
          clear of both cones' lines, reads as pointing in at the dot from
          outside rather than being squeezed inside the geometry. */}
      {!hideNowLabel && (
        <Text
          style={[
            styles.nowLabel,
            { color: colors.text.faint, left: nowLabelLeft + canvasXOffset, top: geometry.vertexY - 6 },
          ]}
        >
          now
        </Text>
      )}
      {/* Tap targets for the past cone's own points only — pastPoints are
          real, distinct moments (a specific reading or wish) each worth
          opening into their own detail; futurePoints is always just the
          one active wish, already shown in full on "What calls you," so
          it has nothing further to reveal by tapping it here. */}
      {(onPointPress || onPointLongPress) && (
        <View style={{ position: 'absolute', left: canvasXOffset, width, height }} pointerEvents="box-none">
          {pastPoints.map((p) => {
            const pos = timeConePointPosition(p, geometry, 'past');
            return (
              <Pressable
                key={p.id}
                onPress={
                  onPointPress
                    ? () => {
                        if (suppressNextPress.current.has(p.id)) {
                          suppressNextPress.current.delete(p.id);
                          return;
                        }
                        onPointPress(p.id);
                      }
                    : undefined
                }
                onLongPress={
                  onPointLongPress
                    ? () => {
                        suppressNextPress.current.add(p.id);
                        onPointLongPress(p.id);
                      }
                    : undefined
                }
                hitSlop={10}
                style={{
                  position: 'absolute',
                  left: pos.x - 11,
                  top: pos.y - 11,
                  width: 22,
                  height: 22,
                }}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // No marginLeft/width/textAlign centering trick anymore (2026-08-20) —
  // those existed to center the label under a point; now that it sits
  // beside the vertex instead, left/top alone (set inline, computed from
  // real geometry) position it directly.
  nowLabel: {
    position: 'absolute',
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
});
