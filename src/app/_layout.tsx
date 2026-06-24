import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initAds } from '@/ads';
import { HowToPlay } from '@/components/HowToPlay';
import { useResolvedScheme } from '@/hooks/use-theme';
import { usePlayerStore } from '@/store/player-store';
import { useSettingsStore } from '@/store/settings-store';

export default function RootLayout() {
  const isDark = useResolvedScheme() === 'dark';

  // Load player + settings into memory and initialize the ads SDK at startup.
  useEffect(() => {
    usePlayerStore.getState().hydrate().catch(() => {});
    useSettingsStore.getState().hydrate().catch(() => {});
    initAds();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
          </Stack>
          <HowToPlay />
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
