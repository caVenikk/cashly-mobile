import React from 'react';
import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { CashlyTheme } from '@/src/lib/theme';
import { Icon } from './Icon';

type Props = {
  onPress: () => void;
  size?: number;
};

export function FAB({ onPress, size = 64 }: Props) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        transform: [{ scale: pressed ? 0.94 : 1 }],
        shadowColor: CashlyTheme.accent.income,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 18,
      })}
    >
      <LinearGradient
        colors={[CashlyTheme.accent.income, CashlyTheme.accent.incomeDeep]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{
          flex: 1,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 0.5,
          borderColor: 'rgba(255,255,255,0.25)',
        }}
      >
        <View>
          <Icon name="plus" color="#fff" size={28} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}
