import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { GlassCard } from '@/src/components/glass/GlassCard';
import { TxRow } from '@/src/components/TxRow';
import { useTokens } from '@/src/lib/themeMode';
import { useT, useLang } from '@/src/i18n';
import { fmtDate, todayIso } from '@/src/lib/format';
import type { Category, Expense } from '@/src/types/db';

type Props = {
  expenses: Expense[];
  categories: Category[];
  onDelete: (id: string) => void;
};

export function TxList({ expenses, categories, onDelete }: Props) {
  const { tokens } = useTokens();
  const t = useT();
  const [lang] = useLang();

  const grouped = useMemo(() => groupByDay(expenses.slice(0, 20)), [expenses]);

  if (expenses.length === 0) {
    return (
      <View style={{ marginHorizontal: 16, marginTop: 18, marginBottom: 140 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: tokens.text, paddingHorizontal: 4, paddingBottom: 10 }}>
          {t('recentTx')}
        </Text>
        <GlassCard radius={22}>
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: tokens.textSecondary }}>{t('emptyExpenses')}</Text>
          </View>
        </GlassCard>
      </View>
    );
  }

  const today = todayIso();
  const yIso = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  })();

  return (
    <View style={{ marginHorizontal: 16, marginTop: 18, marginBottom: 140 }}>
      <View style={{ paddingHorizontal: 4, paddingBottom: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: tokens.text, letterSpacing: -0.3 }}>
          {t('recentTx')}
        </Text>
      </View>
      {grouped.map((g) => {
        const label = g.key === today ? t('today') : g.key === yIso ? t('yesterday') : fmtDate(g.key, 'd MMMM', lang);
        return (
          <View key={g.key} style={{ marginBottom: 14 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: tokens.textTertiary,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                paddingHorizontal: 6,
                paddingBottom: 6,
              }}
            >
              {label}
            </Text>
            <GlassCard radius={22}>
              {g.rows.map((tx, i) => (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  categories={categories}
                  isLast={i === g.rows.length - 1}
                  onDelete={onDelete}
                />
              ))}
            </GlassCard>
          </View>
        );
      })}
    </View>
  );
}

type Group = { key: string; rows: Expense[] };

function groupByDay(expenses: Expense[]): Group[] {
  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    const arr = map.get(e.date) ?? [];
    arr.push(e);
    map.set(e.date, arr);
  }
  const keys = Array.from(map.keys()).sort().reverse();
  return keys.map((k) => ({ key: k, rows: map.get(k)! }));
}
