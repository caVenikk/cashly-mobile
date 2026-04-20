import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CategoryBadge } from '@/src/components/glass/CategoryBadge';
import { CategoryIcon } from '@/src/components/CategoryIcon';
import { Icon } from '@/src/components/Icon';
import { SwipeableRow } from '@/src/components/SwipeableRow';
import { CashlyTheme } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { fmt } from '@/src/lib/format';
import { useLang, useT } from '@/src/i18n';
import type { Category, Expense } from '@/src/types/db';
import { catById } from '@/src/lib/categoryHelpers';

type Props = {
  tx: Expense;
  categories: Category[];
  isLast: boolean;
  onDelete: (id: string) => void;
  onPress?: (tx: Expense) => void;
};

export function TxRow({ tx, categories, isLast, onDelete, onPress }: Props) {
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const cat = catById(categories, tx.category_id);
  const positive = Number(tx.amount) < 0; // expense stored as positive, but allow signed
  const amt = -Math.abs(Number(tx.amount));
  const time = new Date(tx.created_at ?? `${tx.date}T00:00:00`).toLocaleTimeString(lang === 'ru' ? 'ru-RU' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const actions = (
    <View
      style={{
        width: 62,
        height: '76%',
        borderRadius: 14,
        backgroundColor: CashlyTheme.accent.expense,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Pressable
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onDelete(tx.id);
        }}
        style={{ alignItems: 'center' }}
      >
        <Icon name="trash" color="#fff" size={18} />
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600', marginTop: 2 }}>{t('delete')}</Text>
      </Pressable>
    </View>
  );

  return (
    <SwipeableRow rightActions={actions} revealWidth={76}>
      <Pressable
        onPress={() => onPress?.(tx)}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: dark ? 'rgba(28,28,34,0.95)' : 'rgba(255,255,255,0.98)',
            opacity: pressed ? 0.85 : 1,
            borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
            borderBottomColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          },
        ]}
      >
        <CategoryBadge color={cat.color} size={40}>
          <CategoryIcon icon={cat.icon} size={18} />
        </CategoryBadge>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: tokens.text, letterSpacing: -0.2 }}>
            {tx.note?.trim() || cat.name}
          </Text>
          <Text style={{ fontSize: 12, color: tokens.textSecondary, marginTop: 1 }} numberOfLines={1}>
            {cat.name} · {time}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: positive ? CashlyTheme.accent.income : tokens.text,
            letterSpacing: -0.3,
          }}
        >
          {fmt(amt, lang, true)}
        </Text>
      </Pressable>
    </SwipeableRow>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 62,
  },
});
