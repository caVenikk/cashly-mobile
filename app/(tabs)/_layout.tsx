import React from 'react';
import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/src/components/CustomTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="recurring" />
      <Tabs.Screen name="plans" />
      <Tabs.Screen name="envelopes" />
      <Tabs.Screen name="categories" />
    </Tabs>
  );
}
