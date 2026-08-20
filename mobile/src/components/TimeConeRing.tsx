import { useMemo } from 'react';
import { View, Pressable } from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { useThemeColors } from '../theme/useThemeColors';
import { TimeConePoint } from './TimeCone';

// The "rotated" view of one of TimeCone's own rims — not a second chart,
// the SAME points TimeCone already draws, seen face-on instead of edge-on
// (review, 2026-08-20: "what if, on the cone screen, it will be possible
// to rotate the cone... to see the bottom and top circles as surfaces
// with readings/wishes on them"). This exists because the previous
// "Every walk" sparkline page was a real, longstanding violation of
// Selfinder's own anti-ranking rule: its y-coordinate was literally the
// vibration score (arcSparkline.ts's sparklineCoords maps score directly
// to vertical position), the exact "up is more/better, down is less/
// worse" convention RULES.md/aesthetic.md ban everywhere else on
// purpose. A flat, unranked ring of every point — no vertical axis at
// all — is what a "graph of every reading" can look like without
// smuggling that ranking back in.
//
// Deliberately a SEPARATE component from TimeCone, not a mode/prop on
// it — see this file's own header note on why a crossfade between two
// fully-rendered views (not live geometry animation) was the chosen
// approach: animating every dot's position continuously through a 3D-ish
// rotation is real per-frame work that gets harder to keep smooth as
// reading count grows; two static layouts cross-fading is far more
// reliable and still reads as "the same data, seen differently."
//
// angle is REDISTRIBUTED evenly here, not read from each point's own
// (meaningless, hash-based) angle — TimeCone's angle exists only to keep
// points from stacking on a side-view ellipse; once every point sits on
// one flat, undistorted ring, even spacing is what actually reads as "a
// full circle of moments," and there is deliberately no depth/date
// information encoded in a face-on point's position at all (confirmed
// with the user: "the readings and wishes will be all positioned on the
// circle, no time attached, though").
interface TimeConeRingProps {
  size: number;
  points: TimeConePoint[];
  onPointPress?: (id: string) => void;
  onPointLongPress?: (id: string) => void;
}

export function TimeConeRing({ size, points, onPointPress, onPointLongPress }: TimeConeRingProps) {
  const colors = useThemeColors();
  const cx = size / 2;
  const cy = size / 2;
  const ringR = size * 0.42;
  const strokeColor = colors.text.faint;

  const positions = useMemo(
    () =>
      points.map((p, i) => {
        const theta = ((i / Math.max(points.length, 1)) * 360 - 90) * (Math.PI / 180);
        return { point: p, x: cx + ringR * Math.cos(theta), y: cy + ringR * Math.sin(theta) };
      }),
    [points, cx, cy, ringR]
  );

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* The ring itself — same thin-stroke, no-fill wireframe
            convention TimeCone's own rims already use, just drawn as a
            true circle instead of a foreshortened ellipse. */}
        <SvgCircle cx={cx} cy={cy} r={ringR} fill="none" stroke={strokeColor} strokeOpacity={0.4} strokeWidth={1} />
        {/* The center point — echoes TimeCone's own vertex dot, so this
            still reads as "the same axis, from a different angle," not
            an unrelated new shape. No "now" label here — face-on, the
            center isn't really "now" in the same felt sense (there's no
            time axis left to place it on), it's just the ring's own
            middle. */}
        <SvgCircle cx={cx} cy={cy} r={2} fill={colors.text.primary} fillOpacity={0.4} />
        {positions.map(({ point, x, y }) => {
          const fill = point.colorRgb ? `rgb(${point.colorRgb})` : colors.text.secondary;
          return <SvgCircle key={point.id} cx={x} cy={y} r={2.6} fill={fill} />;
        })}
      </Svg>
      {(onPointPress || onPointLongPress) && (
        <View style={{ position: 'absolute', width: size, height: size }} pointerEvents="box-none">
          {positions.map(({ point, x, y }) => (
            <Pressable
              key={point.id}
              onPress={onPointPress ? () => onPointPress(point.id) : undefined}
              onLongPress={onPointLongPress ? () => onPointLongPress(point.id) : undefined}
              hitSlop={10}
              style={{ position: 'absolute', left: x - 11, top: y - 11, width: 22, height: 22 }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
