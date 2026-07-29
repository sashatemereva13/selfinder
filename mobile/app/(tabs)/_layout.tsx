import { Tabs } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { usePhilosopherStore } from '../../src/store/philosopherStore';
import { useAppAccentRgb } from '../../src/utils/appAccent';
import { DepthsTabIcon, GuideTabIcon, YouTabIcon } from '../../src/components/TabIcons';

export default function TabsLayout() {
  const { philosopher, metPhilosopherIds } = usePhilosopherStore();
  const accentRgb = useAppAccentRgb();
  const activeColor = `rgb(${accentRgb})`;
  // A first-meeting message is waiting in Guide — the badge clears itself
  // the moment they open it, since that's exactly when markMet fires.
  const hasUnmetPhilosopher = !!philosopher && !metPhilosopherIds.includes(philosopher.id);

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
          title: 'Depths',
          tabBarIcon: ({ color }) => <DepthsTabIcon color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="guide"
        options={{
          title: 'Guide',
          tabBarIcon: ({ color }) => <GuideTabIcon color={color as string} />,
          tabBarBadge: hasUnmetPhilosopher ? '' : undefined,
          tabBarBadgeStyle: {
            backgroundColor: activeColor,
            minWidth: 8,
            height: 8,
            borderRadius: 4,
            marginTop: 2,
          },
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: 'You',
          tabBarIcon: ({ color }) => <YouTabIcon color={color as string} />,
        }}
      />
    </Tabs>
  );
}
