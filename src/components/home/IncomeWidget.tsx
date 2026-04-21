import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/src/components/glass/GlassCard';
import { CategoryBadge } from '@/src/components/glass/CategoryBadge';
import { Icon } from '@/src/components/Icon';
import { CashlyTheme, shade, alpha } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { useLang, useT } from '@/src/i18n';
import { fmt, daysUntil } from '@/src/lib/format';
import type { Income } from '@/src/types/db';
import { uiStore } from '@/src/stores/ui';

type Props = {
  incomes: Income[];
  onOpenList: () => void;
};

export function IncomeWidget({ incomes, onOpenList }: Props) {
  const { tokens } = useTokens();
  const [lang] = useLang();
  const t = useT();

  // Split: received (is_active=false oneoff — real money already in)
  // vs expected (active recurring + unreceived oneoff — money coming).
  const received = useMemo(
    () => incomes.filter((i) => i.kind === 'oneoff' && !i.is_active).reduce((s, i) => s + Number(i.amount), 0),
    [incomes],
  );
  const expected = useMemo(
    () => incomes.filter((i) => i.is_active).reduce((s, i) => s + Number(i.amount), 0),
    [incomes],
  );
  const totalThisMonth = received + expected;
  // "Upcoming" tiles — only still-pending incomes (active recurring + unreceived oneoff).
  const upcoming = useMemo(() => incomes.filter((i) => i.is_active), [incomes]);
  const next = [...upcoming].sort((a, b) => daysUntil(a.next_date) - daysUntil(b.next_date)).slice(0, 3);

  return (
    <GlassCard style={{ marginHorizontal: 16, marginTop: 18 }}>
      <View style={{ padding: 18 }}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: CashlyTheme.accent.income,
                }}
              />
              <Text
                style={{
                  fontSize: 11,
                  color: tokens.textTertiary,
                  fontWeight: '600',
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                }}
              >
                {t('monthIncome')}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '800',
                color: CashlyTheme.accent.income,
                letterSpacing: -0.5,
                marginTop: 3,
              }}
            >
              + {fmt(totalThisMonth, lang)}
            </Text>
            {received > 0 || expected > 0 ? (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                {received > 0 ? (
                  <Text style={{ fontSize: 11, fontWeight: '600', color: CashlyTheme.accent.income }}>
                    {t('incomeReceivedLabel')}: + {fmt(received, lang)}
                  </Text>
                ) : null}
                {expected > 0 ? (
                  <Text style={{ fontSize: 11, fontWeight: '500', color: tokens.textSecondary }}>
                    {t('incomeExpectedLabel')}: + {fmt(expected, lang)}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              uiStore.open('addIncome');
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <LinearGradient
              colors={[CashlyTheme.accent.income, CashlyTheme.accent.incomeDeep]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 7,
                paddingHorizontal: 13,
                borderRadius: 14,
                gap: 4,
              }}
            >
              <Icon name="plus" color="#fff" size={14} />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{t('incomeAdd')}</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {next.length > 0 ? (
          <Pressable
            onPress={onOpenList}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, flexDirection: 'row', gap: 8, marginTop: 14 })}
          >
            {next.map((i) => (
              <IncomeTile key={i.id} income={i} />
            ))}
          </Pressable>
        ) : (
          <Pressable onPress={onOpenList} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, marginTop: 14 })}>
            <Text style={{ fontSize: 13, color: tokens.textSecondary }}>{t('emptyIncomes')}</Text>
          </Pressable>
        )}
      </View>
    </GlassCard>
  );
}

function IncomeTile({ income }: { income: Income }) {
  const { tokens } = useTokens();
  const [lang] = useLang();
  const t = useT();
  const days = daysUntil(income.next_date);
  const isRecurring = income.kind === 'recurring';
  const chipBg = isRecurring ? alpha(CashlyTheme.accent.income, 0.25) : alpha(CashlyTheme.accent.purple, 0.25);
  const chipColor = isRecurring ? CashlyTheme.accent.income : CashlyTheme.accent.purple;
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 16,
        padding: 10,
        backgroundColor: alpha(CashlyTheme.accent.income, 0.08),
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: alpha(CashlyTheme.accent.income, 0.2),
        gap: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
        <CategoryBadge color={isRecurring ? CashlyTheme.accent.income : CashlyTheme.accent.purple} size={24} radius={8}>
          <Icon name={isRecurring ? 'briefcase' : 'cards'} color="#fff" size={13} />
        </CategoryBadge>
        <View
          style={{
            marginLeft: 'auto',
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: chipBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={isRecurring ? 'repeat' : 'flash'} color={chipColor} size={10} />
        </View>
      </View>
      <Text numberOfLines={1} style={{ fontSize: 10.5, color: tokens.textSecondary, fontWeight: '500' }}>
        {income.name}
      </Text>
      <Text style={{ fontSize: 13, fontWeight: '800', color: CashlyTheme.accent.income, letterSpacing: -0.2 }}>
        + {fmt(Number(income.amount), lang)}
      </Text>
      <Text style={{ fontSize: 10, color: tokens.textTertiary, fontWeight: '500' }}>
        {days === 0 ? t('today') : `${days} ${t('dayShort')}.`}
      </Text>
    </View>
  );
}

void shade;

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
});
