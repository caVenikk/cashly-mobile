import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTokens } from '@/src/lib/themeMode';

type Option<K extends string> = { id: K; label: string };

type Props<K extends string> = {
  options: Option<K>[];
  active: K;
  onChange: (id: K) => void;
};

export function SegmentedControl<K extends string>({ options, active, onChange }: Props<K>) {
  const { dark, tokens } = useTokens();
  return (
    <View
      style={{
        flexDirection: 'row',
        borderRadius: 14,
        padding: 3,
        backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        gap: 2,
      }}
    >
      {options.map((o) => {
        const on = active === o.id;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 12,
              alignItems: 'center',
              backgroundColor: on ? (dark ? 'rgba(60,60,68,0.85)' : 'rgba(255,255,255,0.96)') : 'transparent',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: on ? (dark ? 0.3 : 0.08) : 0,
              shadowRadius: 6,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: on ? tokens.text : tokens.textSecondary,
                letterSpacing: -0.1,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
