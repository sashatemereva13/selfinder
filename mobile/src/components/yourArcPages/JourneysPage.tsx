import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { JourneySessionDTO, JourneyKey } from '../../types';
import { Locale } from '../../store/localeStore';
import { makeSharedArcPageStyles } from './arcPageShared';

interface JourneysPageProps {
  sessions: JourneySessionDTO[]; // completed only — caller (your-arc-past.tsx) only pushes this page when non-empty
  locale: Locale;
}

// The name each Journey shows on its own catalog row (products.tsx) —
// reused here rather than inventing separate copy, since it's the same
// name the person already knows the Journey by. Center isn't in
// products.tsx's own catalog (it lives on Your Arc directly, see that
// file's own 2026-08-28 comment) but still needs a label here.
const JOURNEY_LABEL_KEYS: Record<JourneyKey, string> = {
  center: 'center.title',
  control: 'products.controlLabel',
  'the-choice': 'products.theChoiceLabel',
  'the-loop': 'products.theLoopLabel',
  'whose-voice': 'products.whoseVoiceLabel',
  'the-road-not-taken': 'products.theRoadNotTakenLabel',
  'letting-go': 'products.lettingGoLabel',
  'the-mirror': 'products.theMirrorLabel',
  'the-unsaid': 'products.theUnsaidLabel',
  becoming: 'products.becomingLabel',
  'the-threshold': 'products.theThresholdLabel',
  'possible-selves': 'products.possibleSelvesLabel',
  enough: 'products.enoughLabel',
};

function formatDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === 'ru' ? 'ru-RU' : undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Every completed Journey, real content not just a tally (2026-08-30) —
// each individual Journey screen (Control, Center, ...) now only ever
// shows its own most recent result plus a "do it again" button; this is
// the one place the full history lives, matching Facts' own "browse in
// order" list and TimeConePage's "every reading, as a shape." A row's own
// began/shift/arrived content is read directly off the stored
// JourneySession — the same fields JourneyReflection.tsx already renders
// on each Journey's own completion screen, just laid out for an
// expandable row here instead of a full-screen reveal (JourneyReflection
// itself is built vertically-centered for a dedicated screen, not sized
// for inline use inside a list).
export function JourneysPage({ sessions, locale }: JourneysPageProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const sharedStyles = useMemo(() => makeSharedArcPageStyles(colors), [colors]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()),
    [sessions],
  );

  return (
    <ScrollView contentContainerStyle={sharedStyles.pageContent}>
      <Text style={sharedStyles.kicker}>{t('yourArc.journeysKicker')}</Text>
      <Text style={[sharedStyles.headline, { marginTop: spacing[3], marginBottom: spacing[6] }]}>
        {sorted.length > 0 ? t('yourArc.journeysIntroLine') : t('yourArc.journeysEmptyState')}
      </Text>

      {sorted.map((session) => {
        const isOpen = expandedId === session.id;
        const beganStage = session.stages[0];
        const arrivedStage = session.stages[session.stages.length - 1];
        const shiftStage = session.stages.find((s) => s.revealText);

        return (
          <View key={session.id} style={sharedStyles.wishSection}>
            <Pressable
              style={sharedStyles.wishRow}
              onPress={() => setExpandedId(isOpen ? null : session.id)}
            >
              <Text style={sharedStyles.dateLabel}>{formatDate(session.completedAt!, locale)}</Text>
              <Text style={sharedStyles.headline}>{t(JOURNEY_LABEL_KEYS[session.journey] ?? session.journey)}</Text>
            </Pressable>

            {isOpen && (
              <View style={{ marginTop: spacing[3], gap: spacing[3] }}>
                {beganStage?.finalAnswer && (
                  <View>
                    <Text style={sharedStyles.aside}>{t('journey.reflectionBegan')}</Text>
                    <Text style={sharedStyles.quoteText}>{`"${beganStage.finalAnswer}"`}</Text>
                  </View>
                )}
                {shiftStage?.revealText && (
                  <View>
                    <Text style={sharedStyles.aside}>{t('journey.reflectionShift')}</Text>
                    <Text style={sharedStyles.body}>{shiftStage.revealText}</Text>
                  </View>
                )}
                {arrivedStage?.finalAnswer && arrivedStage !== beganStage && (
                  <View>
                    <Text style={sharedStyles.aside}>{t('journey.reflectionArrived')}</Text>
                    <Text style={sharedStyles.quoteText}>{`"${arrivedStage.finalAnswer}"`}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
