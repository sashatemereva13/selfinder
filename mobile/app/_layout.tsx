import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { usePhilosopherStore } from '../src/store/philosopherStore';
import { useMeasureStore } from '../src/store/measureStore';
import { useAuthStore } from '../src/store/authStore';
import { useReminderStore } from '../src/store/reminderStore';
import { useEngagementStore } from '../src/store/engagementStore';
import { useSubscriptionStore } from '../src/store/subscriptionStore';
import { useLocaleStore } from '../src/store/localeStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Panchang-Light':  require('../assets/fonts/Panchang-Light.ttf'),
    'Panchang-Medium': require('../assets/fonts/Panchang-Medium.ttf'),
  });

  const { hydrated: philoHydrated, hydrate: hydratePhilo, philosopher } = usePhilosopherStore();
  const { hydrated: measureHydrated, hydrate: hydrateMeasure } = useMeasureStore();
  const { hydrated: authHydrated, hydrate: hydrateAuth } = useAuthStore();
  const { hydrated: reminderHydrated, hydrate: hydrateReminder, refreshWindow } = useReminderStore();
  const { hydrated: engagementHydrated, hydrate: hydrateEngagement } = useEngagementStore();
  const { hydrated: subscriptionHydrated, hydrate: hydrateSubscription } = useSubscriptionStore();
  const { hydrated: localeHydrated, hydrate: hydrateLocale } = useLocaleStore();
  const router   = useRouter();
  const segments = useSegments();

  useEffect(() => {
    hydratePhilo();
    hydrateMeasure();
    hydrateAuth();
    hydrateReminder();
    hydrateEngagement();
    hydrateSubscription();
    hydrateLocale();
  }, []);

  const ready =
    fontsLoaded && philoHydrated && measureHydrated && authHydrated && reminderHydrated
    && engagementHydrated && subscriptionHydrated && localeHydrated;

  // Tops up the reminder's rolling window of scheduled notifications once
  // per cold start — a no-op inside refreshWindow itself if the reminder
  // is off. See dailyReminder.ts for why this needs topping up at all
  // (there's no background task keeping the schedule filled while the app
  // is closed).
  useEffect(() => {
    if (!ready || !philosopher) return;
    refreshWindow(philosopher);
  }, [ready, philosopher]);

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync();

    const inOnboarding = segments[0] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';
    if (!philosopher && !inOnboarding) {
      router.replace('/onboarding');
    } else if (philosopher && !inTabs) {
      router.replace('/(tabs)/depths');
    }
  }, [ready, philosopher, segments]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)"     />
        </Stack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
