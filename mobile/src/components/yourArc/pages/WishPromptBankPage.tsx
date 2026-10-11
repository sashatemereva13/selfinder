import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useThemeColors } from '../../../theme/useThemeColors';
import type { Colors } from '../../../theme/colors';
import { fonts, fontSizes, lineHeights } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { Locale } from '../../../store/localeStore';
import { WISH_PROMPTS, WishPromptDomain, WishPromptEntry } from '../../../content/wishPrompts';
import { makeSharedArcPageStyles } from './arcPageShared';

interface WishPromptBankPageProps {
  locale: Locale;
  onPickPrompt: (prompt: WishPromptEntry) => void;
  onClose: () => void;
}

const DOMAIN_ORDER: WishPromptDomain[] = ['work', 'love', 'family', 'body', 'money', 'leisure'];

const DOMAIN_LABEL_KEYS: Record<WishPromptDomain, string> = {
  work: 'yourArc.wishPromptDomainWork',
  love: 'yourArc.wishPromptDomainLove',
  family: 'yourArc.wishPromptDomainFamily',
  body: 'yourArc.wishPromptDomainBody',
  money: 'yourArc.wishPromptDomainMoney',
  leisure: 'yourArc.wishPromptDomainLeisure',
};

// A full scrollable list, grouped by domain, deliberately NOT modeled on
// Cards' own single-random-draw screen (see wishPrompts.ts's own header
// comment for the full reasoning — recognition over generation is the
// whole point here, so everything is visible/scrollable from the start,
// nothing drawn one at a time). Plain-text group labels, no bordered/
// filled boxes per aesthetic.md's "no cards" rule — spacing and
// typography separate the domains, same as everywhere else in this
// pager. Picking a prompt only ever closes the bank and hands the picked
// entry back to the caller (WishCrossingPage prefills its own free-text
// input with it) — never saved directly from here, never auto-submitted.
export function WishPromptBankPage({ locale, onPickPrompt, onClose }: WishPromptBankPageProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const sharedStyles = useMemo(() => makeSharedArcPageStyles(colors), [colors]);

  const grouped = useMemo(() => {
    return DOMAIN_ORDER.map((domain) => ({
      domain,
      entries: WISH_PROMPTS.filter((entry) => entry.domain === domain),
    })).filter((group) => group.entries.length > 0);
  }, []);

  return (
    <ScrollView contentContainerStyle={sharedStyles.pageContent}>
      <Pressable style={sharedStyles.wishRow} onPress={onClose}>
        <Text style={sharedStyles.wishRowText}>{t('yourArc.wishPromptBankClose')}</Text>
      </Pressable>
      <Text style={[sharedStyles.kicker, { marginTop: spacing[6] }]}>{t('yourArc.wishPromptBankKicker')}</Text>
      <Text style={[sharedStyles.body, { marginTop: spacing[2], marginBottom: spacing[6] }]}>
        {t('yourArc.wishPromptBankIntro')}
      </Text>

      {grouped.map((group) => (
        <View key={group.domain} style={{ marginBottom: spacing[6] }}>
          <Text style={sharedStyles.wishHeading}>{t(DOMAIN_LABEL_KEYS[group.domain])}</Text>
          {group.entries.map((entry) => (
            <Pressable
              key={entry.id}
              style={{ paddingVertical: spacing[2] }}
              onPress={() => onPickPrompt(entry)}
            >
              <Text
                style={{
                  color: colors.text.secondary,
                  fontFamily: fonts.voice,
                  fontSize: fontSizes.sm,
                  lineHeight: fontSizes.sm * lineHeights.normal,
                }}
              >
                {entry.text[locale] ?? entry.text.en}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
