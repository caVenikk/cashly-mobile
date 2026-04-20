import React, { type ReactNode } from 'react';
import { View, type ViewStyle, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTokens } from '@/src/lib/themeMode';

type Props = {
  children: ReactNode;
  radius?: number;
  strong?: boolean;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
};

export function GlassCard({ children, radius = 28, strong = false, onPress, style }: Props) {
  const { dark } = useTokens();

  const bg = strong
    ? dark
      ? 'rgba(40,40,50,0.78)'
      : 'rgba(255,255,255,0.85)'
    : dark
      ? 'rgba(28, 28, 34, 0.55)'
      : 'rgba(255,255,255,0.7)';

  const borderColor = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';

  const sheen = dark
    ? (['rgba(255,255,255,0.09)', 'rgba(255,255,255,0)'] as const)
    : (['rgba(255,255,255,0.75)', 'rgba(255,255,255,0)'] as const);

  const content = (
    <View style={[styles.root, { borderRadius: radius, borderColor }, style]}>
      <BlurView
        intensity={dark ? 50 : 70}
        tint={dark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bg, borderRadius: radius }]} />
      <LinearGradient
        colors={sheen}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        pointerEvents="none"
      />
      <View style={styles.content}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
