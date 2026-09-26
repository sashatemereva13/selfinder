import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../../src/theme/useThemeColors';
import { fonts } from '../../src/theme/typography';
import { useAppAccentTextRgb } from '../../src/utils/appAccent';
import { DepthsTabIcon, JourneysTabIcon, YourArcTabIcon } from '../../src/components/shared/TabIcons';
import { MapBar, MapBarProps } from '../../src/components/map/MapBar';

// Guide and You no longer have bottom-tab slots — see
// docs/app-architecture-concept.md. Guide is reached via the persistent
// philosopher-presence affordance on Depths (Phase 2), You via the
// profile icon (Phase 5). This tab bar is now Depths / Journeys / Your Arc.
export default function TabsLayout() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  // Text-safe variant, not useAppAccentRgb() — this one color paints both
  // the tab icon (decorative) and its label text (needs AA contrast), and
  // RN's tab bar API only accepts a single tint for both, so the text
  // requirement is the one that governs here.
  const accentRgb = useAppAccentTextRgb();
  const activeColor = `rgb(${accentRgb})`;

  return (
    <Tabs
      // The minimap (2026-09-26, RULES.md "Navigation is a map") draws the
      // tab bar's space as a small copy of the full map. The icons/labels
      // below still describe each tab for anything that reads them (and
      // MapBar reuses the same icon components).
      tabBar={(props) => <MapBar {...(props as unknown as MapBarProps)} />}
      screenOptions={{
        headerShown: false,
        // The app's own background behind every tab's scene, not the
        // navigator's default white — without it, the moment the minimap
        // hides on Measure (see MapBar) the freed space flashed white.
        sceneStyle: { backgroundColor: colors.bg.base },
        // Moving between the three places on the minimap fades rather than
        // cutting — the same way every screen now arrives (see
        // src/theme/transitions.ts).
        animation: 'fade',
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
          tabBarAccessibilityLabel: t('common.tabDepths'),
          tabBarIcon: ({ color }) => <DepthsTabIcon color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="journeys"
        options={{
          title: t('common.tabJourneys'),
          tabBarAccessibilityLabel: t('common.tabJourneys'),
          tabBarIcon: ({ color }) => <JourneysTabIcon color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="your-arc"
        options={{
          title: t('common.tabYourArc'),
          tabBarAccessibilityLabel: t('common.tabYourArc'),
          tabBarIcon: ({ color }) => <YourArcTabIcon color={color as string} />,
        }}
      />
    </Tabs>
  );
}
