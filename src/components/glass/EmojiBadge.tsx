import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { shade } from '@/src/lib/theme';

type Props = {
  emoji: string;
  color: string;
  size?: number;
  radius?: number;
};

export function EmojiBadge({ emoji, color, size = 42, radius = 14 }: Props) {
  return (
    <LinearGradient
      colors={[shade(color, 18), shade(color, -8)]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: color,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      }}
    >
      <View>
        <Text style={{ fontSize: Math.round(size * 0.52), lineHeight: Math.round(size * 0.58) }}>{emoji}</Text>
      </View>
    </LinearGradient>
  );
}
