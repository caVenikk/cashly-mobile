import React, { useEffect, useMemo } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import 'react-native-reanimated';
import { ThemeBackground } from '@/src/components/ThemeBackground';
import { useTokens } from '@/src/lib/themeMode';
import { SheetHost } from '@/src/components/sheets/SheetHost';

// react-native-screens auto-disables on web, so inactive tab/stack screens
// stay mounted without display:none and visually stack on each other.
enableScreens(true);

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <RootShell />
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootShell() {
  const { dark } = useTokens();
  const bg = dark ? '#0a0a0f' : '#e8e8ef';

  // NavigationContainer defaults to the light theme (colors.background: '#fff'),
  // which paints the scene container white on web. Inject our own theme so the
  // nav layer matches the app background.
  const navTheme = useMemo(() => {
    const base = dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark,
      colors: {
        ...base.colors,
        background: bg,
        card: 'transparent',
      },
    };
  }, [dark, bg]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const mode = dark ? 'dark' : 'light';
    try {
      document.documentElement.setAttribute('data-theme', mode);
      document.documentElement.style.backgroundColor = bg;
      document.body.style.backgroundColor = bg;
      const themeMeta = document.querySelector('meta[name="theme-color"]:not([media])');
      if (themeMeta) themeMeta.setAttribute('content', bg);
      window.localStorage.setItem('cashly:theme', mode);
    } catch {}
  }, [dark, bg]);

  return (
    <ThemeProvider value={navTheme}>
      <View style={[styles.root, { backgroundColor: bg }]}>
        <ThemeBackground>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </ThemeBackground>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <SheetHost />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
