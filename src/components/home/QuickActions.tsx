import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { CashlyTheme, shade } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { Icon, type IconName } from '@/src/components/Icon';
import { useT } from '@/src/i18n';
import { uiStore } from '@/src/stores/ui';

type Action = { key: string; label: string; color: string; icon: IconName; onPress: () => void };

export function QuickActions({ onGoTo }: { onGoTo: (name: 'plans' | 'envelopes' | 'recurring') => void }) {
  const { tokens } = useTokens();
  const t = useT();

  const actions: Action[] = [
    {
      key: 'add',
      label: t('quickAdd'),
      color: CashlyTheme.accent.income,
      icon: 'plus',
      onPress: () => uiStore.open('addExpense'),
    },
    {
      key: 'income',
      label: t('incomeAdd'),
      color: CashlyTheme.accent.purple,
      icon: 'briefcase',
      onPress: () => uiStore.open('addIncome'),
    },
    {
      key: 'move',
      label: t('envMove'),
      color: CashlyTheme.accent.blue,
      icon: 'send',
      onPress: () => uiStore.openAllocate(null),
    },
    { key: 'plans', label: t('plans'), color: CashlyTheme.accent.pink, icon: 'target', onPress: () => onGoTo('plans') },
  ];

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 18, flexDirection: 'row', gap: 10 }}>
      {actions.map((a) => (
        <Pressable
          key={a.key}
          onPress={() => {
            Haptics.selectionAsync();
            a.onPress();
          }}
          style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 6, opacity: pressed ? 0.7 : 1 })}
        >
          <LinearGradient
            colors={[a.color, shade(a.color, -18)]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: a.color,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 14,
              borderWidth: 0.5,
              borderColor: 'rgba(255,255,255,0.25)',
            }}
          >
            <Icon name={a.icon} color="#fff" size={22} />
          </LinearGradient>
          <Text style={{ fontSize: 11, color: tokens.textSecondary, fontWeight: '600' }} numberOfLines={1}>
            {a.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
