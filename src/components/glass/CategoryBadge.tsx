import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { shade } from '@/src/lib/theme';

type Props = {
  color?: string;
  size?: number;
  radius?: number;
  children: ReactNode;
};

export function CategoryBadge({ color = '#34C759', size = 40, radius, children }: Props) {
  const r = radius ?? Math.round(size * 0.3);
  return (
    <LinearGradient
      colors={[color, shade(color, -18)]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: r,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: color,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      }}
    >
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </LinearGradient>
  );
}
