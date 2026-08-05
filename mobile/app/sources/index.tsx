import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, Pressable, Linking, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { AmbientGlow } from '../../src/components/AmbientGlow';

interface Source {
  name: string;
  work: string;
  note: string;
  url?: string;
}

// One entry per named person/framework actually referenced in the app's
// level content (src/content/levelsContent.ts) — added in response to
// Apple App Review Guideline 1.4.1, which flagged referenced psychological/
// wellness concepts with no citation. Kept as a flat list rather than
// grouped by level, since several sources (Hawkins especially) span many
// levels and a per-level breakdown would just repeat the same handful of
// entries seventeen times.
const SOURCES: Source[] = [
  {
    name: 'David R. Hawkins, M.D., Ph.D.',
    work: 'Power vs. Force: The Hidden Determinants of Human Behavior (1995)',
    note: "The seventeen-level map of consciousness — shame through enlightenment — is Hawkins' own framework, adapted for Selfinder's Levels screen and each level's longer \"Going deeper\" section. This is his stated methodology and worldview, not independently peer-reviewed science; his core measurement method (applied kinesiology / \"muscle testing\") in particular has not been validated in controlled studies and is not accepted by mainstream psychology or medicine. It's included here as an attributed source, not as a verified clinical claim.",
    url: 'https://www.google.com/search?q=%22Power+vs.+Force%22+David+R.+Hawkins',
  },
  {
    name: 'Marsha M. Linehan, Ph.D.',
    work: 'Cognitive-Behavioral Treatment of Borderline Personality Disorder (1993); the development of Dialectical Behavior Therapy (DBT)',
    note: 'Referenced on the Acceptance level for the distinction between pain and suffering, and acceptance as a precondition for change rather than a replacement for it.',
    url: 'https://behavioraltech.org/',
  },
  {
    name: 'Jessica L. Tracy, Ph.D. — UBC Emotion & Self Lab',
    work: 'Take Pride: Why the Deadliest Sin Holds the Secret to Human Success (2016), and her published research on authentic vs. hubristic pride',
    note: 'Referenced on the Pride level for the distinction between earned/authentic pride and defensive/hubristic pride.',
    url: 'https://ubc-emotionlab.ca/',
  },
  {
    name: 'Brené Brown, Ph.D., LMSW',
    work: 'I Thought It Was Just Me (But It Isn’t) (2007); Daring Greatly (2012); her published shame-resilience research',
    note: 'Referenced on the Shame and Guilt levels for the distinction between guilt ("I did something bad") and shame ("I am bad"), and for the finding that shame loses power when spoken aloud to someone who responds with empathy.',
    url: 'https://brenebrown.com/research/',
  },
  {
    name: 'Elisabeth Kübler-Ross, M.D.',
    work: 'On Death and Dying (1969) — the origin of the "five stages of grief"',
    note: 'Referenced on the Grief level. The stages are a widely-known framework for naming what grief can involve, not a fixed sequence everyone moves through in order.',
    url: 'https://www.ekrfoundation.org/',
  },
  {
    name: 'Sigmund Freud',
    work: 'The Ego and the Id (1923) — the concept of the superego',
    note: "Referenced on the Guilt level for the idea that guilt originates from internalized judgment (the superego), a foundational but historical psychoanalytic concept, not a settled finding of modern clinical psychology.",
    url: 'https://www.google.com/search?q=Freud+%22The+Ego+and+the+Id%22+superego',
  },
];

export default function SourcesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
    >
      <AmbientGlow />
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Text style={styles.backLink}>{t('common.back')}</Text>
      </Pressable>

      <Text style={styles.title}>{t('sources.title')}</Text>

      <Text style={styles.disclaimer}>{t('sources.disclaimer')}</Text>

      <Text style={styles.sectionHeading}>{t('sources.sectionHeading')}</Text>

      {SOURCES.map((source) => (
        <View key={source.name} style={styles.sourceBlock}>
          <Text style={styles.sourceName}>{source.name}</Text>
          <Text style={styles.sourceWork}>{source.work}</Text>
          <Text style={styles.sourceNote}>{source.note}</Text>
          {source.url && (
            <Pressable onPress={() => Linking.openURL(source.url!)}>
              <Text style={styles.sourceLink}>{source.url}</Text>
            </Pressable>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  backRow: { paddingBottom: spacing[8] },
  backLink: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.tight,
    marginBottom: spacing[5],
  },
  disclaimer: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.loose,
    marginBottom: spacing[8],
  },
  sectionHeading: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
    marginBottom: spacing[5],
  },
  sourceBlock: { marginBottom: spacing[8] },
  sourceName: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    marginBottom: spacing[1],
  },
  sourceWork: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    marginBottom: spacing[2],
  },
  sourceNote: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.loose,
    marginBottom: spacing[2],
  },
  sourceLink: {
    color: colors.accent.ivory,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
  },
});
