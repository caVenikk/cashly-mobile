import React, { type ReactNode } from 'react';
import { Pressable, Text , StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTokens } from '@/src/lib/themeMode';

type Props = {
  onPress?: () => void;
  label?: string;
  icon?: ReactNode;
  size?: number;
};

export function GlassIconBtn({ onPress, label, icon, size = 40 }: Props) {
  const { dark, tokens } = useTokens();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <BlurView intensity={dark ? 50 : 70} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: dark ? 'rgba(60,60,68,0.5)' : 'rgba(255,255,255,0.6)' }]}
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {icon ?? (
          <Text style={{ color: tokens.text, fontSize: 12, fontWeight: '700', letterSpacing: 0.4 }}>{label}</Text>
        )}
      </View>
    </Pressable>
  );
}
