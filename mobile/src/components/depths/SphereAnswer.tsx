import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { PhilosopherObject } from '../shared/PhilosopherObject';

// What someone said for one sphere, in Depths' reflection space
// (2026-10-08): only their own words — no "You said", no label row; the
// glowing sphere on the body already says which part of them this is. The
// few words the reading was based on (MeasureLine.evidence, verbatim,
// checked by the backend) are lit in the sphere's colour — where the
// reading came from, never a claim about the person. Under it, the
// question the person can ask their philosopher about it, sent when
// tapped.

const LONG = 180;

// A long answer is cut to the sentence holding the lit words (or its first
// sentence), with "…" where something was left out; tapping it shows the
// whole answer.
function excerptOf(answer: string, evidence: string | null | undefined) {
  if (answer.length <= LONG) return null;
  const sentences = answer.match(/[^.!?…]+[.!?…]*\s*/g) ?? [answer];
  const i = evidence ? sentences.findIndex((s) => s.includes(evidence)) : 0;
  if (i === -1) return null;
  const body = sentences[i].trim();
  return `${i > 0 ? '… ' : ''}${body}${i < sentences.length - 1 ? ' …' : ''}`;
}

export function SphereAnswer({
  answer,
  evidence,
  color,
  philosopherId,
  philosopherRgb,
  question,
  showBackHint,
  backHint,
  askLabel,
  onAsk,
}: {
  answer: string;
  evidence?: string | null;
  color: string;
  philosopherId?: string;
  philosopherRgb: string;
  question: string | null;
  showBackHint: boolean;
  backHint: string;
  askLabel: string;
  onAsk: () => void;
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(false);

  const excerpt = excerptOf(answer, evidence);
  const text = expanded || !excerpt ? answer : excerpt;
  const at = evidence ? text.indexOf(evidence) : -1;

  const words = (
    <Text style={styles.answer} numberOfLines={expanded ? undefined : 7}>
      “
      {at === -1 ? (
        text
      ) : (
        <>
          {text.slice(0, at)}
          <Text style={{ color }}>{evidence}</Text>
          {text.slice(at + evidence!.length)}
        </>
      )}
      ”
    </Text>
  );

  return (
    <View>
      {excerpt ? (
        <Pressable onPress={() => setExpanded((e) => !e)} accessibilityRole="button">
          {words}
        </Pressable>
      ) : (
        words
      )}
      {/* The person's own question to their philosopher, sent when
          tapped — under a small "Ask …" so it's clear who is asking
          whom (2026-10-08, from testing). */}
      {question && philosopherId && (
        <Pressable onPress={onAsk} accessibilityRole="button" hitSlop={spacing[2]} style={styles.ask}>
          <View style={styles.byline}>
            <PhilosopherObject id={philosopherId} rgb={philosopherRgb} size={14} />
            <Text style={styles.name}>{askLabel}</Text>
          </View>
          <Text style={styles.question}>
            {question} <Text style={{ color: `rgb(${philosopherRgb})` }}>→</Text>
          </Text>
        </Pressable>
      )}
      {showBackHint && <Text style={styles.backHint}>{backHint}</Text>}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    answer: {
      color: colors.text.primary,
      fontFamily: fonts.voice,
      fontSize: fontSizes.base,
      lineHeight: fontSizes.base * 1.45,
      marginTop: spacing[2],
    },
    ask: { marginTop: spacing[5], gap: spacing[1] },
    byline: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
    name: { color: colors.text.muted, fontFamily: fonts.medium, fontSize: 10 },
    question: {
      color: colors.text.secondary,
      fontFamily: fonts.medium,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * 1.45,
    },
    backHint: { color: colors.text.faint, fontFamily: fonts.light, fontSize: 10, marginTop: spacing[4] },
  });
}
