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
import '../src/i18n';
import { setI18nLocale } from '../src/i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Panchang has zero Cyrillic glyphs (confirmed via fonttools) — every
  // Russian string rendered so far has been silently falling back to a
  // system font, not actually using Panchang. Not yet fixed: expo-font's
  // useFonts explicitly does NOT support swapping which file loads under
  // a given key after the first mount (confirmed in expo-font's own
  // source — the loading effect has an empty dependency array, and their
  // docs say so directly: "the fonts are not 'reloaded' when you
  // dynamically change the font map"). An earlier attempt at registering
  // a different binary under the SAME key ("Panchang-Medium") depending
  // on locale looked like it worked in one screenshot, but didn't — it
  // silently always resolved to whichever font won the very first mount,
  // regardless of locale. Loading Narezka under its own key here for now
  // (harmless, unused) — real per-locale font selection needs each
  // screen's fontFamily resolved at render time instead of baked into
  // StyleSheet.create at module-load time, which touches every file that
  // sets fontFamily: fonts.light/medium (~194 usages across 23 files) —
  // deliberately not done yet, see conversation history for why.
  const [fontsLoaded] = useFonts({
    'Panchang-Light':  require('../assets/fonts/Panchang-Light.ttf'),
    'Panchang-Medium': require('../assets/fonts/Panchang-Medium.ttf'),
    'Narezka':         require('../assets/fonts/Narezka.ttf'),
  });

  const { hydrated: philoHydrated, hydrate: hydratePhilo, philosopher } = usePhilosopherStore();
  const { hydrated: measureHydrated, hydrate: hydrateMeasure } = useMeasureStore();
  const { hydrated: authHydrated, hydrate: hydrateAuth } = useAuthStore();
  const { hydrated: reminderHydrated, hydrate: hydrateReminder, refreshWindow } = useReminderStore();
  const { hydrated: engagementHydrated, hydrate: hydrateEngagement } = useEngagementStore();
  const { hydrated: subscriptionHydrated, hydrate: hydrateSubscription } = useSubscriptionStore();
  const { hydrated: localeHydrated, hydrate: hydrateLocale, locale } = useLocaleStore();
  const router   = useRouter();
  const segments = useSegments();

  // i18next's active language is kept in sync with localeStore rather than
  // driven independently — localeStore already owns detection/persistence
  // (see localeStore.ts), this just mirrors its value into i18next whenever
  // it changes, whether from hydration or a later toggle in the You tab.
  useEffect(() => {
    if (!localeHydrated) return;
    setI18nLocale(locale);
  }, [localeHydrated, locale]);

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
