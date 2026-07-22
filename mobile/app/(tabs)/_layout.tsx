import { Tabs } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { usePhilosopherStore } from '../../src/store/philosopherStore';

export default function TabsLayout() {
  const { philosopher, metPhilosopherIds } = usePhilosopherStore();
  const activeColor = philosopher?.color ?? colors.brand.purple;
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
        options={{ title: 'Depths' }}
      />
      <Tabs.Screen
        name="guide"
        options={{
          title: 'Guide',
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
        options={{ title: 'You' }}
      />
    </Tabs>
  );
}
