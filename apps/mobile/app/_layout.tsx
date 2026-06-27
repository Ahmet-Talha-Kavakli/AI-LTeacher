import { useEffect, useState } from "react";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "react-native-reanimated";

import { useAppFonts } from "@/lib/fonts";
import { initI18n, getDeviceLanguage } from "@/lib/i18n";
import { useLocaleStore } from "@/state/locale";
import { COLORS } from "@ailt/shared";

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export const unstable_settings = {
  anchor: "(onboarding)",
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const appLanguage = useLocaleStore((s) => s.appLanguage);
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    const initial = appLanguage ?? getDeviceLanguage();
    initI18n(initial);
    setI18nReady(true);
  }, [appLanguage]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && i18nReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, i18nReady]);

  if ((!fontsLoaded && !fontError) || !i18nReady) return null;

  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: COLORS.dark.background, card: COLORS.dark.background, text: COLORS.dark.text, primary: COLORS.dark.accent } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: COLORS.light.background, card: COLORS.light.background, text: COLORS.light.text, primary: COLORS.light.accent } };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={navTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="lesson/[id]" options={{ presentation: "modal" }} />
          <Stack.Screen name="tutor/voice" options={{ presentation: "fullScreenModal" }} />
          <Stack.Screen name="tutor/chat" options={{ presentation: "modal" }} />
          <Stack.Screen name="settings/app-language" options={{ presentation: "modal", title: "" }} />
        </Stack>
        <StatusBar style={isDark ? "light" : "dark"} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
