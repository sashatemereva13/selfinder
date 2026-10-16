import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { usePhilosopherStore } from '../src/store/philosopherStore';
import { useMeasureStore } from '../src/store/measureStore';
import { useAuthStore } from '../src/store/authStore';
import { useReminderStore } from '../src/store/reminderStore';
import { useEngagementStore } from '../src/store/engagementStore';
import { useLocaleStore } from '../src/store/localeStore';
import { useThemeStore } from '../src/store/themeStore';
import { useThemeColors } from '../src/theme/useThemeColors';
import { SCREEN_TRANSITION } from '../src/theme/transitions';
import { useAIDisclosureStore } from '../src/store/aiDisclosureStore';
import { AIConsentSheet } from '../src/components/shared/AIConsentSheet';
import { TuneInAudioController } from '../src/components/depths/TuneInAudioController';
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
  //
  // EtudeNoire-Light added 2026-09-02 — was sitting unused in assets/
  // fonts alongside Medium/Regular/Bold. First real use: Depths' sphere
  // labels, where RN's SYNTHETIC bold (fontWeight alone, no real second
  // face loaded) produced no visible contrast between "selected" and
  // "not selected" — Medium already reads as fairly heavy on its own, so
  // faking heavier on top of it barely changed anything (confirmed by
  // the user: "all look pretty bold all the time"). Loading the real
  // Light file gives unselected labels a genuinely different face to
  // fall back to, instead of trying to fake "regular" out of Medium.
  const [fontsLoaded] = useFonts({
    'EtudeNoire-Medium': require('../assets/fonts/Etude-Noire-Medium.ttf'),
    'EtudeNoire-Light': require('../assets/fonts/Etude-Noire-Light.ttf'),
  });

  const { hydrated: philoHydrated, hydrate: hydratePhilo, philosopher } = usePhilosopherStore();
  const { hydrated: measureHydrated, hydrate: hydrateMeasure } = useMeasureStore();
  const { hydrated: authHydrated, hydrate: hydrateAuth } = useAuthStore();
  const { hydrated: reminderHydrated, hydrate: hydrateReminder, refreshWindow } = useReminderStore();
  const { hydrated: engagementHydrated, hydrate: hydrateEngagement } = useEngagementStore();
  const { hydrated: localeHydrated, hydrate: hydrateLocale, locale } = useLocaleStore();
  const { hydrated: themeHydrated, hydrate: hydrateTheme, theme } = useThemeStore();
  const { hydrated: aiDisclosureHydrated, hydrate: hydrateAIDisclosure } = useAIDisclosureStore();
  const router   = useRouter();
  // The app's own background behind every screen and transition, never the
  // navigator's default white.
  const colors = useThemeColors();
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
    hydrateLocale();
    hydrateTheme();
    hydrateAIDisclosure();
  }, []);

  const ready =
    fontsLoaded && philoHydrated && measureHydrated && authHydrated && reminderHydrated
    && engagementHydrated && localeHydrated && themeHydrated && aiDisclosureHydrated;

  // Tops up the reminder's rolling window of scheduled notifications once
  // per cold start — a no-op inside refreshWindow itself if the reminder
  // is off. See dailyReminder.ts for why this needs topping up at all
  // (there's no background task keeping the schedule filled while the app
  // is closed).
  useEffect(() => {
    if (!ready || !philosopher) return;
    refreshWindow(philosopher);
  }, [ready, philosopher]);

  // Android-only — expo-navigation-bar's setStyle is a synchronous native
  // call, not the async setButtonStyleAsync some older docs reference (that
  // function no longer exists in this SDK's installed types). 'light'
  // means light-colored buttons (for a dark bar), matching StatusBar's own
  // style prop convention below.
  useEffect(() => {
    if (!themeHydrated || Platform.OS !== 'android') return;
    NavigationBar.setStyle(theme === 'dark' ? 'light' : 'dark');
  }, [themeHydrated, theme]);

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync();

    const inOnboarding = segments[0] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';
    // Top-level routes reachable from inside the tabs but not part of the
    // tab structure itself — sources (see its own fix), how-to-use (same
    // reasoning, reachable from the profile screen post-onboarding),
    // center plus the rest of the Journey catalog beyond Journeys' own tab
    // (2026-08-22/23, the Journey family; the 2026-08-23 question-first
    // catalog replaced the earlier either-or/identity placeholders, see
    // docs/journeys-concept.md), your-arc (moved out of the old you tab so
    // its back link/gesture isn't tied to a tab regardless of which tab it
    // was opened from — see your-arc.tsx's comment; your-arc-preview.tsx
    // deleted 2026-08-28 once Selfinder went fully free and there was
    // nothing left to preview toward), guide (moved off the tab bar
    // entirely — see docs/app-architecture-concept.md — reached via the
    // philosopher-presence affordance on Depths, not a tab), and profile
    // (the old you tab's replacement, reached via a profile icon instead
    // of a tab). 'products' was removed from this list once it moved to
    // app/(tabs)/explore/ (Journeys' catalog, now inside Practice) — that route now falls under inTabs instead.
    const inStandaloneRoute = [
      'sources', 'how-to-use', 'center', 'guide', 'profile',
      'control', 'the-choice', 'the-loop', 'whose-voice', 'the-road-not-taken',
      'letting-go', 'the-mirror', 'the-unsaid', 'becoming', 'the-threshold',
      'possible-selves', 'enough',
      'your-arc', 'your-arc-past', 'your-arc-future', 'your-arc-moment', 'level', 'crisis-support',
      'journeys-grounding',
    ].includes(segments[0] as string);
    // Onboarding is excluded from the second branch: it saves the chosen
    // philosopher only on its own exit (see onboarding's meet step) and
    // navigates itself right after — to Depths, or to Depths with Measure
    // on top. Redirecting here too would race that navigation and could
    // drop the Measure screen it just pushed.
    if (!philosopher && !inOnboarding) {
      router.replace('/onboarding');
    } else if (philosopher && !inTabs && !inStandaloneRoute && !inOnboarding) {
      router.replace('/(tabs)/depths');
    }
  }, [ready, philosopher, segments]);

  const base = theme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: { ...base.colors, background: colors.bg.base, card: colors.bg.base, border: colors.bg.border },
  };

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        {/* The navigation library's own theme, in the app's colours — without
            it, its containers (the tab navigator behind a fading scene,
            a screen mid-transition) fell back to its default light
            background, showing as a white flash, e.g. on "Measure again"
            from another tab while the minimap hid (2026-10-10). */}
        <ThemeProvider value={navigationTheme}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg.base }, ...SCREEN_TRANSITION }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)"     />
          <Stack.Screen name="sources"    />
          <Stack.Screen name="how-to-use" />
          <Stack.Screen name="center"     />
          <Stack.Screen name="control"    />
          <Stack.Screen name="the-choice" />
          <Stack.Screen name="the-loop"   />
          <Stack.Screen name="whose-voice" />
          <Stack.Screen name="the-road-not-taken" />
          <Stack.Screen name="letting-go" />
          <Stack.Screen name="the-mirror" />
          <Stack.Screen name="the-unsaid" />
          <Stack.Screen name="becoming"   />
          <Stack.Screen name="the-threshold" />
          <Stack.Screen name="possible-selves" />
          <Stack.Screen name="enough"     />
          <Stack.Screen name="your-arc"   />
          <Stack.Screen name="your-arc-past" />
          <Stack.Screen name="your-arc-future" />
          <Stack.Screen name="your-arc-moment" />
          <Stack.Screen name="crisis-support" />
          <Stack.Screen name="journeys-grounding" />
        </Stack>
        </ThemeProvider>
        {/* Raised on demand by ensureAIConsent() — the first time
            someone's own words are about to be sent to the AI provider,
            not up front (see aiDisclosureStore.ts). The old one-time
            how-to-use overlay that used to show here right after
            onboarding is gone (2026-09-26): its tips were for screens a
            new person hadn't seen yet; the page stays reachable from
            profile. */}
        <AIConsentSheet />
        {/* Mounted once at the app root, not inside the Tune In screen, so
            playback survives in-app navigation away from that screen — see
            TuneInAudioController's own comment for why this moved here. */}
        <TuneInAudioController />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
