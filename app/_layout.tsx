import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import { ThemeBackground } from '@/src/components/ThemeBackground';
import { useTokens } from '@/src/lib/themeMode';
import { SheetHost } from '@/src/components/sheets/SheetHost';

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
  return (
    <View style={styles.root}>
      <ThemeBackground>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ThemeBackground>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <SheetHost />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
