import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../theme/useThemeColors';
import type { Colors } from '../theme/colors';
import { fonts, fontSizes, letterSpacings } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { sparklinePath, sparklineCoords, SPARKLINE_VIEW_W, SPARKLINE_VIEW_H } from './arcSparkline';
import { useLevelColors } from '../content/measureConfig';
import { SphereHistory } from '../utils/sphereHistory';
import { Sphere } from '../types';

// Named structure, not verdict — this component may say what a shape IS
// ("this is your mind-axis over time"), never what it MEANS ("you tend to
// lead with Mind"). See RULES.md's anti-profiling rule. Four sphere traces
// are shown as separate, stacked sparklines rather than overlaid on one
// plot specifically because overlaying them would need four distinct hues
// to tell the lines apart — exactly the "per-item color variety on a
// reading-scoped screen" docs/design/aesthetic.md forbids. Instead, each
// trace stays in the app's one level-color convention: every point is
// colored by whatever level THAT point actually was, the same rule
// VibrationSpectrum's onlySlugs already uses for a single reading, just
// extended across many readings instead of one.
const SPHERES: Sphere[] = ['body', 'mind', 'heart', 'spirit'];
const SPHERE_LABEL_KEYS: Record<Sphere, string> = {
  body: 'common.sphereBody',
  mind: 'common.sphereMind',
  heart: 'common.sphereHeart',
  spirit: 'common.sphereSpirit',
};
const TRACE_HEIGHT = 36;
const DOT_RADIUS = 1.4;

export function SphereArc({ history }: { history: SphereHistory }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const levelColors = useLevelColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const spheresWithData = SPHERES.filter((s) => history[s].length >= 2);
  if (spheresWithData.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{t('yourArc.sphereArcHeading')}</Text>
      {spheresWithData.map((sphere) => {
        const points = history[sphere];
        const scores = points.map((p) => p.vibrationScore);
        const d = sparklinePath(scores);
        const coords = sparklineCoords(scores);
        return (
          <View key={sphere} style={styles.traceRow}>
            <Text style={styles.traceLabel}>{t(SPHERE_LABEL_KEYS[sphere])}</Text>
            <Svg
              width="100%"
              height={TRACE_HEIGHT}
              viewBox={`0 0 ${SPARKLINE_VIEW_W} ${SPARKLINE_VIEW_H}`}
              preserveAspectRatio="none"
            >
              <Path
                d={d}
                fill="none"
                stroke={colors.text.faint}
                strokeOpacity={0.5}
                strokeWidth={0.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {coords.map((c, i) => (
                <SvgCircle
                  key={points[i].ts}
                  cx={c.x}
                  cy={c.y}
                  r={DOT_RADIUS}
                  fill={`rgb(${levelColors[points[i].levelSlug] ?? colors.accent.ivoryRgb})`}
                />
              ))}
            </Svg>
          </View>
        );
      })}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    wrap: { marginTop: spacing[8] },
    heading: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
      marginBottom: spacing[4],
    },
    traceRow: { marginBottom: spacing[5] },
    traceLabel: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      marginBottom: spacing[1],
    },
  });
}
