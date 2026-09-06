import { useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { makeRng } from '../utils/auraDots';

// A few small spirals — the top-of-Depths use (direction="down") reads as
// an energy source reaching down onto the philosopher's name from above
// the screen's own top edge; the bottom-of-Depths use (direction="up",
// near Feeling Lucky) is the mirror image, rising and tightening as it
// climbs, echoing the big conical spiral's own upward direction rather
// than repeating the top's downward one — a bookend, not a straight
// repeat. Two earlier versions were tried first for the top placement: a
// dot-scatter (borrowed from AuraFigure's own dot language) read as
// unclear decoration with no body shape for the dots to scatter FROM, and
// a plain converging-line version read better but still generic. Small
// spirals tie the whole page together instead — one spiral motif at three
// scales (the big rising cone, and a small version at each end of the
// page) rather than unrelated devices. Deterministic per philosopher id
// (same seeding approach as generateAuraDots) so the exact paths don't
// reshuffle on every render. Static — no motion, per aesthetic.md's "no
// motion without meaning."
export function PhilosopherEnergy({
  seed,
  width = 140,
  height = 46,
  color = '#efe3cf',
  spiralCount = 3,
  direction = 'down',
}: {
  seed: string;
  width?: number;
  height?: number;
  color?: string;
  spiralCount?: number;
  direction?: 'down' | 'up';
}) {
  const paths = useMemo(() => {
    const rng = makeRng(seed);
    const targetX = width / 2;
    return Array.from({ length: spiralCount }, (_, i) => {
      // Each spiral's own center — spread evenly across the full width.
      const spread = width * 0.96;
      const cx = targetX + (i / Math.max(spiralCount - 1, 1) - 0.5) * spread + (rng() - 0.5) * 16;
      // The loose, open end of the spiral (the "source") sits near the
      // canvas edge it's meant to reach toward/from: near y=0 for a
      // downward spiral (arriving from above), near y=height for an
      // upward one (rising from below) — kept a few px inside the edge,
      // not clipped off it, so the full winding stays visible (an
      // earlier down-only version anchored this above y=0 and got
      // clipped by the status bar/notch on-device).
      const sourceY = direction === 'down' ? 1 + rng() * 3 : height - (1 + rng() * 3);
      // Looser, more open winding — bigger radius, fewer turns, than a
      // first, tighter-coiled pass that didn't read as a real spiral at
      // this small size.
      const maxR = 11 + rng() * 3;
      const turns = 1.15 + rng() * 0.35;
      const startAngle = rng() * Math.PI * 2;
      const steps = 40;
      // How far the tightening tail travels from the source toward the
      // opposite edge — down: toward the text below; up: toward the top
      // of the canvas, implying it keeps climbing past what's visible.
      const travel = direction === 'down' ? height - sourceY + 6 : sourceY + 6;
      let d = '';
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        // Radius decays with an ease-out curve (fast at first, slow near
        // the end) so the loops stay legible near the source and only
        // tighten into a fine point right at the very end, next to the
        // text — rather than shrinking to nothing halfway there.
        const decay = 1 - t;
        const r = maxR * decay ** 0.6;
        const theta = startAngle + t * turns * Math.PI * 2;
        const x = cx + r * Math.cos(theta);
        // Travel eases in (slow start, faster motion) so the spiral reads
        // as gathering in place before it moves — the same "gather, then
        // become" motion language the rest of the app uses, just
        // expressed as a static shape instead of an animation.
        const travelSigned = direction === 'down' ? t * t * travel : -(t * t * travel);
        const y = sourceY + r * Math.sin(theta) * 0.8 + travelSigned;
        d += `${s === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `;
      }
      return { d: d.trim(), opacity: 0.18 + rng() * 0.14 };
    });
  }, [seed, width, height, spiralCount, direction]);

  return (
    <Svg width={width} height={height} style={{ overflow: 'visible' }}>
      {paths.map((p, i) => (
        <Path
          key={i}
          d={p.d}
          fill="none"
          stroke={color}
          strokeOpacity={p.opacity}
          strokeWidth={1.2}
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
}
