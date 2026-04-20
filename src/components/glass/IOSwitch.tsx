import React from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CashlyTheme, alpha } from '@/src/lib/theme';

type Props = {
  on: boolean;
  onChange: (next: boolean) => void;
  color?: string;
};

export function IOSwitch({ on, onChange, color = CashlyTheme.accent.income }: Props) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onChange(!on);
      }}
      hitSlop={8}
      style={{
        width: 51,
        height: 31,
        borderRadius: 16,
        backgroundColor: on ? color : 'rgba(120,120,128,0.32)',
        justifyContent: 'center',
        shadowColor: on ? color : '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: on ? 0.3 : 0,
        shadowRadius: 10,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 22 : 2,
          width: 27,
          height: 27,
          borderRadius: 14,
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          borderWidth: 0.5,
          borderColor: alpha('#000', 0.06),
        }}
      />
    </Pressable>
  );
}
