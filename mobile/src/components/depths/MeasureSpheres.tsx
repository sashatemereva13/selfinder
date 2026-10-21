import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn } from 'react-native-reanimated';
import { useThemeColors } from '../../theme/useThemeColors';
import type { Colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { auraBodyToPixel, getAuraFigureMetrics } from '../shared/AuraFigure';
import { AuraSettle } from './AuraSettle';

const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);
// AuraSettle draws the figure at this size (keep in step with it).
const FIGURE_SIZE = 140;
const FIGURE = getAuraFigureMetrics(FIGURE_SIZE);
// Room either side of the figure for the names.
const WIDTH = 300;
const OFFSET_X = (WIDTH - FIGURE.width) / 2;

// Where each sphere sits around the figure, in AuraFigure's 200×380 body
// space — roughly where Today shows them after a reading.
const SPHERES: { key: 'mind' | 'heart' | 'spirit' | 'body'; x: number; y: number; side: 'left' | 'right' }[] = [
  { key: 'mind', x: 30, y: 10, side: 'left' },
  { key: 'heart', x: 178, y: 112, side: 'right' },
  { key: 'spirit', x: -6, y: 168, side: 'left' },
  { key: 'body', x: 196, y: 262, side: 'right' },
];

// Measure's opening (2026-10-16): the figure, with the four spheres the
// four questions are about gathering in around it one after another —
// where they'll sit on Today once the reading exists. The screen shows
// "four questions — body, mind, heart, spirit" instead of saying it.
export function MeasureSpheres() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={{ width: WIDTH, height: FIGURE.height }}>
      <View style={{ position: 'absolute', left: OFFSET_X, top: 0 }}>
        <AuraSettle />
      </View>
      {SPHERES.map((sphere, i) => {
        const p = auraBodyToPixel(FIGURE_SIZE, sphere.x, sphere.y);
        const x = OFFSET_X + p.x;
        return (
          <Animated.View
            key={sphere.key}
            entering={FadeIn.delay(900 + i * 350).duration(800).easing(SOFT_EASE)}
            style={[
              styles.point,
              { top: p.y - 8 },
              sphere.side === 'left'
                ? { right: WIDTH - x - 4, flexDirection: 'row-reverse' }
                : { left: x - 4, flexDirection: 'row' },
            ]}
            pointerEvents="none"
          >
            <View style={[styles.dot, { backgroundColor: colors.text.secondary }]} />
            <Text style={styles.label}>{t(`common.sphere${sphere.key[0].toUpperCase()}${sphere.key.slice(1)}`)}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    point: { position: 'absolute', alignItems: 'center', gap: 8, height: 16 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    label: { color: colors.text.muted, fontFamily: fonts.light, fontSize: 12 },
  });
}
