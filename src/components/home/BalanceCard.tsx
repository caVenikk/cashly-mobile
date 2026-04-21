import React, { useMemo, useState } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/src/components/glass/GlassCard';
import { Icon } from '@/src/components/Icon';
import { CashlyTheme } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { useLang, useT } from '@/src/i18n';
import { fmt, fmtDateObj } from '@/src/lib/format';
import type { Expense, Income } from '@/src/types/db';
import { useEnvelopes } from '@/src/hooks/useEnvelopes';
import { chartFilter, useChartExcluded } from '@/src/stores/chartFilter';

type Props = {
  monthExpenses: Expense[];
  incomes: Income[];
};

const WIDTH = 340;
const HEIGHT = 90;

export function BalanceCard({ monthExpenses, incomes }: Props) {
  const { tokens, dark } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const { envelopes } = useEnvelopes();
  const excluded = useChartExcluded();
  const [menuOpen, setMenuOpen] = useState(false);

  // Null envelope_id is treated as the main envelope (its implicit default)
  // so "uncheck everything" really empties the chart, and toggling main alone
  // hides orphaned rows too.
  const mainId = useMemo(() => envelopes.find((e) => e.kind === 'main')?.id ?? null, [envelopes]);
  const isVisible = useMemo(() => {
    return (eid: string | null | undefined): boolean => {
      if (excluded.size === 0) return true;
      const effective = eid ?? mainId;
      if (!effective) return false;
      return !excluded.has(effective);
    };
  }, [excluded, mainId]);

  // Apply the envelope filter before any aggregation. Chart stays internally
  // consistent: income - spent uses the same envelope set for both sides.
  const filteredExpenses = useMemo(
    () => monthExpenses.filter((e) => isVisible(e.envelope_id)),
    [monthExpenses, isVisible],
  );
  const filteredIncomes = useMemo(() => incomes.filter((i) => isVisible(i.envelope_id)), [incomes, isVisible]);

  const spent = useMemo(() => filteredExpenses.reduce((s, e) => s + Number(e.amount), 0), [filteredExpenses]);
  // Income totals include: active recurring (monthly assumption) + every oneoff,
  // received or not. "Received" on a oneoff is the ledger confirmation, not a
  // pause — it's still this month's revenue and belongs on the chart.
  const expectedIncome = useMemo(
    () =>
      filteredIncomes
        .filter((i) => (i.kind === 'recurring' ? i.is_active : true))
        .reduce((s, i) => s + Number(i.amount), 0),
    [filteredIncomes],
  );
  const balance = expectedIncome - spent;

  const chart = useMemo(() => buildDailyBars(filteredExpenses), [filteredExpenses]);

  const positive = balance >= 0;
  const accent = positive ? CashlyTheme.accent.income : CashlyTheme.accent.expense;
  const filterActive = excluded.size > 0;
  const envelopeIds = useMemo(() => envelopes.map((e) => e.id), [envelopes]);

  return (
    <GlassCard strong style={{ marginHorizontal: 16, marginTop: 20 }}>
      <View style={{ padding: 22, paddingBottom: 14 }}>
        <View style={styles.headerRow}>
          <Text
            style={{
              fontSize: 13,
              color: tokens.textSecondary,
              fontWeight: '500',
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}
          >
            {fmtDateObj(new Date(), 'LLLL yyyy', lang)}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setMenuOpen((v) => !v);
            }}
            hitSlop={8}
            style={{
              width: 28,
              height: 28,
              borderRadius: 9,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: menuOpen
                ? CashlyTheme.accent.income
                : filterActive
                  ? dark
                    ? 'rgba(52,199,89,0.18)'
                    : 'rgba(52,199,89,0.14)'
                  : dark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
            }}
          >
            <Icon
              name="filter"
              color={menuOpen ? '#fff' : filterActive ? CashlyTheme.accent.income : tokens.textSecondary}
              size={15}
            />
          </Pressable>
        </View>

        {menuOpen ? (
          <View
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 14,
              backgroundColor: dark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.04)',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: tokens.hairline,
            }}
          >
            <View style={styles.headerRow}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: tokens.textSecondary, letterSpacing: 0.3 }}>
                {t('chartFilter')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    chartFilter.setAll(envelopeIds);
                  }}
                  hitSlop={4}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 10,
                    backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: tokens.textSecondary }}>
                    {t('chartFilterAll')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    chartFilter.setNone(envelopeIds);
                  }}
                  hitSlop={4}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 10,
                    backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: tokens.textSecondary }}>
                    {t('chartFilterNone')}
                  </Text>
                </Pressable>
              </View>
            </View>
            <View style={{ marginTop: 10, gap: 2 }}>
              {envelopes.map((e) => {
                const checked = !excluded.has(e.id);
                return (
                  <Pressable
                    key={e.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      chartFilter.toggle(e.id);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingVertical: 8,
                      paddingHorizontal: 4,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: checked ? e.color : dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
                        backgroundColor: checked ? e.color : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {checked ? (
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900', lineHeight: 14 }}>✓</Text>
                      ) : null}
                    </View>
                    <Text style={{ fontSize: 14 }}>{e.emoji}</Text>
                    <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, fontWeight: '600', color: tokens.text }}>
                      {e.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <Text
          style={{ fontSize: 44, fontWeight: '800', color: accent, letterSpacing: -1.5, marginTop: 2, lineHeight: 46 }}
        >
          {fmt(balance, lang, true)}
        </Text>
        <Text style={{ fontSize: 12, color: tokens.textTertiary, marginTop: 2 }}>
          {t('income')} − {t('spent')} = {t('balanceLabel').toLowerCase()}
        </Text>

        <View style={{ marginTop: 16, marginBottom: 4 }}>
          <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
            {/* Baseline at the bottom */}
            <Line
              x1={0}
              x2={WIDTH}
              y1={HEIGHT - 0.5}
              y2={HEIGHT - 0.5}
              stroke={tokens.textTertiary}
              strokeWidth={0.6}
              opacity={0.3}
            />

            {chart.bars.map((b) => (
              <Rect
                key={b.day}
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx={b.w > 5 ? 1.5 : 1}
                ry={b.w > 5 ? 1.5 : 1}
                fill={b.isToday ? CashlyTheme.accent.income : CashlyTheme.accent.expense}
                opacity={b.h === 0 ? 0.15 : b.isToday ? 0.95 : 0.85}
              />
            ))}

            {/* Today vertical guide */}
            {chart.todayX !== null ? (
              <Line
                x1={chart.todayX}
                x2={chart.todayX}
                y1={0}
                y2={HEIGHT}
                stroke={CashlyTheme.accent.income}
                strokeWidth={1}
                strokeDasharray="2 3"
                opacity={0.35}
              />
            ) : null}
          </Svg>
          {chart.maxSpend > 0 ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ fontSize: 10, color: tokens.textTertiary, fontWeight: '500' }}>
                {lang === 'ru' ? 'макс/день' : 'max/day'}: {fmt(chart.maxSpend, lang)}
              </Text>
              <Text style={{ fontSize: 10, color: tokens.textTertiary, fontWeight: '500' }}>
                {chart.spendDays} {lang === 'ru' ? 'дн. трат' : 'spend days'}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <MiniStat
            label={t('income')}
            amount={expectedIncome}
            color={CashlyTheme.accent.income}
            dark={dark}
            tokens={tokens}
          />
          <MiniStat label={t('spent')} amount={spent} color={CashlyTheme.accent.expense} dark={dark} tokens={tokens} />
        </View>
      </View>
    </GlassCard>
  );
}

function MiniStat({
  label,
  amount,
  color,
  dark,
  tokens,
}: {
  label: string;
  amount: number;
  color: string;
  dark: boolean;
  tokens: ReturnType<typeof useTokens>['tokens'];
}) {
  const [lang] = useLang();
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 18,
        padding: 14,
        paddingVertical: 12,
        backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text style={{ fontSize: 12, color: tokens.textSecondary, fontWeight: '500' }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 17, fontWeight: '700', color: tokens.text, marginTop: 4, letterSpacing: -0.4 }}>
        {fmt(amount, lang)}
      </Text>
    </View>
  );
}

type BarChart = {
  bars: { day: number; x: number; y: number; w: number; h: number; isToday: boolean }[];
  todayX: number | null;
  maxSpend: number;
  spendDays: number;
};

// Daily spending bars for the current month. Each bar = sum of expenses on
// that day. Bars past today render as empty (no data yet), today highlighted.
function buildDailyBars(expenses: Expense[]): BarChart {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = now.getDate();

  const spendByDay = new Array<number>(daysInMonth).fill(0);
  for (const e of expenses) {
    const d = new Date(e.date);
    if (d.getFullYear() !== y || d.getMonth() !== m) continue;
    const idx = d.getDate() - 1;
    if (idx >= 0 && idx < daysInMonth) spendByDay[idx] += Number(e.amount);
  }

  const maxSpend = Math.max(0, ...spendByDay);
  const spendDays = spendByDay.filter((v) => v > 0).length;
  const slotW = WIDTH / daysInMonth;
  const gap = Math.min(2, slotW * 0.15);
  const barW = Math.max(1, slotW - gap);
  const padTop = 4;
  const usableH = HEIGHT - padTop - 2;

  const bars = spendByDay.map((amount, i) => {
    const day = i + 1;
    // Days past today get a ghost-height (tiny) so the timeline stays visible
    // but future days aren't mistaken for real zero-spend days.
    const isFuture = day > today;
    const normalized = maxSpend > 0 ? amount / maxSpend : 0;
    const rawH = normalized * usableH;
    const h = isFuture ? 0 : amount > 0 ? Math.max(rawH, 2) : 1;
    return {
      day,
      x: i * slotW + gap / 2,
      y: HEIGHT - h,
      w: barW,
      h,
      isToday: day === today,
    };
  });

  const todayX = today >= 1 && today <= daysInMonth ? (today - 0.5) * slotW : null;

  return { bars, todayX, maxSpend, spendDays };
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
