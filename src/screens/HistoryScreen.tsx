import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/src/components/glass/GlassCard';
import { CategoryBadge } from '@/src/components/glass/CategoryBadge';
import { SegmentedControl } from '@/src/components/glass/SegmentedControl';
import { TxRow } from '@/src/components/TxRow';
import { SwipeableRow } from '@/src/components/SwipeableRow';
import { Icon } from '@/src/components/Icon';
import { CashlyTheme } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { useLang, useT } from '@/src/i18n';
import { fmt, fmtDate, todayIso } from '@/src/lib/format';
import { useExpenses } from '@/src/hooks/useExpenses';
import { useIncomes } from '@/src/hooks/useIncomes';
import { useCategories } from '@/src/hooks/useCategories';
import { useEnvelopes } from '@/src/hooks/useEnvelopes';
import { useRefresh } from '@/src/hooks/useRefresh';
import { usePullToRefresh } from '@/src/hooks/usePullToRefresh';
import type { Expense, Income } from '@/src/types/db';

type FilterMode = 'all' | 'expense' | 'income';

type Item = { kind: 'expense'; date: string; data: Expense } | { kind: 'income'; date: string; data: Income };

export function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const { expenses, refresh: refreshExp, remove: removeExp } = useExpenses();
  const { incomes, refresh: refreshInc, remove: removeInc } = useIncomes();
  const { categories, refresh: refreshCat } = useCategories();
  const { envelopes } = useEnvelopes();
  const [filter, setFilter] = useState<FilterMode>('all');
  const { refreshing, onRefresh } = useRefresh([refreshExp, refreshInc, refreshCat]);
  const pull = usePullToRefresh(onRefresh);

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    if (filter !== 'income') {
      for (const e of expenses) out.push({ kind: 'expense', date: e.date, data: e });
    }
    if (filter !== 'expense') {
      // Recurring incomes don't leave per-payment history (we only advance
      // next_date on receive). So history shows received oneoffs — the only
      // income records that represent actual past events.
      for (const inc of incomes) {
        if (inc.kind === 'oneoff' && !inc.is_active) {
          out.push({ kind: 'income', date: inc.next_date, data: inc });
        }
      }
    }
    return out.sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, incomes, filter]);

  const grouped = useMemo(() => groupByDay(items), [items]);

  const total = useMemo(() => {
    let inSum = 0;
    let outSum = 0;
    for (const it of items) {
      if (it.kind === 'income') inSum += Number(it.data.amount);
      else outSum += Number(it.data.amount);
    }
    return { inSum, outSum };
  }, [items]);

  const today = todayIso();
  const yIso = yesterdayIso();

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 6 }}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
          hitSlop={10}
          style={styles.backBtn}
        >
          <Icon name="arrow" color={tokens.text} size={20} />
        </Pressable>
        <Text style={{ fontSize: 22, fontWeight: '800', color: tokens.text, letterSpacing: -0.5, flex: 1 }}>
          {t('historyTitle')}
        </Text>
      </View>

      <ScrollView
        {...pull}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={dark ? '#ffffff' : '#555555'}
            colors={['#555555']}
          />
        }
      >
        <GlassCard strong style={{ marginHorizontal: 16, marginTop: 8 }}>
          <View style={{ padding: 18 }}>
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'baseline', flexWrap: 'wrap' }}>
              {total.inSum > 0 ? (
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: '800',
                    color: CashlyTheme.accent.income,
                    letterSpacing: -0.5,
                  }}
                >
                  + {fmt(total.inSum, lang)}
                </Text>
              ) : null}
              {total.outSum > 0 ? (
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: '800',
                    color: CashlyTheme.accent.expense,
                    letterSpacing: -0.5,
                  }}
                >
                  − {fmt(total.outSum, lang)}
                </Text>
              ) : null}
              {total.inSum === 0 && total.outSum === 0 ? (
                <Text style={{ fontSize: 22, fontWeight: '800', color: tokens.textSecondary, letterSpacing: -0.5 }}>
                  {fmt(0, lang)}
                </Text>
              ) : null}
            </View>
            <Text style={{ fontSize: 11, color: tokens.textTertiary, marginTop: 4, fontWeight: '500' }}>
              {items.length} {lang === 'ru' ? 'операций' : 'operations'}
            </Text>
          </View>
        </GlassCard>

        <View style={{ marginHorizontal: 16, marginTop: 14, marginBottom: 10 }}>
          <SegmentedControl<FilterMode>
            options={[
              { id: 'all', label: t('historyAll') },
              { id: 'expense', label: t('historyExpenses') },
              { id: 'income', label: t('historyIncomes') },
            ]}
            active={filter}
            onChange={setFilter}
          />
        </View>

        {grouped.length === 0 ? (
          <View style={{ marginHorizontal: 16 }}>
            <GlassCard radius={22}>
              <View style={{ padding: 28, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: tokens.textSecondary }}>{t('historyEmpty')}</Text>
              </View>
            </GlassCard>
          </View>
        ) : (
          grouped.map((g) => {
            const label =
              g.key === today ? t('today') : g.key === yIso ? t('yesterday') : fmtDate(g.key, 'd MMMM yyyy', lang);
            return (
              <View key={g.key} style={{ marginHorizontal: 16, marginBottom: 14 }}>
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
                  {g.rows.map((it, i) => {
                    const isLast = i === g.rows.length - 1;
                    if (it.kind === 'expense') {
                      return (
                        <TxRow
                          key={`e:${it.data.id}`}
                          tx={it.data}
                          categories={categories}
                          isLast={isLast}
                          onDelete={(id) => removeExp(id)}
                        />
                      );
                    }
                    const env = envelopes.find((e) => e.id === it.data.envelope_id) ?? null;
                    return (
                      <IncomeHistoryRow
                        key={`i:${it.data.id}`}
                        inc={it.data}
                        envelopeEmoji={env?.emoji ?? '💳'}
                        envelopeName={env?.name ?? '—'}
                        isLast={isLast}
                        onDelete={() => removeInc(it.data.id)}
                      />
                    );
                  })}
                </GlassCard>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function IncomeHistoryRow({
  inc,
  envelopeEmoji,
  envelopeName,
  isLast,
  onDelete,
}: {
  inc: Income;
  envelopeEmoji: string;
  envelopeName: string;
  isLast: boolean;
  onDelete: () => void;
}) {
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();

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
          onDelete();
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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          minHeight: 62,
          backgroundColor: dark ? 'rgba(28,28,34,0.95)' : 'rgba(255,255,255,0.98)',
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        }}
      >
        <CategoryBadge color={CashlyTheme.accent.income} size={40} radius={12}>
          <Icon name="cards" color="#fff" size={18} />
        </CategoryBadge>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: tokens.text, letterSpacing: -0.2 }}>
            {inc.name}
          </Text>
          <Text style={{ fontSize: 12, color: tokens.textSecondary, marginTop: 1 }} numberOfLines={1}>
            {envelopeEmoji} {envelopeName}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: CashlyTheme.accent.income,
            letterSpacing: -0.3,
          }}
        >
          + {fmt(Number(inc.amount), lang)}
        </Text>
      </View>
    </SwipeableRow>
  );
}

type Group = { key: string; rows: Item[] };

function groupByDay(items: Item[]): Group[] {
  const map = new Map<string, Item[]>();
  for (const it of items) {
    const arr = map.get(it.date) ?? [];
    arr.push(it);
    map.set(it.date, arr);
  }
  const keys = Array.from(map.keys()).sort().reverse();
  return keys.map((k) => ({ key: k, rows: map.get(k)! }));
}

function yesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scaleX: -1 }],
  },
});
