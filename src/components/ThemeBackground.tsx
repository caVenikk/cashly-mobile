import React, { type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTokens } from '@/src/lib/themeMode';

type Props = { children: ReactNode };

export function ThemeBackground({ children }: Props) {
  const { dark } = useTokens();

  const base = dark ? '#0a0a0f' : '#e8e8ef';

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: base }]}>
      {/* Simulated radial gradients — stacked linear + blur */}
      <LinearGradient
        colors={[dark ? 'rgba(52,199,89,0.18)' : 'rgba(52,199,89,0.22)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.6 }}
        style={[StyleSheet.absoluteFill, { opacity: 1 }]}
      />
      <LinearGradient
        colors={['transparent', dark ? 'rgba(255,107,107,0.14)' : 'rgba(255,107,107,0.18)']}
        start={{ x: 0.2, y: 0.4 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 1 }]}
      />
      <LinearGradient
        colors={['transparent', dark ? 'rgba(99,102,241,0.12)' : 'rgba(125,125,255,0.14)', 'transparent']}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.9 }]}
      />
      <View style={StyleSheet.absoluteFill}>{children}</View>
    </View>
  );
}
