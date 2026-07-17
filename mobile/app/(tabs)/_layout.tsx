import { Tabs } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { usePhilosopherStore } from '../../src/store/philosopherStore';

export default function TabsLayout() {
  const { philosopher } = usePhilosopherStore();
  const activeColor = philosopher?.color ?? colors.brand.purple;

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
        options={{ title: 'Guide' }}
      />
      <Tabs.Screen
        name="you"
        options={{ title: 'You' }}
      />
    </Tabs>
  );
}
