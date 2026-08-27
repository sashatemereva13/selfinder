import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../../src/theme/useThemeColors';
import { fonts } from '../../src/theme/typography';
import { useAppAccentRgb } from '../../src/utils/appAccent';
import { DepthsTabIcon, JourneysTabIcon, YourArcTabIcon } from '../../src/components/TabIcons';

// Guide and You no longer have bottom-tab slots — see
// docs/app-architecture-concept.md. Guide is reached via the persistent
// philosopher-presence affordance on Depths (Phase 2), You via the
// profile icon (Phase 5). This tab bar is now Depths / Journeys / Your Arc.
export default function TabsLayout() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const accentRgb = useAppAccentRgb();
  const activeColor = `rgb(${accentRgb})`;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg.base,
          borderTopColor: colors.bg.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor:   activeColor,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: {
          fontFamily: fonts.light,
          fontSize: 10,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="depths"
        options={{
          title: t('common.tabDepths'),
          tabBarIcon: ({ color }) => <DepthsTabIcon color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="journeys"
        options={{
          title: t('common.tabJourneys'),
          tabBarIcon: ({ color }) => <JourneysTabIcon color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="your-arc"
        options={{
          title: t('common.tabYourArc'),
          tabBarIcon: ({ color }) => <YourArcTabIcon color={color as string} />,
        }}
      />
    </Tabs>
  );
}
