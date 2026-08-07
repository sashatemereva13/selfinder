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
import { useAIDisclosureStore } from '../src/store/aiDisclosureStore';
import { AIDisclosureOverlay } from '../src/components/AIDisclosureOverlay';
import '../src/i18n';
import { setI18nLocale } from '../src/i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Switched from Panchang to Etude Noire (see theme/typography.ts) — one
  // font, loaded once, for every language. No per-locale font logic: the
  // earlier attempt at swapping which file loads under the same key
  // depending on locale didn't work (expo-font's useFonts doesn't support
  // changing the font map after first mount) and isn't needed now that a
  // single typeface covers both Latin and Cyrillic correctly.
  const [fontsLoaded] = useFonts({
    'EtudeNoire-Medium': require('../assets/fonts/Etude-Noire-Medium.ttf'),
  });

  const { hydrated: philoHydrated, hydrate: hydratePhilo, philosopher } = usePhilosopherStore();
  const { hydrated: measureHydrated, hydrate: hydrateMeasure } = useMeasureStore();
  const { hydrated: authHydrated, hydrate: hydrateAuth } = useAuthStore();
  const { hydrated: reminderHydrated, hydrate: hydrateReminder, refreshWindow } = useReminderStore();
  const { hydrated: engagementHydrated, hydrate: hydrateEngagement } = useEngagementStore();
  const { hydrated: subscriptionHydrated, hydrate: hydrateSubscription } = useSubscriptionStore();
  const { hydrated: localeHydrated, hydrate: hydrateLocale, locale } = useLocaleStore();
  const { hydrated: aiDisclosureHydrated, hydrate: hydrateAIDisclosure, acknowledged: aiDisclosureAcknowledged } = useAIDisclosureStore();
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
    hydrateAIDisclosure();
  }, []);

  const ready =
    fontsLoaded && philoHydrated && measureHydrated && authHydrated && reminderHydrated
    && engagementHydrated && subscriptionHydrated && localeHydrated && aiDisclosureHydrated;

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
    // Top-level routes reachable from inside the tabs but not part of the
    // tab structure itself — sources (see its own fix) and both Your Arc
    // screens (moved out of app/(tabs)/you/ so their back link/gesture
    // isn't tied to the you tab regardless of which tab they were opened
    // from — see your-arc.tsx's comment).
    const inStandaloneRoute = ['sources', 'your-arc', 'your-arc-preview'].includes(segments[0] as string);
    if (!philosopher && !inOnboarding) {
      router.replace('/onboarding');
    } else if (philosopher && !inTabs && !inStandaloneRoute) {
      router.replace('/(tabs)/depths');
    }
  }, [ready, philosopher, segments]);

  if (!ready) return null;

  // Onboarding itself never touches the AI provider (no Guide/Measure
  // reachable from it) — the notice only needs to appear once a
  // philosopher exists, which is the true first moment those features
  // become reachable, regardless of account status. Gating on `philosopher`
  // rather than a route means it also catches someone who somehow lands
  // back on a fresh install's tabs without re-onboarding.
  const showAIDisclosure = Boolean(philosopher) && !aiDisclosureAcknowledged;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)"     />
          <Stack.Screen name="sources"    />
          <Stack.Screen name="your-arc"   />
          <Stack.Screen name="your-arc-preview" />
        </Stack>
        {showAIDisclosure && <AIDisclosureOverlay />}
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
